import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import recommendationApi from "../../api/recommendationApi";

export const fetchRecommendations = createAsyncThunk(
  "recommendations/fetchRecommendations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await recommendationApi.getRecommendations();
      return res; // returns { success, source, products }
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load recommendations");
    }
  }
);

const recommendationSlice = createSlice({
  name: "recommendations",
  initialState: {
    items: [],
    source: "",
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    clearRecommendations: (state) => {
      state.items = [];
      state.source = "";
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.products || [];
        state.source = action.payload.source || "";
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearRecommendations } = recommendationSlice.actions;
export default recommendationSlice.reducer;