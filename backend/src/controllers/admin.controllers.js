const User = require("../models/User");
const Order = require("../models/Order");
const asyncHandler = require("../middlewares/async.handler");
const bcrypt = require("bcrypt");

// ============================================================
// @desc    List all pending vendor requests
// @route   GET /api/admin/vendor-requests
// @access  Private (admin only)
// ============================================================
const getPendingVendorRequests = asyncHandler(async (req, res) => {
  const requests = await User.find({ vendorRequestStatus: "pending" })
    .select(
      "name email phone vendorRequestDetails vendorRequestStatus createdAt"
    )
    .sort({ "vendorRequestDetails.requestedAt": 1 }); // oldest first

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});

// ============================================================
// @desc    List all vendors (approved + rejected history)
// @route   GET /api/admin/vendors
// @access  Private (admin only)
// ============================================================
const getAllVendors = asyncHandler(async (req, res) => {
  const { status } = req.query; // "pending" | "approved" | "rejected"

  const filter = {};
  if (status) filter.vendorRequestStatus = status;

  const vendors = await User.find(filter)
    .select(
      "name email phone role vendorRequestStatus vendorRequestDetails vendorRejectionReason vendorRequestReviewedAt createdAt"
    )
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: vendors.length,
    vendors,
  });
});

// ============================================================
// @desc    Approve a vendor request
// @route   PUT /api/admin/vendor-requests/:id/approve
// @access  Private (admin only)
// ============================================================
const approveVendor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.vendorRequestStatus !== "pending") {
    const error = new Error(
      `Cannot approve — request status is '${user.vendorRequestStatus}'`
    );
    error.statusCode = 400;
    throw error;
  }

  user.role = "vendor";
  user.vendorRequestStatus = "approved";
  user.vendorRequestReviewedBy = req.user._id;
  user.vendorRequestReviewedAt = new Date();
  user.vendorRejectionReason = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: `${user.name} is now a vendor`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorRequestStatus: user.vendorRequestStatus,
    },
  });
});

// ============================================================
// @desc    Reject a vendor request
// @route   PUT /api/admin/vendor-requests/:id/reject
// @access  Private (admin only)
// ============================================================
const rejectVendor = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.vendorRequestStatus !== "pending") {
    const error = new Error(
      `Cannot reject — request status is '${user.vendorRequestStatus}'`
    );
    error.statusCode = 400;
    throw error;
  }

  user.vendorRequestStatus = "rejected";
  user.vendorRequestReviewedBy = req.user._id;
  user.vendorRequestReviewedAt = new Date();
  user.vendorRejectionReason = reason ? reason.trim() : "No reason provided";

  // If they were somehow already a vendor, demote
  if (user.role === "vendor") {
    user.role = "customer";
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `Vendor request from ${user.name} rejected`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorRequestStatus: user.vendorRequestStatus,
      rejectionReason: user.vendorRejectionReason,
    },
  });
});

// ============================================================
// @desc    Admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (admin only)
// ============================================================
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalCustomers,
    totalVendors,
    totalDelivery,
    pendingVendorRequests,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "vendor" }),
    User.countDocuments({ role: "delivery" }),
    User.countDocuments({ vendorRequestStatus: "pending" }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalCustomers,
      totalVendors,
      totalDelivery,
      pendingVendorRequests,
    },
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.query;

  const filter = {};
  if (status) filter.orderStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .populate("deliveryBoy", "name phone email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email phone")
    .populate("deliveryBoy", "name phone email")
    .populate("items.product", "name images price")
    .populate("items.vendor", "name email");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({ success: true, order });
});

const assignDelivery = asyncHandler(async (req, res) => {
  const { deliveryBoyId } = req.body;

  if (!deliveryBoyId) {
    const error = new Error("deliveryBoyId is required");
    error.statusCode = 400;
    throw error;
  }

  const delivery = await User.findById(deliveryBoyId);
  if (!delivery || delivery.role !== "delivery") {
    const error = new Error("Invalid delivery boy");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.orderStatus === "delivered") {
    const error = new Error("Cannot reassign a delivered order");
    error.statusCode = 400;
    throw error;
  }

  if (order.orderStatus === "cancelled") {
    const error = new Error("Cannot assign a cancelled order");
    error.statusCode = 400;
    throw error;
  }

  order.deliveryBoy = delivery._id;
  // Move status forward if it was still "placed"
  if (order.orderStatus === "placed" || order.orderStatus === "confirmed") {
    order.orderStatus = "shipped";
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: `Order assigned to ${delivery.name}`,
    order,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const valid = [
    "placed",
    "confirmed",
    "shipped",
    "out-for-delivery",
    "delivered",
    "cancelled",
  ];

  if (!valid.includes(orderStatus)) {
    const error = new Error(`Status must be one of: ${valid.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  order.orderStatus = orderStatus;

  if (orderStatus === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    // Auto-mark paid for COD when delivered by admin
    if (order.paymentMethod === "cod" && !order.isPaid) {
      order.isPaid = true;
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      order.codConfirmed = true;
    }
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated",
    order,
  });
});

const getDeliveryBoys = asyncHandler(async (req, res) => {
  const boys = await User.find({ role: "delivery", isActive: true })
    .select("name email phone")
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: boys.length,
    deliveryBoys: boys,
  });
});

// ============================================================
// @desc    Create a staff account (delivery / admin)
// @route   POST /api/admin/create-staff
// @access  Private (admin)
// ============================================================
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  // ---- validate ----
  if (!name || !email || !password || !phone || !role) {
    const error = new Error(
      "Name, email, password, phone and role are required"
    );
    error.statusCode = 400;
    throw error;
  }

  const allowedRoles = ["delivery", "admin"];
  if (!allowedRoles.includes(role)) {
    const error = new Error(
      `Role must be one of: ${allowedRoles.join(", ")}. Vendors self-register via /auth/request-vendor.`
    );
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const error = new Error("User with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const staff = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone.trim(),
    role,
  });

  res.status(201).json({
    success: true,
    message: `${role} account created successfully`,
    user: {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
    },
  });
});

// ============================================================
// @desc    Toggle active status of any user (soft disable)
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private (admin)
// ============================================================
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Admin cannot deactivate themselves
  if (user._id.toString() === req.user._id.toString()) {
    const error = new Error("You cannot deactivate your own account");
    error.statusCode = 400;
    throw error;
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"}`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

// ============================================================
// @desc    List all users (with filters)
// @route   GET /api/admin/users
// @access  Private (admin)
// ============================================================
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

// ============================================================
// @desc    Delete a user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
// ============================================================
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user._id.toString() === req.user._id.toString()) {
    const error = new Error("You cannot delete your own account");
    error.statusCode = 400;
    throw error;
  }

  // Root admin safety: don't allow deleting the bootstrap admin
  if (user.email === "admin@example.com") {
    const error = new Error("Cannot delete the bootstrap admin");
    error.statusCode = 403;
    throw error;
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});



module.exports = {
  getPendingVendorRequests,
  getAllVendors,
  approveVendor,
  rejectVendor,
  getDashboard,
  getAllOrders,
  getOrderById,
  assignDelivery,
  updateOrderStatus,
  getDeliveryBoys,
   createStaff,
  toggleUserActive,
  getAllUsers,
  deleteUser,
};