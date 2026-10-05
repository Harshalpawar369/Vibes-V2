const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/async.handler");

// ============================================================
// @desc    Get my wishlist
// @route   GET /api/wishlist
// @access  Private (user)
// ============================================================
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: "products",
    populate: { path: "vendor", select: "name" },
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.status(200).json({ success: true, wishlist });
});

// ============================================================
// @desc    Toggle a product in wishlist (add if missing, remove if present)
// @route   POST /api/wishlist/:productId
// @access  Private (user)
// ============================================================
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const idx = wishlist.products.findIndex(
    (p) => p.toString() === productId
  );

  let message;
  let added;

  if (idx > -1) {
    wishlist.products.splice(idx, 1);
    message = "Removed from wishlist";
    added = false;
  } else {
    wishlist.products.push(productId);
    message = "Added to wishlist";
    added = true;
  }

  await wishlist.save();
  await wishlist.populate({
    path: "products",
    populate: { path: "vendor", select: "name" },
  });

  res.status(200).json({
    success: true,
    message,
    added, // 👈 helpful for frontend to know what happened
    wishlist,
  });
});

// ============================================================
// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private (user)
// ============================================================
const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = [];
    await wishlist.save();
  }

  res.status(200).json({
    success: true,
    message: "Wishlist cleared",
  });
});

module.exports = {
  getWishlist,
  toggleWishlist,
  clearWishlist,
};