import axiosClient from "./axiosClient";

// ============================================================
// Review API
// ============================================================
const reviewApi = {
  // ---------- Public ----------
  // GET /api/reviews/:productId
  forProduct: (productId) =>
    axiosClient.get(`/reviews/${productId}`).then((r) => r.data),

  // ---------- Authenticated ----------
  // GET /api/reviews/my/list
  mine: () =>
    axiosClient.get("/reviews/my/list").then((r) => r.data),

  // POST /api/reviews/:productId  { rating, comment }
  add: (productId, payload) =>
    axiosClient.post(`/reviews/${productId}`, payload).then((r) => r.data),

  // PUT /api/reviews/:reviewId  { rating?, comment? }
  update: (reviewId, payload) =>
    axiosClient.put(`/reviews/${reviewId}`, payload).then((r) => r.data),

  // DELETE /api/reviews/:reviewId
  remove: (reviewId) =>
    axiosClient.delete(`/reviews/${reviewId}`).then((r) => r.data),
};

export default reviewApi;