const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/async.handler");

// ============================================================
// @desc    Get my cart (creates empty cart if none)
// @route   GET /api/cart
// @access  Private (user)
// ============================================================
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    populate: { path: "vendor", select: "name" },
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({ success: true, cart });
});

// ============================================================
// @desc    Add product to cart (or increase quantity)
// @route   POST /api/cart
// @access  Private (user)
// ============================================================
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    const error = new Error("Product ID is required");
    error.statusCode = 400;
    throw error;
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty < 1) {
    const error = new Error("Quantity must be at least 1");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (product.stock < qty) {
    const error = new Error(`Only ${product.stock} items in stock`);
    error.statusCode = 400;
    throw error;
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existing = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (existing) {
    const newQty = existing.quantity + qty;
    if (product.stock < newQty) {
      const error = new Error(`Only ${product.stock} items in stock`);
      error.statusCode = 400;
      throw error;
    }
    existing.quantity = newQty;
  } else {
    cart.items.push({ product: productId, quantity: qty });
  }

  await cart.save();
  await cart.populate({
    path: "items.product",
    populate: { path: "vendor", select: "name" },
  });

  res.status(200).json({
    success: true,
    message: "Added to cart",
    cart,
  });
});

// ============================================================
// @desc    Update quantity of a cart item
// @route   PUT /api/cart/:productId
// @access  Private (user)
// ============================================================
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  const qty = Number(quantity);
  if (isNaN(qty) || qty < 1) {
    const error = new Error("Quantity must be at least 1");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (product.stock < qty) {
    const error = new Error(`Only ${product.stock} items in stock`);
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    const error = new Error("Item not in cart");
    error.statusCode = 404;
    throw error;
  }

  item.quantity = qty;
  await cart.save();
  await cart.populate({
    path: "items.product",
    populate: { path: "vendor", select: "name" },
  });

  res.status(200).json({
    success: true,
    message: "Cart updated",
    cart,
  });
});

// ============================================================
// @desc    Remove a product from cart
// @route   DELETE /api/cart/:productId
// @access  Private (user)
// ============================================================
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  cart.items = cart.items.filter(
    (i) => i.product.toString() !== req.params.productId
  );

  await cart.save();
  await cart.populate({
    path: "items.product",
    populate: { path: "vendor", select: "name" },
  });

  res.status(200).json({
    success: true,
    message: "Removed from cart",
    cart,
  });
});

// ============================================================
// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private (user)
// ============================================================
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: "Cart cleared",
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
