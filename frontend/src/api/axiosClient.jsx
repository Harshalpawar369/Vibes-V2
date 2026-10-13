import axios from "axios";


const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // 🔑 sends the httpOnly jwt cookie
  headers: {
    "Content-Type": "application/json",
  },
});


axiosClient.interceptors.request.use(
  (config) => {
    // 🔑 Placeholder for future cross-cutting concerns:
    //   - CSRF token attachment
    //   - Request ID for tracing
    //   - Custom headers (client version, locale)
    // Currently no-op — cookies handle auth.
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Response interceptor — runs AFTER every response
// ============================================================
axiosClient.interceptors.response.use(
  // ✅ Success path — pass through unchanged
  (response) => response,

  // ❌ Error path — normalize the error shape
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Extract a human-readable message from various possible shapes
    const message =
      data?.message ||          // our backend's standard: { success, message }
      error.message ||          // axios fallback
      "Something went wrong";

    // Normalized error object — every rejected promise gets this shape
    const normalized = {
      message,
      status,
      data,
      originalError: error,
    };

    // 🔔 Global 401 handler
    // Fires a custom event so the app can log the user out without
    // creating a circular dependency between axiosClient and the Redux store.
    if (status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    return Promise.reject(normalized);
  }
);

export default axiosClient;