import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../api/adminApi";

// ============================================================
// THUNKS
// ============================================================

export const fetchAdminDashboard = createAsyncThunk(
  "admin/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.dashboard();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPendingVendors = createAsyncThunk(
  "admin/fetchPendingVendors",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.pendingVendorRequests();
      return res.requests ?? [];
    } catch (err) {
      return rejectWithValue(err.message || "Unable to load vendor requests");
    }
  }
);

export const approveVendor = createAsyncThunk(
  "admin/approveVendor",
  async (id, { rejectWithValue }) => {
    try {
      const res = await adminApi.approveVendor(id);
      return res.user ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rejectVendor = createAsyncThunk(
  "admin/rejectVendor",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await adminApi.rejectVendor(id, reason);
      return res.user ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await adminApi.users(params);
      return res.users ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleUserActive = createAsyncThunk(
  "admin/toggleUserActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await adminApi.toggleUserActive(id);
      return res.user ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await adminApi.deleteUser(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await adminApi.orders(params);
      return res.orders ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const assignDelivery = createAsyncThunk(
  "admin/assignDelivery",
  async ({ orderId, deliveryBoyId }, { rejectWithValue }) => {
    try {
      const res = await adminApi.assignDelivery(orderId, deliveryBoyId);
      return res.order ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateOrderStatus = createThunkSafe(
  "admin/updateOrderStatus",
  async ({ orderId, orderStatus }, { rejectWithValue }) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, orderStatus);
      return res.order ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// small alias so the missing import doesn't throw
function createThunkSafe(type, fn) {
  return createAsyncThunk(type, fn);
}

// ============================================================
// SLICE
// ============================================================
const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats: null,
    pendingVendors: [],
    users: [],
    orders: [],
    deliveryBoys: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.stats = action.payload.stats ?? null;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(fetchPendingVendors.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPendingVendors.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pendingVendors = action.payload;
      })
      .addCase(fetchPendingVendors.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unable to load vendor requests";
      })

      .addCase(approveVendor.fulfilled, (state, action) => {
        const u = action.payload;
        if (u) {
          state.pendingVendors = state.pendingVendors.filter(
            (x) => x._id !== (u.id || u._id)
          );
        }
      })

      .addCase(rejectVendor.fulfilled, (state, action) => {
        const u = action.payload;
        if (u) {
          state.pendingVendors = state.pendingVendors.filter(
            (x) => x._id !== (u.id || u._id)
          );
        }
      })

      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })

      .addCase(toggleUserActive.fulfilled, (state, action) => {
        const u = action.payload;
        if (!u) return;
        const idx = state.users.findIndex((x) => x._id === u.id);
        if (idx !== -1) {
          state.users[idx].isActive = u.isActive;
        }
      })

      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
      })

      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      })

      .addCase(assignDelivery.fulfilled, (state, action) => {
        const o = action.payload;
        if (!o) return;
        const idx = state.orders.findIndex((x) => x._id === o._id);
        if (idx !== -1) state.orders[idx] = o;
      })

      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const o = action.payload;
        if (!o) return;
        const idx = state.orders.findIndex((x) => x._id === o._id);
        if (idx !== -1) state.orders[idx] = o;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;