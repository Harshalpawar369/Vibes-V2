
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const path = require("path");

const app = express();

require("./config/passport");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const adminRoutes = require("./routes/admin.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const orderRoutes = require("./routes/order.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const vendorRoutes = require("./routes/vendor.routes");
const reviewRoutes = require("./routes/review.routes");
const recommendationRoutes = require("./routes/recommendation.routes");


app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

// General API rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                // Increased from 300
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  skip: (req) => process.env.DISABLE_RATE_LIMIT === "true",
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // Increased from 30
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication requests. Please try again later.",
  },
  skip: (req) => process.env.DISABLE_RATE_LIMIT === "true",
});

// Apply general limiter to API requests.
app.use("/api", limiter);

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Serve the React production build from backend/public.
const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vibes API is running",
  });
});

// Root route: return the React app if the build exists.
app.get("/", (req, res, next) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) next(err);
  });
});

// React SPA fallback for client-side routes.
// Keep API requests from falling back to index.html.
app.use((req, res, next) => {
  if (
    req.method !== "GET" ||
    req.path.startsWith("/api/") ||
    req.path === "/api"
  ) {
    return next();
  }

  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) next(err);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack:
      process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

module.exports = app;
