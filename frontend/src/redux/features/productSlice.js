import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productApi from "../../api/productApi";


export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await productApi.list(params);
      return res.products ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await productApi.detail(id);
      return res.product ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyProducts = createAsyncThunk(
  "products/fetchMyProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await productApi.mine();
      return res.products ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await productApi.create(formData);
      return res.product ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await productApi.update(id, formData);
      return res.product ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await productApi.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    myItems: [],
    current: null,
    status: "idle",
    myStatus: "idle",
    currentStatus: "idle",
    mutationStatus: "idle",
    error: null,
  },
  reducers: {
    clearCurrentProduct: (state) => {
      state.current = null;
      state.currentStatus = "idle";
    },
    clearProductError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- fetchProducts ----------
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ---------- fetchProductById ----------
      .addCase(fetchProductById.pending, (state) => {
        state.currentStatus = "loading";
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.error = action.payload;
      })

      // ---------- fetchMyProducts ----------
      .addCase(fetchMyProducts.pending, (state) => {
        state.myStatus = "loading";
      })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.myStatus = "succeeded";
        state.myItems = action.payload;
      })
      .addCase(fetchMyProducts.rejected, (state, action) => {
        state.myStatus = "failed";
        state.error = action.payload;
      })

      // ---------- createProduct ----------
      .addCase(createProduct.pending, (state) => {
        state.mutationStatus = "loading";
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        if (action.payload) {
          state.myItems.unshift(action.payload);
          state.items.unshift(action.payload);
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.payload;
      })

      // ---------- updateProduct ----------
      .addCase(updateProduct.pending, (state) => {
        state.mutationStatus = "loading";
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const p = action.payload;
        if (!p) return;
        const im = state.myItems.findIndex((x) => x._id === p._id);
        if (im !== -1) state.myItems[im] = p;
        const ip = state.items.findIndex((x) => x._id === p._id);
        if (ip !== -1) state.items[ip] = p;
        if (state.current?._id === p._id) state.current = p;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.payload;
      })

      // ---------- deleteProduct ----------
      .addCase(deleteProduct.pending, (state) => {
        state.mutationStatus = "loading";
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const id = action.payload;
        state.myItems = state.myItems.filter((p) => p._id !== id);
        state.items = state.items.filter((p) => p._id !== id);
        if (state.current?._id === id) state.current = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProduct, clearProductError } = productSlice.actions;
export default productSlice.reducer;