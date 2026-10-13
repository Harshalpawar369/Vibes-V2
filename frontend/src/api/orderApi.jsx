import axiosClient from "./axiosClient";

// ============================================================
// Order API
// ============================================================
const orderApi = {
  // POST /api/orders
  // { shippingAddress: {...}, paymentMethod: "cod" | "razorpay" }
  create: (payload) =>
    axiosClient.post("/orders", payload).then((r) => r.data),

  // POST /api/orders/verify
  // { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
  verify: (payload) =>
    axiosClient.post("/orders/verify", payload).then((r) => r.data),

  // GET /api/orders/my
  mine: () =>
    axiosClient.get("/orders/my").then((r) => r.data),

  // GET /api/orders/:id
  detail: (id) =>
    axiosClient.get(`/orders/${id}`).then((r) => r.data),

  // PUT /api/orders/:id/cancel
  cancel: (id) =>
    axiosClient.put(`/orders/${id}/cancel`).then((r) => r.data),
};

export default orderApi;