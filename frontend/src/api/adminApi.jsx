import axiosClient from "./axiosClient";

// ============================================================
// Admin API
// ============================================================
const adminApi = {
  // ---------- Dashboard ----------
  // GET /api/admin/dashboard
  dashboard: () =>
    axiosClient.get("/admin/dashboard").then((r) => r.data),

  // ---------- Vendor requests ----------
  // GET /api/admin/vendor-requests
  pendingVendorRequests: () =>
    axiosClient.get("/admin/vendor-requests").then((r) => r.data),

  // GET /api/admin/vendors?status=pending|approved|rejected
  vendors: (status) =>
    axiosClient
      .get("/admin/vendors", { params: status ? { status } : {} })
      .then((r) => r.data),

  // PUT /api/admin/vendor-requests/:id/approve
  approveVendor: (id) =>
    axiosClient.put(`/admin/vendor-requests/${id}/approve`).then((r) => r.data),

  // PUT /api/admin/vendor-requests/:id/reject
  rejectVendor: (id, reason) =>
    axiosClient
      .put(`/admin/vendor-requests/${id}/reject`, { reason })
      .then((r) => r.data),

  // ---------- Staff ----------
  // POST /api/admin/create-staff
  createStaff: (payload) =>
    axiosClient.post("/admin/create-staff", payload).then((r) => r.data),

  // GET /api/admin/delivery-boys
  deliveryBoys: () =>
    axiosClient.get("/admin/delivery-boys").then((r) => r.data),

  // ---------- Users ----------
  // GET /api/admin/users?role=&isActive=&search=
  users: (params = {}) =>
    axiosClient.get("/admin/users", { params }).then((r) => r.data),

  // PUT /api/admin/users/:id/toggle-active
  toggleUserActive: (id) =>
    axiosClient.put(`/admin/users/${id}/toggle-active`).then((r) => r.data),

  // DELETE /api/admin/users/:id
  deleteUser: (id) =>
    axiosClient.delete(`/admin/users/${id}`).then((r) => r.data),

  // ---------- Orders ----------
  // GET /api/admin/orders?status=&paymentStatus=
  orders: (params = {}) =>
    axiosClient.get("/admin/orders", { params }).then((r) => r.data),

  // GET /api/admin/orders/:id
  orderDetail: (id) =>
    axiosClient.get(`/admin/orders/${id}`).then((r) => r.data),

  // PUT /api/admin/orders/:id/assign  { deliveryBoyId }
  assignDelivery: (id, deliveryBoyId) =>
    axiosClient
      .put(`/admin/orders/${id}/assign`, { deliveryBoyId })
      .then((r) => r.data),

  // PUT /api/admin/orders/:id/status  { orderStatus }
  updateOrderStatus: (id, orderStatus) =>
    axiosClient
      .put(`/admin/orders/${id}/status`, { orderStatus })
      .then((r) => r.data),
};

export default adminApi;