import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth, selectIsAuthenticated } from "./redux/features/userSlice";
import { fetchCart } from "./redux/features/cartSlice"; // Added fetchCart import
import AppRoutes from "./routes/AppRoutes";

function App() {
  const dispatch = useDispatch();
  
  // Watch the global authentication state
  const isLoggedIn = useSelector(selectIsAuthenticated);

  // 1. Check authentication status when the app loads
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // 2. Fetch the cart as soon as we know the user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCart());
    }
  }, [dispatch, isLoggedIn]);

  return (
    <>
      <AppRoutes />
    </>
  );
}

export default App;