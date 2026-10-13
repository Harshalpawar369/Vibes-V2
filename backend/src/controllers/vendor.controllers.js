const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");
const asyncHandler = require("../middlewares/async.handler");

const getDashboard = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  // STRICT FILTER: Only count valid, non-cancelled, paid (or COD) orders
  const validOrderQuery = {
    "items.vendor": vendorId,
    orderStatus: { $ne: "cancelled" },
    $or: [
      { paymentMethod: "cod" },
      { paymentMethod: "razorpay", isPaid: true }
    ]
  };

  const [totalProducts, totalOrders, bestSelling, recentReviews] =
    await Promise.all([
      Product.countDocuments({ vendor: vendorId }),
      Order.countDocuments(validOrderQuery),
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

  const filteredReviews = recentReviews.filter((r) => r.product);

  res.status(200).json({
    success: true,
    stats: { totalProducts, totalOrders },
    bestSelling,
    recentReviews: filteredReviews,
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const orders = await Order.find({ "items.vendor": vendorId })
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });

  const filtered = orders.map((order) => {
    const obj = order.toObject();
    
    // Filter items to only show this specific vendor's products
    obj.items = obj.items.filter(
      (item) => item.vendor.toString() === vendorId.toString()
    );
    
    // CALCULATE VENDOR TOTAL: Only show the vendor what THEY earned from this order
    let vendorTotal = 0;
    obj.items.forEach(item => {
      vendorTotal += (item.price * item.quantity);
    });
    
    obj.vendorTotal = vendorTotal; // Add this specific total to the payload
    
    return obj;
  });

  res.status(200).json({
    success: true,
    count: filtered.length,
    orders: filtered,
  });
});

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