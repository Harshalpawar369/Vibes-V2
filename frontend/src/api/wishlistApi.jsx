import axiosClient from "./axiosClient";

// ============================================================
// Wishlist API
// ============================================================
const wishlistApi = {
  // GET /api/wishlist
  get: () =>
    axiosClient.get("/wishlist").then((r) => r.data),

  // POST /api/wishlist/:productId  — toggle (adds if absent, removes if present)
  toggle: (productId) =>
    axiosClient.post(`/wishlist/${productId}`).then((r) => r.data),

  // DELETE /api/wishlist
  clear: () =>
    axiosClient.delete("/wishlist").then((r) => r.data),
};

export default wishlistApi;