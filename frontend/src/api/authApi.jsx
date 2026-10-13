import axiosClient from "./axiosClient";

const authApi = {
 
  register: (payload) =>
    axiosClient.post("/auth/register", payload).then((r) => r.data),

  login: (credentials) =>
    axiosClient.post("/auth/login", credentials).then((r) => r.data),

  isLoggedIn: () =>
    axiosClient.get("/auth/isloggedin").then((r) => r.data),

  logout: () =>
    axiosClient.post("/auth/logout").then((r) => r.data),

  getProfile: () =>
    axiosClient.get("/auth/profile").then((r) => r.data),

  updateProfile: (payload) =>
    axiosClient.put("/auth/profile", payload).then((r) => r.data),

  deleteAccount: () =>
    axiosClient.delete("/auth/profile").then((r) => r.data),


  requestVendor: (payload) =>
    axiosClient.post("/auth/request-vendor", payload).then((r) => r.data),

  getVendorRequestStatus: () =>
    axiosClient.get("/auth/vendor-request-status").then((r) => r.data),
};

export default authApi;