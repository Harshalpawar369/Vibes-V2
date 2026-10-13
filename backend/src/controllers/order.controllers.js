const { v4: uuidv4 } = require("uuid");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/async.handler");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../services/razorpay.service");

const buildOrderFromCart = async (userId, shippingAddress, paymentMethod) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    populate: { path: "vendor", select: "razorpayAccountId" }
  });

  if (!cart || cart.items.length === 0) {
    const error = new Error("Your cart is empty");
    error.statusCode = 400;
    throw error;
  }

  const items = [];
  let itemsPrice = 0;
  const vendorTotals = {}; 

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      const error = new Error("One of the products is no longer available.");
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < item.quantity) {
      const error = new Error(`Only ${product.stock} items in stock for "${product.name}"`);
      error.statusCode = 400;
      throw error;
    }

    const itemTotal = product.price * item.quantity;
    itemsPrice += itemTotal;

    const vendorId = product.vendor._id.toString();
    if (!vendorTotals[vendorId]) {
      vendorTotals[vendorId] = {
        account: product.vendor.razorpayAccountId, 
        amount: 0
      };
    }
    vendorTotals[vendorId].amount += itemTotal;

    items.push({
      product: product._id,
      vendor: product.vendor._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images?.[0]?.url || "",
    });
  }

  const shippingPrice = itemsPrice > 500 ? 0 : 50;
  const totalPrice = itemsPrice + shippingPrice;
  const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

  const transfers = [];
  for (const vId in vendorTotals) {
    const vendorData = vendorTotals[vId];
    if (vendorData.account) {
      transfers.push({
        account: vendorData.account,
        amount: Math.round(vendorData.amount * 100), 
        currency: "INR",
        on_hold: false
      });
    }
  }

  return {
    orderId,
    user: userId,
    items,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    transfers 
  };
};

const applyStockChanges = async (order) => {
  await Promise.all(
    order.items.map((item) => {
      // Ensure we extract the ID if 'product' is a populated object, otherwise use it directly
      const productId = item.product._id ? item.product._id : item.product;
      
      return Product.findByIdAndUpdate(productId, {
        $inc: { stock: -Number(item.quantity), sold: Number(item.quantity) },
      });
    })
  );
};

// HELPER: Guarantees stock is added back correctly
const restoreStockChanges = async (order) => {
  const stockWasApplied = order.paymentMethod === "cod" || order.isPaid;
  if (stockWasApplied) {
    await Promise.all(
      order.items.map((item) => {
        // Ensure we extract the ID if 'product' is a populated object, otherwise use it directly
        const productId = item.product._id ? item.product._id : item.product;

        return Product.findByIdAndUpdate(productId, {
          $inc: { stock: Number(item.quantity), sold: -Number(item.quantity) },
        });
      })
    );
  }
};

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

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

  const orderData = await buildOrderFromCart(
    req.user._id,
    shippingAddress,
    paymentMethod
  );

  if (paymentMethod === "razorpay") {
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder(
        orderData.totalPrice,
        orderData.orderId,
        orderData.transfers
      );
    } catch (razorpayError) {
      const error = new Error(
        razorpayError?.error?.description ||
          razorpayError?.description ||
          "Unable to create the online payment order. Please try again."
      );
      error.statusCode = 502;
      throw error;
    }

    orderData.razorpayOrderId = razorpayOrder.id;
    orderData.paymentStatus = "pending";
    delete orderData.transfers; 
    
    const order = await Order.create(orderData);

    return res.status(201).json({
      success: true,
      message: "Order created. Complete payment to confirm.",
      order,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount, 
        currency: razorpayOrder.currency,
      },
    });
  }

  const order = await Order.create(orderData);
  await applyStockChanges(order);
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json({
    success: true,
    message: "Order placed successfully (Cash on Delivery)",
    order,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    const error = new Error("Missing payment verification fields");
    error.statusCode = 400;
    throw error;
  }

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

  const order = await Order.findById(orderId);
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

  if (order.isPaid) {
    const error = new Error("Order already paid");
    error.statusCode = 400;
    throw error;
  }

  order.paymentStatus = "paid";
  order.isPaid = true;
  order.paidAt = new Date();
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.orderStatus = "confirmed";
  await order.save();

  await applyStockChanges(order);
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    order,
  });
});

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

  // Use the new helper to guarantee stock is added back
  await restoreStockChanges(order);

  order.orderStatus = "cancelled";
  if (order.isPaid && order.paymentMethod === "razorpay") {
    order.paymentStatus = "refunded"; 
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