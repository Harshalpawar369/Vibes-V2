import axiosClient from "./axiosClient";

// ============================================================
// Product API
// ============================================================
const productApi = {
  // ---------- Public ----------
  // GET /api/products?keyword=&category=&minPrice=&maxPrice=&vendor=&page=&limit=
  list: (params = {}) =>
    axiosClient.get("/products", { params }).then((r) => r.data),

  // GET /api/products/:id
  detail: (id) =>
    axiosClient.get(`/products/${id}`).then((r) => r.data),

  // ---------- Vendor / Admin only ----------
  // GET /api/products/mine
  mine: () =>
    axiosClient.get("/products/mine").then((r) => r.data),

  // POST /api/products  (multipart: name, description, price, stock, category, images[])
  create: (formData) =>
    axiosClient
      .post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  // PUT /api/products/:id  (multipart, all fields optional)
  update: (id, formData) =>
    axiosClient
      .put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  // DELETE /api/products/:id
  remove: (id) =>
    axiosClient.delete(`/products/${id}`).then((r) => r.data),
};

export default productApi;