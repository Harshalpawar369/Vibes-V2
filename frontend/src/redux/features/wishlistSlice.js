import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import wishlistApi from "../../api/wishlistApi";



export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const res = await wishlistApi.get();
      return res.wishlist ?? { products: [] };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  "wishlist/toggleWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const res = await wishlistApi.toggle(productId);
      return res.wishlist ?? { products: [] };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const clearWishlist = createAsyncThunk(
  "wishlist/clearWishlist",
  async (_, { rejectWithValue }) => {
    try {
      await wishlistApi.clear();
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    products: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.products = action.payload.products ?? [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.products = action.payload.products ?? [];
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(clearWishlist.fulfilled, (state) => {
        state.products = [];
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearWishlistError } = wishlistSlice.actions;
export default wishlistSlice.reducer;