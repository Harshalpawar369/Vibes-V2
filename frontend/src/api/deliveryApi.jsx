import axiosClient from "./axiosClient";

// ============================================================
// Delivery API
// ============================================================
const deliveryApi = {
  // GET /api/delivery/orders — currently assigned
  assignedOrders: () =>
    axiosClient.get("/delivery/orders").then((r) => r.data),

  // GET /api/delivery/history — delivered orders
  history: () =>
    axiosClient.get("/delivery/history").then((r) => r.data),

  // PUT /api/delivery/orders/:id/status  { orderStatus: "out-for-delivery" | "shipped" }
  updateStatus: (id, orderStatus) =>
    axiosClient
      .put(`/delivery/orders/${id}/status`, { orderStatus })
      .then((r) => r.data),

  // PUT /api/delivery/orders/:id/confirm-cod — customer paid cash
  confirmCod: (id) =>
    axiosClient.put(`/delivery/orders/${id}/confirm-cod`).then((r) => r.data),

  // PUT /api/delivery/orders/:id/deliver — mark delivered
  markDelivered: (id) =>
    axiosClient.put(`/delivery/orders/${id}/deliver`).then((r) => r.data),
};

export default deliveryApi;