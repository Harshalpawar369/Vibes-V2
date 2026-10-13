import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchAdminDashboard,
  fetchPendingVendors, 
  approveVendor, 
  rejectVendor,
  fetchAdminUsers,
  toggleUserActive,
  deleteUser,
  fetchAdminOrders,
  updateOrderStatus
} from "../../redux/features/adminSlice";
import { 
  FiUsers, FiTruck, FiClock, FiGrid, 
  FiShoppingBag, FiPlusSquare, FiStar, FiDollarSign, FiCheck, FiX 
} from "react-icons/fi";

function AdminDashboard() {
  const dispatch = useDispatch();
  const { stats, pendingVendors, users, orders, status, error } = useSelector((state) => state.admin);
  
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard stats on load
  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  // Fetch data dynamically when tabs are switched
  useEffect(() => {
    if (activeTab === "vendor-requests") {
      dispatch(fetchPendingVendors());
    }
    if (activeTab === "users") {
      dispatch(fetchAdminUsers());
    }
    if (activeTab === "orders" || activeTab === "payments") {
      dispatch(fetchAdminOrders());
    }
  }, [activeTab, dispatch]);

  const menuItems = [
    { id: "overview", label: "Dashboard", icon: <FiGrid /> },
    { id: "vendor-requests", label: "Vendor Requests", icon: <FiClock /> },
    { id: "add-product", label: "Add Product", icon: <FiPlusSquare /> },
    { id: "users", label: "Users", icon: <FiUsers /> },
    { id: "delivery", label: "Delivery", icon: <FiTruck /> },
    { id: "orders", label: "Orders", icon: <FiShoppingBag /> },
    { id: "reviews", label: "Reviews", icon: <FiStar /> },
    { id: "payments", label: "Payments", icon: <FiDollarSign /> },
  ];

  // Vendor Action Handlers
  const handleApprove = (id) => {
    if (window.confirm("Approve this vendor request?")) {
      dispatch(approveVendor(id));
    }
  };

  const handleReject = (id) => {
    const reason = window.prompt("Enter a reason for rejection:");
    if (reason !== null) {
      dispatch(rejectVendor({ id, reason }));
    }
  };

  // User Action Handlers
  const handleToggleUser = (id) => {
    if (window.confirm("Are you sure you want to change this user's active status?")) {
      dispatch(toggleUserActive(id));
    }
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Are you sure you want to completely delete this user? This action cannot be undone.")) {
      dispatch(deleteUser(id));
    }
  };

  // Order Action Handlers
  const handleStatusChange = (orderId, newStatus) => {
    if (window.confirm(`Are you sure you want to change this order's status to '${newStatus}'?`)) {
      dispatch(updateOrderStatus({ orderId, orderStatus: newStatus }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12 px-4 md:px-8 font-[poppins] flex flex-col md:flex-row gap-6">
      
      {/* SIDEBAR NAVIGATION */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-64 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl h-fit sticky top-24"
      >
        <h2 className="text-xl font-extrabold uppercase mb-6 border-b-4 border-black pb-2 text-zinc-900">
          Admin Panel
        </h2>
        <nav className="flex flex-col space-y-3">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 border-2 border-black font-bold uppercase text-sm transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                activeTab === item.id ? "bg-emerald-400 text-black" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
              }`}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ))}
        </nav>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full overflow-hidden">
        <div className="mb-6 flex justify-between items-end border-b-4 border-black pb-2">
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase text-zinc-950 flex items-center gap-3">
            {menuItems.find(i => i.id === activeTab)?.icon}
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-200 border-4 border-black text-rose-900 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Error: {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* ================= OVERVIEW TAB ================= */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {status === "loading" ? (
                <Loader />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-emerald-400 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <h3 className="font-bold uppercase text-black text-sm mb-4">Total Customers</h3>
                    <p className="text-5xl font-extrabold text-black">{stats?.totalCustomers || 0}</p>
                  </div>
                  <div className="bg-yellow-300 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <h3 className="font-bold uppercase text-black text-sm mb-4">Total Vendors</h3>
                    <p className="text-5xl font-extrabold text-black">{stats?.totalVendors || 0}</p>
                  </div>
                  <div className="bg-blue-400 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <h3 className="font-bold uppercase text-black text-sm mb-4">Delivery Boys</h3>
                    <p className="text-5xl font-extrabold text-black">{stats?.totalDelivery || 0}</p>
                  </div>
                  <div className="bg-rose-400 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <h3 className="font-bold uppercase text-black text-sm mb-4">Pending Vendor Requests</h3>
                    <p className="text-5xl font-extrabold text-black">{stats?.pendingVendorRequests || 0}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= VENDOR REQUESTS TAB ================= */}
          {activeTab === "vendor-requests" && (
            <motion.div
              key="vendor-requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {status === "loading" ? (
                <Loader />
              ) : (!pendingVendors || pendingVendors.length === 0) ? (
                <div className="bg-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center">
                  <h3 className="text-xl font-bold uppercase text-zinc-500">No pending requests</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {pendingVendors.map((vendor) => (
                    <div 
                      key={vendor._id} 
                      className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-extrabold uppercase truncate">
                            {vendor.vendorRequestDetails?.businessName ||
                              vendor.businessName ||
                              vendor.name ||
                              vendor.user?.name ||
                              "Pending Vendor"}
                          </h3>
                          <span className="bg-yellow-300 px-2 py-1 border-2 border-black text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            Pending
                          </span>
                        </div>
                        <p className="text-zinc-700 font-semibold text-sm mb-1">
                          📧 {vendor.email || vendor.user?.email || "No email provided"}
                        </p>
                        <p className="text-zinc-700 font-semibold text-sm mb-4">
                          📞 {vendor.vendorRequestDetails?.businessPhone ||
                            vendor.businessPhone ||
                            vendor.phone ||
                            vendor.user?.phone ||
                            "No phone provided"}
                        </p>
                        
                        {(vendor.vendorRequestDetails?.reason ||
                          vendor.vendorRequestDetails?.businessAddress ||
                          vendor.reason ||
                          vendor.businessAddress) && (
                          <div className="bg-zinc-100 p-2 border-2 border-black text-xs font-semibold mb-2">
                            {(vendor.vendorRequestDetails?.businessAddress ||
                              vendor.businessAddress) && (
                              <p>
                                📍{" "}
                                {vendor.vendorRequestDetails?.businessAddress ||
                                  vendor.businessAddress}
                              </p>
                            )}
                            {(vendor.vendorRequestDetails?.reason || vendor.reason) && (
                              <p className="mt-1 italic">
                                "{vendor.vendorRequestDetails?.reason || vendor.reason}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3 mt-4 pt-4 border-t-2 border-dashed border-zinc-300">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px black" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApprove(vendor._id)}
                          className="flex-1 bg-emerald-400 border-2 border-black py-2 flex justify-center items-center gap-2 font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <FiCheck size={18} /> Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px black" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(vendor._id)}
                          className="flex-1 bg-rose-400 border-2 border-black py-2 flex justify-center items-center gap-2 font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <FiX size={18} /> Reject
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= USERS TAB ================= */}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {status === "loading" ? (
                <Loader />
              ) : (
                <div className="overflow-x-auto bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b-4 border-black">
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Name</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Email</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Role</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap text-center">Status</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users && users.length > 0 ? (
                        users.map((u) => (
                          <tr key={u._id} className="border-b-2 border-black last:border-0 hover:bg-zinc-50 transition-colors">
                            <td className="p-4 font-bold">{u.name}</td>
                            <td className="p-4 font-semibold text-zinc-600">{u.email}</td>
                            <td className="p-4 font-bold uppercase text-sm">
                              <span className={`px-3 py-1 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                u.role === 'admin' ? 'bg-rose-300' :
                                u.role === 'vendor' ? 'bg-yellow-300' :
                                u.role === 'delivery' ? 'bg-blue-300' : 'bg-zinc-200'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 font-bold uppercase text-sm text-center">
                              <span className={u.isActive ? "text-emerald-600" : "text-rose-600"}>
                                {u.isActive ? "Active" : "Disabled"}
                              </span>
                            </td>
                            <td className="p-4 flex gap-2 justify-center">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleUser(u._id)}
                                className={`px-3 py-1.5 border-2 border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${u.isActive ? 'bg-orange-300 hover:bg-orange-400' : 'bg-emerald-300 hover:bg-emerald-400'}`}
                              >
                                {u.isActive ? "Disable" : "Enable"}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteUser(u._id)}
                                className="px-3 py-1.5 bg-rose-400 border-2 border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-500"
                              >
                                Delete
                              </motion.button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center font-bold text-zinc-500">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= ORDERS TAB ================= */}
          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {status === "loading" ? (
                <Loader />
              ) : (
                <div className="overflow-x-auto bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b-4 border-black">
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Order ID</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Customer</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Amount</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Date</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders && orders.length > 0 ? (
                        orders.map((o) => (
                          <tr key={o._id} className="border-b-2 border-black last:border-0 hover:bg-zinc-50 transition-colors">
                            <td className="p-4 font-bold">{o.orderId || o._id}</td>
                            <td className="p-4 font-semibold text-zinc-600">{o.user?.name || "Unknown"}</td>
                            <td className="p-4 font-black text-emerald-600">₹{o.totalPrice}</td>
                            <td className="p-4 font-semibold text-sm text-zinc-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 font-bold uppercase text-sm">
                              <select 
                                value={o.orderStatus} 
                                onChange={(e) => handleStatusChange(o._id, e.target.value)}
                                className={`px-2 py-1 border-2 border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer outline-none ${
                                  o.orderStatus === 'delivered' ? 'bg-emerald-300' :
                                  o.orderStatus === 'cancelled' ? 'bg-rose-300' : 'bg-yellow-300'
                                }`}
                              >
                                <option value="placed">Placed</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="out-for-delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center font-bold text-zinc-500">
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= PAYMENTS TAB ================= */}
          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {status === "loading" ? (
                <Loader />
              ) : (
                <div className="overflow-x-auto bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b-4 border-black">
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Order ID</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Customer</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Method</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Amount</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Payment Status</th>
                        <th className="p-4 font-extrabold uppercase whitespace-nowrap">Razorpay ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders && orders.length > 0 ? (
                        orders.map((o) => (
                          <tr key={o._id} className="border-b-2 border-black last:border-0 hover:bg-zinc-50 transition-colors">
                            <td className="p-4 font-bold">{o.orderId || o._id}</td>
                            <td className="p-4 font-semibold text-zinc-600">{o.user?.name || "Unknown"}</td>
                            <td className="p-4 font-bold uppercase text-sm">
                              <span className={`px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                o.paymentMethod === 'cod' ? 'bg-blue-300' : 'bg-purple-300'
                              }`}>
                                {o.paymentMethod === 'cod' ? 'COD' : 'Online'}
                              </span>
                            </td>
                            <td className="p-4 font-black">₹{o.totalPrice}</td>
                            <td className="p-4 font-bold uppercase text-sm">
                              <span className={`px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                o.paymentStatus === 'paid' ? 'bg-emerald-300' :
                                o.paymentStatus === 'refunded' ? 'bg-rose-300' : 'bg-yellow-300'
                              }`}>
                                {o.paymentStatus}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-xs text-zinc-500 font-mono">
                              {o.razorpayPaymentId || "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-8 text-center font-bold text-zinc-500">
                            No payment records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= ADD PRODUCT TAB ================= */}
          {activeTab === "add-product" && (
            <motion.div
              key="add-product"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AddProductForm />
            </motion.div>
          )}

          {/* ================= PLACEHOLDERS ================= */}
          {activeTab === "delivery" || activeTab === "reviews" ? (
             <motion.div
              key="placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border-4 border-black p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center"
            >
              <FiGrid className="mx-auto text-6xl text-zinc-300 mb-4" />
              <h3 className="text-2xl font-bold uppercase mb-2">Module Not Connected</h3>
              <p className="font-semibold text-zinc-500">The {activeTab} section is part of the layout but needs to be built out.</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

const Loader = () => (
  <div className="flex justify-center p-10">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
  </div>
);

// Internal form component for cleaner code separation
function AddProductForm() {
  const [productData, setProductData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    description: "",
  });

  const handleChange = (e) => setProductData({ ...productData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting product:", productData);
    alert("Product added successfully! (Connected to Redux soon)");
    setProductData({ name: "", price: "", category: "", stock: "", description: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="font-bold text-zinc-800 uppercase text-sm">Product Name</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="font-bold text-zinc-800 uppercase text-sm">Price ($)</label>
          <input
            type="number"
            name="price"
            value={productData.price}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="font-bold text-zinc-800 uppercase text-sm">Stock Quantity</label>
          <input
            type="number"
            name="stock"
            value={productData.stock}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="font-bold text-zinc-800 uppercase text-sm">Category</label>
          <select
            name="category"
            value={productData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] appearance-none cursor-pointer"
          >
            <option value="" disabled>Select a category</option>
            <option value="clothing">Clothing</option>
            <option value="accessories">Accessories</option>
            <option value="electronics">Electronics</option>
          </select>
        </div>

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="font-bold text-zinc-800 uppercase text-sm">Description</label>
          <textarea
            name="description"
            rows="4"
            value={productData.description}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
          ></textarea>
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.01, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)", y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-violet-400 border-4 border-black px-4 py-4 uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-extrabold text-lg transition-all"
      >
        Publish Product
      </motion.button>
    </form>
  );
}

export default AdminDashboard;