import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./features/userSlice";
import productReducer from "./features/productSlice";
import cartReducer from "./features/cartSlice";
import wishlistReducer from "./features/wishlistSlice";
import orderReducer from "./features/orderSlice";
import reviewReducer from "./features/reviewSlice";
import vendorReducer from "./features/vendorSlice";
import adminReducer from "./features/adminSlice";
import deliveryReducer from "./features/deliverySlice";
import recommendationReducer from "./features/recommendationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    orders: orderReducer,
    reviews: reviewReducer,
    vendor: vendorReducer,
    admin: adminReducer,
    delivery: deliveryReducer,
    recommendations: recommendationReducer,
  },
  devTools: import.meta.env.MODE !== "production",
});

export default store;