const Product = require("../models/Product");
const asyncHandler = require("../middlewares/async.handler");
const { uploadImage, deleteImage } = require("../services/upload.service");
const { cacheGet, cacheInvalidatePrefix } = require("../utils/cache");


const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category } = req.body;

  // ---- validation ----
  if (!name || !description || !price || !category) {
    const error = new Error(
      "Name, description, price and category are required",
    );
    error.statusCode = 400;
    throw error;
  }

  if (!req.files || req.files.length === 0) {
    const error = new Error("At least one product image is required");
    error.statusCode = 400;
    throw error;
  }

  if (req.files.length > 5) {
    const error = new Error("You can upload a maximum of 5 images");
    error.statusCode = 400;
    throw error;
  }

  // ---- upload all images to ImageKit in parallel ----
  const uploadPromises = req.files.map((file, idx) =>
    uploadImage(
      file.buffer,
      `${Date.now()}-${idx}-${file.originalname.replace(/\s+/g, "_")}`,
      "/products",
    ),
  );
  const images = await Promise.all(uploadPromises);

  // ---- save product ----
  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock) || 0,
    category: category.trim(),
    images,
    vendor: req.user._id, // 🔑 from `protect` middleware
  });

  cacheInvalidatePrefix("products:");

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

// ============================================================
// @desc    Get all products (public, filterable)
// @route   GET /api/products
// @access  Public
// ============================================================
const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    vendor,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { isActive: true };

  if (keyword) filter.$text = { $search: keyword };
  if (category) filter.category = category;
  if (vendor) filter.vendor = vendor;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("vendor", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    products,
  });
});

// ============================================================
// @desc    Get single product (public)
// @route   GET /api/products/:id
// @access  Public
// ============================================================
const getProduct = asyncHandler(async (req, res) => {
  const cacheKey = `products:single:${req.params.id}`;

  const { data, cached } = await cacheGet(
    cacheKey,
    async () => {
      const product = await Product.findById(req.params.id).populate(
        "vendor",
        "name email"
      );
      if (!product || !product.isActive) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
      }
      return { product };
    },
    120
  );

  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.status(200).json({ success: true, ...data });
});

// ============================================================
// @desc    Get vendor's own products
// @route   GET /api/products/mine
// @access  Private (vendor, admin)
// ============================================================
const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// ============================================================
// @desc    Update a product (VENDOR ONLY, must own it)
// @route   PUT /api/products/:id
// @access  Private (vendor, admin)
// ============================================================
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  // Ownership check (admin bypasses)
  if (
    product.vendor.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    const error = new Error("Not authorized to update this product");
    error.statusCode = 403;
    throw error;
  }

  // Update text fields only if provided
  if (req.body.name) product.name = req.body.name.trim();
  if (req.body.description) product.description = req.body.description.trim();
  if (req.body.price !== undefined) product.price = Number(req.body.price);
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
  if (req.body.category) product.category = req.body.category.trim();
  if (req.body.isActive !== undefined) {
    product.isActive =
      req.body.isActive === true || req.body.isActive === "true";
  }

  // If new images are uploaded → delete old ones → upload new ones
  if (req.files && req.files.length > 0) {
    if (req.files.length > 5) {
      const error = new Error("You can upload a maximum of 5 images");
      error.statusCode = 400;
      throw error;
    }

    // Delete old images from ImageKit (parallel, non-blocking)
    await Promise.all(product.images.map((img) => deleteImage(img.fileId)));

    // Upload new ones
    const uploadPromises = req.files.map((file, idx) =>
      uploadImage(
        file.buffer,
        `${Date.now()}-${idx}-${file.originalname.replace(/\s+/g, "_")}`,
        "/products",
      ),
    );
    product.images = await Promise.all(uploadPromises);
  }

  const updated = await product.save();

  cacheInvalidatePrefix("products:");

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updated,
  });
});

// ============================================================
// @desc    Delete a product (VENDOR ONLY, must own it)
// @route   DELETE /api/products/:id
// @access  Private (vendor, admin)
// ============================================================
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    product.vendor.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    const error = new Error("Not authorized to delete this product");
    error.statusCode = 403;
    throw error;
  }

  // Delete all images from ImageKit first
  await Promise.all(product.images.map((img) => deleteImage(img.fileId)));

  await product.deleteOne();

  cacheInvalidatePrefix("products:");
  
  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
};
