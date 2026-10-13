import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser, selectAuthStatus } from "../redux/features/userSlice";

import AppLayout from "./routeLayouts/AppLayout";
import AuthLayout from "./routeLayouts/AuthLayout";

// --- LAZY LOADED PAGES ---
const Shop = lazy(() => import("../pages/views/Shop.jsx"));
const About = lazy(() => import("../pages/views/About.jsx"));
const Cart = lazy(() => import("../pages/views/Cart.jsx"));
const Home = lazy(() => import("../pages/views/Home.jsx"));
const UserLogin = lazy(() => import("../pages/form/UserLogin"));
const UserRegister = lazy(() => import("../pages/form/UserRegister"));
const Profile = lazy(() => import("../pages/form/Profile.jsx"));
const AdminDashboard = lazy(() => import("../pages/views/AdminDashboard.jsx"));
const ApplyVendor = lazy(() => import("../pages/form/ApplyVendor.jsx"));
const VendorDashboard = lazy(() => import("../pages/views/VendorDashboard.jsx"));
const ProductDetail = lazy(() => import("../pages/views/ProductDetail.jsx"));

// --- SUB-COMPONENTS ---
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
  </div>
);

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] font-[poppins] px-4 text-center">
    <h1 className="text-9xl font-black text-black drop-shadow-[6px_6px_0px_rgba(16,185,129,1)]">
      404
    </h1>
    <h2 className="text-4xl font-extrabold uppercase mt-4 mb-6 text-zinc-900">
      Page Not Found
    </h2>
    <p className="font-semibold text-zinc-600 mb-8 max-w-md">
      Oops! The vibe you're looking for doesn't exist, has been moved, or you don't have permission to view it.
    </p>
    <Link
      to="/"
      className="bg-emerald-400 border-4 border-black px-8 py-3 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-lg hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
    >
      Back to Home
    </Link>
  </div>
);

// --- ROUTE PROTECTOR ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector(selectUser);
  const authStatus = useSelector(selectAuthStatus);

  if (authStatus === "loading" || authStatus === "idle") {
    return <PageLoader />;
  }

  if (authStatus === "unauthenticated" || !user) {
    return <Navigate to="/vibe/login" replace />;
  }

  // If specific roles are required and the user doesn't have one of them, block access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return children;
};

// --- APP ROUTES ---
const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* AUTH ROUTES */}
          <Route element={<AuthLayout />}>
            <Route path="/vibe/login" element={<UserLogin />} />
            <Route path="/vibe/register" element={<UserRegister />} />
          </Route>

          {/* MAIN APP ROUTES */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            {/* PROTECTED ROUTES (Must be logged in) */}
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/apply-vendor" element={<ProtectedRoute><ApplyVendor /></ProtectedRoute>} />

            {/* ROLE-RESTRICTED ROUTES */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vendor-dashboard" 
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 CATCH-ALL */}
            <Route path="*" element={<NotFound />} />
          </Route>
          
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;