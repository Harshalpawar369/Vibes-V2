import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import vendorApi from "../../api/vendorApi";

// ---------- Thunks ----------
export const fetchVendorDashboard = createAsyncThunk(
  "vendor/fetchDashboard",
  async () => {
    try {
      const response = await vendorApi.dashboard();
      return response;
    } catch (error) {
      console.log("Error fetching vendor dashboard:", error);
      throw error;
    }
  }
);

export const fetchVendorOrders = createAsyncThunk(
  "vendor/fetchOrders",
  async () => {
    try {
      const response = await vendorApi.orders();
      return response.orders ?? [];
    } catch (error) {
      console.log("Error fetching vendor orders:", error);
      throw error;
    }
  }
);

export const fetchVendorReviews = createAsyncThunk(
  "vendor/fetchReviews",
  async () => {
    try {
      const response = await vendorApi.reviews();
      return response.reviews ?? [];
    } catch (error) {
      console.log("Error fetching vendor reviews:", error);
      throw error;
    }
  }
);

// ---------- Slice ----------
const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    dashboard: null,
    orders: [],
    reviews: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorDashboard.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVendorDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dashboard = action.payload;
      })
      .addCase(fetchVendorDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      })

      .addCase(fetchVendorReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      });
  },
});

export default vendorSlice.reducer;