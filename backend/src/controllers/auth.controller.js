const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../middlewares/async.handler.js");
const generateToken = require("../utils/generate.token.js");

// ============================================================
// @desc    Register a new user (public — only "user" role)
// @route   POST /api/auth/register
// @access  Public
// ============================================================
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    const error = new Error("Name, email, password and phone are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("User with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Public registration always creates a user account.
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone,
    role: "user",
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// ============================================================
// @desc    Login (works for user / vendor / delivery / admin)
// @route   POST /api/auth/login
// @access  Public
// ============================================================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password",
  );

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account has been disabled. Contact admin.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// ============================================================
// @desc    Logout (clear cookie)
// @route   POST /api/auth/logout
// @access  Private (any role)
// ============================================================
const logout = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// ============================================================
// @desc    Check if user is logged in (does NOT throw 401)
// @route   GET /api/auth/is-logged-in
// @access  Public
// ============================================================
const isLoggedIn = asyncHandler(async (req, res) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(200).json({ isLoggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(200).json({ isLoggedIn: false });
    }

    return res.status(200).json({
      isLoggedIn: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(200).json({ isLoggedIn: false });
  }
});

// ============================================================
// @desc    Get current user profile (any role)
// @route   GET /api/auth/profile
// @access  Private
// ============================================================
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// ============================================================
// @desc    Update current user profile (any role)
// @route   PUT /api/auth/profile
// @access  Private
// ============================================================
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // If email is being changed, make sure it's not taken
  if (req.body.email) {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists) {
        const error = new Error("Email is already in use");
        error.statusCode = 409;
        throw error;
      }
      user.email = normalizedEmail;
    }
  }

  if (req.body.name) user.name = req.body.name.trim();
  if (req.body.phone) user.phone = req.body.phone.trim();

  if (req.body.password) {
    user.password = await bcrypt.hash(req.body.password, 12);
  }

  const updated = await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
    },
  });
});

// ============================================================
// @desc    Delete own account (any role)
// @route   DELETE /api/auth/profile
// @access  Private
// ============================================================
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await user.deleteOne();

  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

// ============================================================
// @desc    Create vendor / delivery / admin (admin only)
// @route   POST /api/auth/create-account
// @access  Private (admin only)
// ============================================================
// ============================================================
// @desc    Customer requests to become a vendor
// @route   POST /api/auth/request-vendor
// @access  Private (customer only)
// ============================================================
const requestVendor = asyncHandler(async (req, res) => {
  const { businessName, businessAddress, businessPhone, reason } = req.body;

  if (!businessName || !businessAddress || !businessPhone) {
    const error = new Error(
      "Business name, address and phone are required"
    );
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Already a vendor?
  if (user.role === "vendor") {
    const error = new Error("You are already a vendor");
    error.statusCode = 400;
    throw error;
  }

  // Already pending?
  if (user.vendorRequestStatus === "pending") {
    const error = new Error(
      "You already have a pending vendor request. Please wait for admin review."
    );
    error.statusCode = 409;
    throw error;
  }

  // Update user
  user.vendorRequestStatus = "pending";
  user.vendorRequestDetails = {
    businessName: businessName.trim(),
    businessAddress: businessAddress.trim(),
    businessPhone: businessPhone.trim(),
    reason: reason ? reason.trim() : "",
    requestedAt: new Date(),
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Vendor request submitted. Admin will review it shortly.",
    vendorRequestStatus: user.vendorRequestStatus,
  });
});

// ============================================================
// @desc    Get my vendor request status
// @route   GET /api/auth/vendor-request-status
// @access  Private (customer)
// ============================================================
const getVendorRequestStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "role vendorRequestStatus vendorRequestDetails vendorRejectionReason vendorRequestReviewedAt"
  );

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    role: user.role,
    vendorRequestStatus: user.vendorRequestStatus,
    vendorRequestDetails: user.vendorRequestDetails || null,
    rejectionReason: user.vendorRejectionReason || null,
    reviewedAt: user.vendorRequestReviewedAt || null,
  });
});



module.exports = {
  register,
  login,
  logout,
  isLoggedIn,
  getProfile,
  updateProfile,
  deleteUser,
  requestVendor,
  getVendorRequestStatus,
};