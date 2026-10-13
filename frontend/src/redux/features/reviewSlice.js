import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import reviewApi from "../../api/reviewApi";

// ============================================================
// THUNKS
// ============================================================

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const res = await reviewApi.forProduct(productId);
      return {
        productId,
        reviews: res.reviews ?? [],
        distribution: res.distribution ?? null,
        product: res.product ?? null,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyReviews = createAsyncThunk(
  "reviews/fetchMyReviews",
  async (_, { rejectWithValue }) => {
    try {
      const res = await reviewApi.mine();
      return res.reviews ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addReview = createAsyncThunk(
  "reviews/addReview",
  async ({ productId, payload }, { rejectWithValue }) => {
    try {
      const res = await reviewApi.add(productId, payload);
      return { productId, review: res.review ?? null };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({ reviewId, payload }, { rejectWithValue }) => {
    try {
      const res = await reviewApi.update(reviewId, payload);
      return res.review ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      await reviewApi.remove(reviewId);
      return reviewId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    // Reviews for the product currently being viewed
    items: [],
    distribution: null,
    currentProductId: null,

    // User's own reviews
    myItems: [],

    status: "idle",
    myStatus: "idle",
    mutationStatus: "idle",
    error: null,
  },
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- fetchProductReviews ----------
      .addCase(fetchProductReviews.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.reviews;
        state.distribution = action.payload.distribution;
        state.currentProductId = action.payload.productId;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ---------- fetchMyReviews ----------
      .addCase(fetchMyReviews.pending, (state) => {
        state.myStatus = "loading";
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.myStatus = "succeeded";
        state.myItems = action.payload;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.myStatus = "failed";
        state.error = action.payload;
      })

      // ---------- addReview ----------
      .addCase(addReview.pending, (state) => {
        state.mutationStatus = "loading";
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const r = action.payload.review;
        if (r && action.payload.productId === state.currentProductId) {
          state.items.unshift(r);
        }
      })
      .addCase(addReview.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.payload;
      })

      // ---------- updateReview ----------
      .addCase(updateReview.fulfilled, (state, action) => {
        const r = action.payload;
        if (!r) return;
        const idx = state.items.findIndex((x) => x._id === r._id);
        if (idx !== -1) state.items[idx] = r;
        const mIdx = state.myItems.findIndex((x) => x._id === r._id);
        if (mIdx !== -1) state.myItems[mIdx] = r;
      })

      // ---------- deleteReview ----------
      .addCase(deleteReview.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((r) => r._id !== id);
        state.myItems = state.myItems.filter((r) => r._id !== id);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;