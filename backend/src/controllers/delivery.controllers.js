const Order = require("../models/Order");
const asyncHandler = require("../middlewares/async.handler");

// ============================================================
// @desc    Get orders assigned to me
// @route   GET /api/delivery/orders
// @access  Private (delivery)
// ============================================================
const getAssignedOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    deliveryBoy: req.user._id,
    orderStatus: { $in: ["confirmed", "shipped", "out-for-delivery"] },
  })
    .populate("user", "name phone email")
    .populate("items.product", "name images")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// ============================================================
// @desc    Get delivery history (delivered orders)
// @route   GET /api/delivery/history
// @access  Private (delivery)
// ============================================================
const getDeliveryHistory = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    deliveryBoy: req.user._id,
    orderStatus: "delivered",
  })
    .populate("user", "name phone email")
    .sort({ deliveredAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// ============================================================
// @desc    Update order status (out-for-delivery etc.)
// @route   PUT /api/delivery/orders/:id/status
// @access  Private (delivery)
// ============================================================
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const allowed = ["out-for-delivery", "shipped"];
  if (!allowed.includes(orderStatus)) {
    const error = new Error(
      `Status must be one of: ${allowed.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.deliveryBoy?.toString() !== req.user._id.toString()) {
    const error = new Error("This order is not assigned to you");
    error.statusCode = 403;
    throw error;
  }

  if (order.orderStatus === "delivered") {
    const error = new Error("Order is already delivered");
    error.statusCode = 400;
    throw error;
  }

  order.orderStatus = orderStatus;
  await order.save();

  res.status(200).json({
    success: true,
    message: `Order status updated to '${orderStatus}'`,
    order,
  });
});

// ============================================================
// @desc    Mark order as delivered
// @route   PUT /api/delivery/orders/:id/deliver
// @access  Private (delivery)
// ============================================================
const markDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.deliveryBoy?.toString() !== req.user._id.toString()) {
    const error = new Error("This order is not assigned to you");
    error.statusCode = 403;
    throw error;
  }

  if (order.isDelivered) {
    const error = new Error("Order already marked as delivered");
    error.statusCode = 400;
    throw error;
  }

  // If COD, the delivery boy collects cash → mark paid
  if (order.paymentMethod === "cod") {
    if (!order.codConfirmed) {
      const error = new Error(
        "Please confirm COD cash collection before marking as delivered"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  order.isDelivered = true;
  order.deliveredAt = new Date();
  order.orderStatus = "delivered";

  await order.save();

  res.status(200).json({
    success: true,
    message:
      order.paymentMethod === "cod"
        ? "Order delivered and cash collected"
        : "Order marked as delivered",
    order,
  });
});

// ============================================================
// @desc    Confirm COD cash collected
// @route   PUT /api/delivery/orders/:id/confirm-cod
// @access  Private (delivery)
// ============================================================
const confirmCodPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.deliveryBoy?.toString() !== req.user._id.toString()) {
    const error = new Error("This order is not assigned to you");
    error.statusCode = 403;
    throw error;
  }

  if (order.paymentMethod !== "cod") {
    const error = new Error("This is not a COD order");
    error.statusCode = 400;
    throw error;
  }

  if (order.codConfirmed) {
    const error = new Error("COD already confirmed");
    error.statusCode = 400;
    throw error;
  }

  order.codConfirmed = true;
  order.paymentStatus = "paid";
  order.isPaid = true;
  order.paidAt = new Date();
  await order.save();

  res.status(200).json({
    success: true,
    message: "COD payment confirmed. You may now mark the order delivered.",
    order,
  });
});

module.exports = {
  getAssignedOrders,
  getDeliveryHistory,
  updateOrderStatus,
  markDelivered,
  confirmCodPayment,
};