const { v4: uuidv4 } = require("uuid");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/async.handler");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../services/razorpay.service");


// ---------- helper: build a fresh order object from cart ----------
const buildOrderFromCart = async (userId, shippingAddress, paymentMethod) => {
  // 1. Load cart with populated products
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    const error = new Error("Your cart is empty");
    error.statusCode = 400;
    throw error;
  }

  // 2. Build items array + validate stock
  const items = [];
  let itemsPrice = 0;

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      const error = new Error(
        "One of the products is no longer available. Please update your cart."
      );
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < item.quantity) {
      const error = new Error(
        `Only ${product.stock} items in stock for "${product.name}"`
      );
      error.statusCode = 400;
      throw error;
    }

    items.push({
      product: product._id,
      vendor: product.vendor,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images?.[0]?.url || "",
    });

    itemsPrice += product.price * item.quantity;
  }

  // 3. Shipping logic (free above 500)
  const shippingPrice = itemsPrice > 500 ? 0 : 50;
  const totalPrice = itemsPrice + shippingPrice;

  // 4. Human-readable order ID
  const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

  return {
    orderId,
    user: userId,
    items,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
  };
};

// ---------- helper: decrement stock + increment sold ----------
const applyStockChanges = async (order) => {
  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      })
    )
  );
};

// ============================================================
// @desc    Create a new order (COD or Razorpay)
// @route   POST /api/orders
// @access  Private (user)
// ============================================================
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  // ---- validate ----
  if (!shippingAddress || !paymentMethod) {
    const error = new Error("Shipping address and payment method are required");
    error.statusCode = 400;
    throw error;
  }

  const required = ["fullName", "phone", "address", "city", "state", "pincode"];
  for (const field of required) {
    if (!shippingAddress[field]) {
      const error = new Error(`Shipping address field "${field}" is required`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (!["cod", "razorpay"].includes(paymentMethod)) {
    const error = new Error("Payment method must be 'cod' or 'razorpay'");
    error.statusCode = 400;
    throw error;
  }

  // ---- build order data from cart ----
  const orderData = await buildOrderFromCart(
    req.user._id,
    shippingAddress,
    paymentMethod
  );

  // ============================================================
  // RAZORPAY FLOW: create order + razorpay order, return to client
  // ============================================================
  if (paymentMethod === "razorpay") {
    const razorpayOrder = await createRazorpayOrder(
      orderData.totalPrice,
      orderData.orderId
    );

    orderData.razorpayOrderId = razorpayOrder.id;
    orderData.paymentStatus = "pending";

    const order = await Order.create(orderData);

    return res.status(201).json({
      success: true,
      message: "Order created. Complete payment to confirm.",
      order,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // paise
        currency: razorpayOrder.currency,
      },
    });
  }

  // ============================================================
  // COD FLOW: order placed instantly, stock decremented, cart cleared
  // ============================================================
  const order = await Order.create(orderData);

  await applyStockChanges(order);

  // clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json({
    success: true,
    message: "Order placed successfully (Cash on Delivery)",
    order,
  });
});

// ============================================================
// @desc    Verify Razorpay payment + finalize order
// @route   POST /api/orders/verify
// @access  Private (user)
// ============================================================
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !orderId
  ) {
    const error = new Error("Missing payment verification fields");
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify signature
  const valid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!valid) {
    const error = new Error("Invalid payment signature");
    error.statusCode = 400;
    throw error;
  }

  // 2. Find order
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  // 3. Ensure ownership
  if (order.user.toString() !== req.user._id.toString()) {
    const error = new Error("Not authorized");
    error.statusCode = 403;
    throw error;
  }

  // 4. Prevent double-processing
  if (order.isPaid) {
    const error = new Error("Order already paid");
    error.statusCode = 400;
    throw error;
  }

  // 5. Update order
  order.paymentStatus = "paid";
  order.isPaid = true;
  order.paidAt = new Date();
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.orderStatus = "confirmed";
  await order.save();

  // 6. Decrement stock & clear cart
  await applyStockChanges(order);
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    order,
  });
});

// ============================================================
// @desc    Get my orders
// @route   GET /api/orders/my
// @access  Private (user)
// ============================================================
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.product", "name images")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// ============================================================
// @desc    Get one order (owner only)
// @route   GET /api/orders/:id
// @access  Private (user)
// ============================================================
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email phone")
    .populate("items.product", "name images");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    const error = new Error("Not authorized");
    error.statusCode = 403;
    throw error;
  }

  res.status(200).json({ success: true, order });
});

// ============================================================
// @desc    Cancel my order (only if not shipped)
// @route   PUT /api/orders/:id/cancel
// @access  Private (user)
// ============================================================
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.user.toString() !== req.user._id.toString()) {
    const error = new Error("Not authorized");
    error.statusCode = 403;
    throw error;
  }

  const locked = ["shipped", "out-for-delivery", "delivered", "cancelled"];
  if (locked.includes(order.orderStatus)) {
    const error = new Error(
      `Order cannot be cancelled once it is ${order.orderStatus}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Restore stock (only if stock was already decremented)
  // For COD: stock was decremented at creation.
  // For Razorpay: stock is only decremented after payment, so if unpaid, skip.
  const stockWasApplied = order.paymentMethod === "cod" || order.isPaid;

  if (stockWasApplied) {
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        })
      )
    );
  }

  order.orderStatus = "cancelled";
  if (order.isPaid && order.paymentMethod === "razorpay") {
    order.paymentStatus = "refunded"; // mark for admin action
  }
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrder,
  cancelOrder,
};