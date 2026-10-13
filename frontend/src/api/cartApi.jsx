import axiosClient from "./axiosClient";

// ============================================================
// Cart API
// ============================================================
const cartApi = {
  // GET /api/cart
  get: () =>
    axiosClient.get("/cart").then((r) => r.data),

  // POST /api/cart  { productId, quantity }
  add: ({ productId, quantity = 1 }) =>
    axiosClient.post("/cart", { productId, quantity }).then((r) => r.data),

  // PUT /api/cart/:productId  { quantity }
  update: (productId, quantity) =>
    axiosClient.put(`/cart/${productId}`, { quantity }).then((r) => r.data),

  // DELETE /api/cart/:productId
  remove: (productId) =>
    axiosClient.delete(`/cart/${productId}`).then((r) => r.data),

  // DELETE /api/cart
  clear: () =>
    axiosClient.delete("/cart").then((r) => r.data),
};

export default cartApi;