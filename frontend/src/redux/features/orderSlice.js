import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import orderApi from "../../api/orderApi";


export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await orderApi.create(payload);
      return res; // { order, razorpay? }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "orders/verifyPayment",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await orderApi.verify(payload);
      return res.order ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await orderApi.mine();
      return res.orders ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await orderApi.detail(id);
      return res.order ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await orderApi.cancel(id);
      return res.order ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const orderSlice = createSlice({
  name: "orders",
  initialState: {
    items: [],
    current: null,
    status: "idle",
    currentStatus: "idle",
    mutationStatus: "idle",
    lastRazorpay: null,
    error: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.current = null;
      state.currentStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- createOrder ----------
      .addCase(createOrder.pending, (state) => {
        state.mutationStatus = "loading";
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.current = action.payload.order ?? null;
        state.lastRazorpay = action.payload.razorpay ?? null;
        if (action.payload.order) state.items.unshift(action.payload.order);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.payload;
      })

      // ---------- verifyPayment ----------
      .addCase(verifyPayment.fulfilled, (state, action) => {
        const o = action.payload;
        if (!o) return;
        state.current = o;
        const idx = state.items.findIndex((x) => x._id === o._id);
        if (idx !== -1) state.items[idx] = o;
      })

      // ---------- fetchMyOrders ----------
      .addCase(fetchMyOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ---------- fetchOrderById ----------
      .addCase(fetchOrderById.pending, (state) => {
        state.currentStatus = "loading";
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.error = action.payload;
      })

      // ---------- cancelOrder ----------
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const o = action.payload;
        if (!o) return;
        const idx = state.items.findIndex((x) => x._id === o._id);
        if (idx !== -1) state.items[idx] = o;
        if (state.current?._id === o._id) state.current = o;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearOrderError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;