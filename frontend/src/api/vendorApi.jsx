import axiosClient from "./axiosClient";

// ============================================================
// Vendor API — dashboard, orders, reviews (view-only side)
// Product CRUD lives in productApi
// ============================================================
const vendorApi = {
  // GET /api/vendor/dashboard
  dashboard: () =>
    axiosClient.get("/vendor/dashboard").then((r) => r.data),

  // GET /api/vendor/orders
  orders: () =>
    axiosClient.get("/vendor/orders").then((r) => r.data),

  // GET /api/vendor/reviews
  reviews: () =>
    axiosClient.get("/vendor/reviews").then((r) => r.data),
};

export default vendorApi;