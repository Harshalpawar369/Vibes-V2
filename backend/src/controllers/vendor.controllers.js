const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");
const asyncHandler = require("../middlewares/async.handler");
const { uploadImage, deleteImage } = require("../services/upload.service");

// ============================================================
// @desc    Vendor dashboard stats
// @route   GET /api/vendor/dashboard
// @access  Private (vendor)
// ============================================================
const getDashboard = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const [totalProducts, totalOrders, bestSelling, recentReviews] =
    await Promise.all([
      Product.countDocuments({ vendor: vendorId }),
      Order.countDocuments({ "items.vendor": vendorId }),
      Product.find({ vendor: vendorId })
        .sort({ sold: -1 })
        .limit(5)
        .select("name sold price images"),
      Review.find({})
        .populate({
          path: "product",
          match: { vendor: vendorId },
          select: "name vendor",
        })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

  // Filter reviews that actually belong to this vendor
  const filteredReviews = recentReviews.filter((r) => r.product);

  res.status(200).json({
    success: true,
    stats: { totalProducts, totalOrders },
    bestSelling,
    recentReviews: filteredReviews,
  });
});

// ============================================================
// @desc    Get my orders (orders containing my products)
// @route   GET /api/vendor/orders
// @access  Private (vendor)
// ============================================================
const getMyOrders = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const orders = await Order.find({ "items.vendor": vendorId })
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });

  // Optionally: filter each order's items to only show this vendor's items
  const filtered = orders.map((order) => {
    const obj = order.toObject();
    obj.items = obj.items.filter(
      (item) => item.vendor.toString() === vendorId.toString()
    );
    return obj;
  });

  res.status(200).json({
    success: true,
    count: filtered.length,
    orders: filtered,
  });
});

// ============================================================
// @desc    Get my reviews
// @route   GET /api/vendor/reviews
// @access  Private (vendor)
// ============================================================
const getMyReviews = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const products = await Product.find({ vendor: vendorId }).select("_id");
  const productIds = products.map((p) => p._id);

  const reviews = await Review.find({ product: { $in: productIds } })
    .populate("user", "name")
    .populate("product", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews,
  });
});

module.exports = {
  getDashboard,
  getMyOrders,
  getMyReviews,
};