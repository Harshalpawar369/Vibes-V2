import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import deliveryApi from "../../api/deliveryApi";

// ---------- Thunks ----------
export const fetchAssignedOrders = createAsyncThunk(
  "delivery/fetchAssigned",
  async () => {
    try {
      const response = await deliveryApi.assignedOrders();
      return response.orders ?? [];
    } catch (error) {
      console.log("Error fetching assigned orders:", error);
      throw error;
    }
  }
);

export const fetchDeliveryHistory = createAsyncThunk(
  "delivery/fetchHistory",
  async () => {
    try {
      const response = await deliveryApi.history();
      return response.orders ?? [];
    } catch (error) {
      console.log("Error fetching delivery history:", error);
      throw error;
    }
  }
);

export const updateDeliveryStatus = createAsyncThunk(
  "delivery/updateStatus",
  async ({ orderId, orderStatus }) => {
    try {
      const response = await deliveryApi.updateStatus(orderId, orderStatus);
      return response.order;
    } catch (error) {
      console.log("Error updating delivery status:", error);
      throw error;
    }
  }
);

export const confirmCod = createAsyncThunk(
  "delivery/confirmCod",
  async (orderId) => {
    try {
      const response = await deliveryApi.confirmCod(orderId);
      return response.order;
    } catch (error) {
      console.log("Error confirming COD:", error);
      throw error;
    }
  }
);

export const markDelivered = createAsyncThunk(
  "delivery/markDelivered",
  async (orderId) => {
    try {
      const response = await deliveryApi.markDelivered(orderId);
      return response.order;
    } catch (error) {
      console.log("Error marking delivered:", error);
      throw error;
    }
  }
);

// ---------- Slice ----------
const deliverySlice = createSlice({
  name: "delivery",
  initialState: {
    assigned: [],
    history: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignedOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAssignedOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.assigned = action.payload;
      })
      .addCase(fetchAssignedOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      .addCase(fetchDeliveryHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })

      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.assigned.findIndex((o) => o._id === updated._id);
        if (idx !== -1) state.assigned[idx] = updated;
      })

      .addCase(confirmCod.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.assigned.findIndex((o) => o._id === updated._id);
        if (idx !== -1) state.assigned[idx] = updated;
      })

      .addCase(markDelivered.fulfilled, (state, action) => {
        const updated = action.payload;
        state.assigned = state.assigned.filter((o) => o._id !== updated._id);
        state.history.unshift(updated);
      });
  },
});

export default deliverySlice.reducer;