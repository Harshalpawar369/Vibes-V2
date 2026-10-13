import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchVendorDashboard, fetchVendorOrders, fetchVendorReviews } from "../../redux/features/vendorSlice";
import {
  fetchMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../redux/features/productSlice";
import {
  FiGrid,
  FiPackage,
  FiPlusSquare,
  FiShoppingBag,
  FiStar,
  FiImage,
  FiEdit,
  FiTrash2,
  FiX,
} from "react-icons/fi";

function VendorDashboard() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingProduct, setEditingProduct] = useState(null);

  const {
    dashboard,
    orders: vendorOrders,
    reviews: vendorReviews, // Added reviews here
    status: vendorStatus,
    error: vendorError,
  } = useSelector((state) => state.vendor);

  const { myItems, myStatus, mutationStatus } = useSelector(
    (state) => state.products,
  );

  useEffect(() => {
    dispatch(fetchVendorDashboard());
    dispatch(fetchVendorOrders());
  }, [dispatch]);

  // Fetch products or reviews when specific tabs are opened
  useEffect(() => {
    if (activeTab === "my-products") {
      dispatch(fetchMyProducts());
    }
    if (activeTab === "reviews") {
      dispatch(fetchVendorReviews());
    }
  }, [activeTab, dispatch]);

  const handleDeleteProduct = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      dispatch(deleteProduct(id));
    }
  };

  const handleUpdateProductSubmit = async (id, formData) => {
    const result = await dispatch(updateProduct({ id, formData }));
    if (!result.error) {
      setEditingProduct(null);
    }
  };

  const products = useMemo(() => myItems || [], [myItems]);

  const menuItems = useMemo(
    () => [
      { id: "overview", label: "Dashboard", icon: <FiGrid /> },
      { id: "my-products", label: "My Products", icon: <FiPackage /> },
      { id: "add-product", label: "Add Product", icon: <FiPlusSquare /> },
      { id: "orders", label: "Orders", icon: <FiShoppingBag /> },
      { id: "reviews", label: "Reviews", icon: <FiStar /> },
    ],
    [],
  );

  const validOrders = useMemo(
    () =>
      vendorOrders?.filter(
        (order) =>
          order.orderStatus !== "cancelled" &&
          !(order.paymentMethod === "razorpay" && !order.isPaid),
      ) || [],
    [vendorOrders],
  );

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12 px-4 md:px-8 font-[poppins] flex flex-col md:flex-row gap-6 relative">
      {/* SIDEBAR NAVIGATION */}
      <motion.aside
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-64 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl h-fit sticky top-24 z-10"
      >
        <h2 className="text-xl font-extrabold uppercase mb-6 border-b-4 border-black pb-2 text-zinc-900">
          Vendor Hub
        </h2>
        <nav className="flex flex-col space-y-3">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 border-2 border-black font-bold uppercase text-sm transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                activeTab === item.id
                  ? "bg-yellow-300 text-black"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
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
            {menuItems.find((i) => i.id === activeTab)?.icon}
            {menuItems.find((i) => i.id === activeTab)?.label}
          </h1>
        </div>

        {vendorError && (
          <div className="mb-6 p-4 bg-rose-200 border-4 border-black text-rose-900 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Error: {vendorError}
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
              {vendorStatus === "loading" ? (
                <Loader />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard
                      title="Total Products"
                      value={dashboard?.stats?.totalProducts || 0}
                      color="bg-emerald-400"
                    />
                    <StatCard
                      title="Total Orders"
                      value={validOrders.length || 0}
                      color="bg-blue-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                      <h3 className="text-xl font-extrabold uppercase mb-4 border-b-2 border-black pb-2">
                        Best Selling
                      </h3>
                      {dashboard?.bestSelling?.length > 0 ? (
                        <ul className="space-y-3">
                          {dashboard.bestSelling.map((p) => (
                            <li
                              key={p._id}
                              className="flex justify-between items-center font-bold"
                            >
                              <span>{p.name}</span>
                              <span className="text-emerald-600">
                                ${p.price} ({p.sold} sold)
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-semibold text-zinc-500">
                          No sales data yet.
                        </p>
                      )}
                    </div>

                    <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                      <h3 className="text-xl font-extrabold uppercase mb-4 border-b-2 border-black pb-2">
                        Recent Reviews
                      </h3>
                      {dashboard?.recentReviews?.length > 0 ? (
                        <ul className="space-y-3">
                          {dashboard.recentReviews.map((r) => (
                            <li
                              key={r._id}
                              className="text-sm font-semibold border-b-2 border-dashed border-zinc-200 pb-2"
                            >
                              <span className="text-yellow-500 text-base mr-2">
                                {"★".repeat(r.rating)}
                              </span>
                              "{r.comment}" -{" "}
                              <span className="italic text-zinc-500">
                                {r.product?.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-semibold text-zinc-500">
                          No reviews yet.
                        </p>
                      )}
                    </div>
                  </div>
                </>
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
            >
              {vendorStatus === "loading" ? (
                <Loader />
              ) : (
                <div className="space-y-4">
                  {validOrders.length > 0 ? (
                    validOrders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4"
                      >
                        <div>
                          <div>
                            <p className="font-bold text-lg">
                              Order ID: {order.orderId || order._id}
                            </p>

                            <p className="font-black text-emerald-600 text-lg">
                              Your Earnings: ₹{order.vendorTotal}
                            </p>
                            <p className="font-semibold text-zinc-500 text-xs">
                              Customer Cart Total: ₹{order.totalPrice}
                            </p>

                            <p className="font-semibold text-sm mt-1 flex items-center gap-2">
                              Status:{" "}
                              <span className={`uppercase px-2 py-0.5 border-2 rounded-md font-bold ${
                                order.orderStatus === 'delivered' 
                                  ? 'text-emerald-800 bg-emerald-200 border-emerald-800' 
                                  : 'text-blue-800 bg-blue-200 border-blue-800'
                              }`}>
                                {order.orderStatus}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          <span className="font-bold text-sm bg-yellow-300 border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
                            {order.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : "Paid Online"}
                          </span>
                          <span className="text-xs font-bold text-zinc-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border-4 border-black p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center">
                      <FiShoppingBag className="mx-auto text-6xl text-zinc-300 mb-4" />
                      <h3 className="text-2xl font-bold uppercase mb-2">
                        No Active Orders
                      </h3>
                      <p className="font-semibold text-zinc-500">
                        You don't have any confirmed orders yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= MY PRODUCTS TAB ================= */}
          {activeTab === "my-products" && (
            <motion.div
              key="my-products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {myStatus === "loading" ? (
                <Loader />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="h-48 bg-zinc-200 border-b-4 border-black">
                        {product.images?.length > 0 ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <FiImage size={40} />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-extrabold uppercase truncate">
                            {product.name}
                          </h3>
                          <p className="font-semibold text-sm text-zinc-600 mb-2">
                            {product.category}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="font-extrabold text-xl text-emerald-600">
                            ${product.price}
                          </span>
                          <span className="font-bold text-sm bg-zinc-100 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            Stock: {product.stock}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t-2 border-dashed border-zinc-300">
                          <motion.button
                            onClick={() => setEditingProduct(product)}
                            whileHover={{
                              scale: 1.05,
                              y: -2,
                              boxShadow: "2px 2px 0px 0px black",
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 bg-yellow-300 border-2 border-black py-2 flex justify-center items-center gap-2 font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <FiEdit size={16} /> Edit
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteProduct(product._id)}
                            whileHover={{
                              scale: 1.05,
                              y: -2,
                              boxShadow: "2px 2px 0px 0px black",
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 bg-rose-400 border-2 border-black py-2 flex justify-center items-center gap-2 font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <FiTrash2 size={16} /> Delete
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full p-8 text-center border-4 border-black bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold uppercase text-zinc-500">
                      You have not added any products yet.
                    </div>
                  )}
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
              <ProductForm
                onSubmit={(data) => dispatch(createProduct(data))}
                status={mutationStatus}
                onSuccess={() => setActiveTab("my-products")}
                isEdit={false}
              />
            </motion.div>
          )}

          {/* ================= REVIEWS TAB ================= */}
          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {vendorStatus === "loading" ? (
                <Loader />
              ) : (
                <div className="space-y-4">
                  {vendorReviews?.length > 0 ? (
                    vendorReviews.map((review) => (
                      <div
                        key={review._id}
                        className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-lg">{review.product?.name}</p>
                            <p className="text-sm text-zinc-500 font-semibold">Reviewed by: {review.user?.name}</p>
                          </div>
                          <span className="text-yellow-500 text-xl tracking-widest">
                            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                          </span>
                        </div>
                        <p className="font-semibold text-zinc-800 mt-2 bg-zinc-100 p-3 border-2 border-black rounded-lg">
                          "{review.comment}"
                        </p>
                        <p className="text-xs text-zinc-400 font-bold mt-3 text-right">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border-4 border-black p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center">
                      <FiStar className="mx-auto text-6xl text-zinc-300 mb-4" />
                      <h3 className="text-2xl font-bold uppercase mb-2">
                        No Reviews Yet
                      </h3>
                      <p className="font-semibold text-zinc-500">
                        When customers review your products, they will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ================= EDIT PRODUCT MODAL ================= */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl my-8"
            >
              <button
                onClick={() => setEditingProduct(null)}
                className="absolute -top-4 -right-4 bg-rose-400 border-4 border-black p-2 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 hover:bg-rose-500 transition-colors"
              >
                <FiX size={24} />
              </button>
              <ProductForm
                initialData={editingProduct}
                onSubmit={(data) =>
                  handleUpdateProductSubmit(editingProduct._id, data)
                }
                status={mutationStatus}
                isEdit={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

const StatCard = ({ title, value, color }) => (
  <div
    className={`${color} border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col justify-between`}
  >
    <h3 className="font-bold uppercase text-black text-sm mb-4">{title}</h3>
    <p className="text-5xl font-extrabold text-black">{value}</p>
  </div>
);

const Loader = () => (
  <div className="flex justify-center p-10">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
  </div>
);

function ProductForm({ initialData, onSubmit, status, onSuccess, isEdit }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
    category: initialData?.category || "",
  });
  const [images, setImages] = useState([]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    if (e.target.files.length > 5) {
      alert("You can only upload up to 5 images.");
      return;
    }
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && images.length === 0)
      return alert("At least one image is required.");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("stock", formData.stock);
    data.append("category", formData.category);

    if (images.length > 0) {
      images.forEach((img) => data.append("images", img));
    }

    await onSubmit(data);

    if (!isEdit && onSuccess) {
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
      });
      setImages([]);
      onSuccess();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl w-full"
    >
      <h2 className="text-2xl font-extrabold uppercase mb-6 border-b-4 border-black pb-2">
        {isEdit ? "Edit Product" : "Add New Product"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="font-bold text-zinc-800 uppercase text-sm">
            Product Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input border-2 border-black px-4 py-3 bg-zinc-100 font-semibold focus:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="font-bold text-zinc-800 uppercase text-sm">
            Price ($)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="form-input border-2 border-black px-4 py-3 bg-zinc-100 font-semibold focus:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="font-bold text-zinc-800 uppercase text-sm">
            Stock Quantity
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            className="form-input border-2 border-black px-4 py-3 bg-zinc-100 font-semibold focus:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="font-bold text-zinc-800 uppercase text-sm">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="form-input border-2 border-black px-4 py-3 bg-zinc-100 font-semibold focus:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer appearance-none"
          >
            <option value="" disabled>
              Select a category
            </option>
            <option value="clothing">Clothing</option>
            <option value="accessories">Accessories</option>
            <option value="electronics">Electronics</option>
          </select>
        </div>

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="font-bold text-zinc-800 uppercase text-sm">
            {isEdit
              ? "Update Images (Leave empty to keep current)"
              : "Images (Max 5)"}
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            required={!isEdit}
            className="form-input border-2 border-black px-4 py-2 bg-zinc-100 font-semibold cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="font-bold text-zinc-800 uppercase text-sm">
            Description
          </label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            required
            className="form-input border-2 border-black px-4 py-3 bg-zinc-100 font-semibold focus:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
          />
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{
          scale: 1.01,
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
          y: -2,
        }}
        whileTap={{ scale: 0.98 }}
        disabled={status === "loading"}
        className="w-full bg-violet-400 border-4 border-black px-4 py-4 uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-extrabold text-lg transition-all disabled:opacity-70"
      >
        {status === "loading"
          ? "Saving..."
          : isEdit
            ? "Update Product"
            : "Publish Product"}
      </motion.button>
    </form>
  );
}

export default VendorDashboard;