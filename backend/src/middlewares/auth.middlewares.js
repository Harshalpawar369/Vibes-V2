const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./async.handler");

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    const error = new Error("Not authorized, please login");
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.userId).select("-password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Account disabled");
    error.statusCode = 403;
    throw error;
  }

  req.user = user;
  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Not authenticated");
      error.statusCode = 401;
      return next(error);
    }
    if (!roles.includes(req.user.role)) {
      const error = new Error(
        `Role '${req.user.role}' is not allowed to access this resource`
      );
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

module.exports = { protect, authorize };