const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/async.handler");

// Helper function to get popular products based on rating & review count
const getPopularProducts = async () => {
  return await Product.find({ isActive: true })
    .sort({ rating: -1, numReviews: -1 })
    .limit(4);
};

const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Get past non-cancelled orders to build user taste profile
  const pastOrders = await Order.find({
    user: userId,
    orderStatus: { $ne: "cancelled" }
  }).populate("items.product");

  let userTastes = "";
  pastOrders.forEach((order) => {
    order.items.forEach((line) => {
      if (line.product) {
        userTastes += `${line.product.category || ""} ${line.product.name || ""} `;
      }
    });
  });

  // 2. Immediate Fallback: If user has no orders, return popular products
  if (!userTastes.trim()) {
    const popularProducts = await getPopularProducts();
    return res.status(200).json({
      success: true,
      source: "popular_no_history",
      products: popularProducts,
    });
  }

  // 3. Prepare the Timeout (AbortController) for the Python request
  const controller = new AbortController();
  const timeoutMs = 3000; // 3 seconds max allowed time
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 4. Call Python API
    const pythonResponse = await fetch("http://localhost:8000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_features: userTastes.trim() }),
      signal: controller.signal, 
    });

    clearTimeout(timeoutId);

    if (!pythonResponse.ok) {
      throw new Error(`Python API Error: ${pythonResponse.status}`);
    }

    const data = await pythonResponse.json();

    // 5. Fallback if Python returns no relevant matches
    if (!data.ids || data.ids.length === 0) {
      const popularProducts = await getPopularProducts();
      return res.status(200).json({
        success: true,
        source: "popular_no_matches",
        products: popularProducts,
      });
    }

    // 6. Return personalized products
    const recommendedProducts = await Product.find({
      _id: { $in: data.ids },
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      source: "ai_personalized",
      products: recommendedProducts,
    });

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Log the error (Timeout or Connection Refused) so you can debug later
    console.error("Recommendation Engine Error:", error.message);

    // 7. Rescue Fallback: If Python server is down or times out, serve popular products
    const popularProducts = await getPopularProducts();
    return res.status(200).json({
      success: true,
      source: "popular_fallback_server_error",
      products: popularProducts,
    });
  }
});

module.exports = { getRecommendations };