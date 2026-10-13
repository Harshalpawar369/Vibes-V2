import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../api/authApi";


const initialState = {
  user: null,
  status: "idle", 
  error: null,
  initialCheckDone: false, 
};




export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authApi.login({ email, password });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


export const checkAuth = createAsyncThunk(
  "auth/check",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.isLoggedIn();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.updateProfile(payload);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.deleteAccount();
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


export const requestVendor = createAsyncThunk(
  "auth/requestVendor",
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.requestVendor(payload);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


export const fetchVendorRequestStatus = createAsyncThunk(
  "auth/fetchVendorRequestStatus",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.getVendorRequestStatus();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    
    setUser: (state, action) => {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },
   
    clearAuthError: (state) => {
      state.error = null;
    },
  
    forceLogout: (state) => {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: (builder) => {

    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        
        state.status = "unauthenticated";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload || "Registration failed";
      });

    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload || "Login failed";
      });

 
    builder
      .addCase(logoutUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even on failure — clear local state
        state.user = null;
        state.status = "unauthenticated";
      });

   
    builder
      .addCase(checkAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.initialCheckDone = true;
        if (action.payload.isLoggedIn) {
          state.user = action.payload.user;
          state.status = "authenticated";
        } else {
          state.user = null;
          state.status = "unauthenticated";
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.initialCheckDone = true;
        state.user = null;
        state.status = "unauthenticated";
      });

    builder
      .addCase(updateProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = "authenticated";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = "authenticated"; // still logged in
        state.error = action.payload || "Update failed";
      });


    builder
      .addCase(deleteAccount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.status = "authenticated";
        state.error = action.payload || "Delete failed";
      });

    // ================= REQUEST VENDOR =================
    builder
      .addCase(requestVendor.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(requestVendor.fulfilled, (state) => {
        state.status = "authenticated";
        if (state.user) {
          state.user.vendorRequestStatus = "pending";
        }
      })
      .addCase(requestVendor.rejected, (state, action) => {
        state.status = "authenticated";
        state.error = action.payload || "Vendor request failed";
      });

  
    builder
      .addCase(fetchVendorRequestStatus.fulfilled, (state, action) => {
        // Non-critical — just update user role if changed
        if (state.user && action.payload.role) {
          state.user.role = action.payload.role;
          state.user.vendorRequestStatus = action.payload.vendorRequestStatus;
        }
      });
  },
});


export const { setUser, clearAuthError, forceLogout } = authSlice.actions;


export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectInitialCheckDone = (state) => state.auth.initialCheckDone;
export const selectIsAuthenticated = (state) =>
  state.auth.status === "authenticated";
export const selectUserRole = (state) => state.auth.user?.role || null;
export const selectIsVendor = (state) => state.auth.user?.role === "vendor";
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";
export const selectIsDelivery = (state) => state.auth.user?.role === "delivery";

export default authSlice.reducer;