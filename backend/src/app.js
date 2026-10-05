const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const app = express();

const authRoutes = require("./routes/auth.routes")
const productRoutes = require("./routes/product.routes")
const adminRoutes = require("./routes/admin.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const orderRoutes = require("./routes/order.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const vendorRoutes = require("./routes/vendor.routes");
const reviewRoutes = require("./routes/review.routes");

app.set("trust proxy", 1);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- Rate limiters ----------
// General limiter: lenient in dev, strict in prod
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 300 : 10000,
  message: { success: false, message: "Too many requests, try again later." },
  skip: (req) => {
    // Don't rate-limit public read-only cached routes
    // (they're cheap and safe to serve at high volume)
    if (req.method === "GET" && req.path.startsWith("/products")) return true;
    if (req.method === "GET" && req.path.startsWith("/reviews")) return true;
    return false;
  },
});
app.use("/api", limiter);

// Auth limiter: still strict in prod, lenient in dev
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 30 : 1000,
  message: { success: false, message: "Too many auth attempts." },
});

app.use("/api/auth", limiter, authRoutes);
app.use("/api/products", productRoutes); 
app.use("/api/admin", adminRoutes); 
app.use("/api/cart", cartRoutes);         
app.use("/api/wishlist", wishlistRoutes); 
app.use("/api/orders", orderRoutes);  
app.use("/api/delivery", deliveryRoutes);  
app.use("/api/vendor", vendorRoutes);
app.use("/api/reviews", reviewRoutes);
 

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Vibes API is running"
    });
});

module.exports = app;