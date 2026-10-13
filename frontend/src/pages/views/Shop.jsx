import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useMemo } from "react";
import { addToCart } from "../../redux/features/cartSlice";
import { fetchProducts } from "../../redux/features/productSlice";
import { fetchRecommendations } from "../../redux/features/recommendationSlice"; // Added Import
import { selectUser, selectAuthStatus } from "../../redux/features/userSlice";
import { useNavigate } from "react-router-dom";

import SEO from "../components/SEO.jsx";

function Shop() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Standard Products State
  const { items, status } = useSelector((state) => state.products);
  
  // Recommendation State (New)
  const { items: recommendedItems, status: recommendationStatus } = useSelector((state) => state.recommendations);
  
  // Cart State (Fixed to access .items to match cartSlice)
  const cartItems = useSelector((state) => state.cart.items) || [];
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectAuthStatus) === "authenticated";

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [cartError, setCartError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Fetch standard products on mount
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  // Fetch recommendations on mount if logged in (New)
  useEffect(() => {
    if (isLoggedIn && recommendationStatus === "idle") {
      dispatch(fetchRecommendations());
    }
  }, [isLoggedIn, recommendationStatus, dispatch]);

  // Reset to page 1 whenever category or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Filter logic (Updated to handle "Recommended" tab)
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return selectedCategory === "Recommended"
      ? recommendedItems.filter((item) =>
          item.name?.toLowerCase().includes(normalizedSearch),
        )
      : items.filter((item) => {
          const matchCategory =
            selectedCategory === "All" ||
            item.category?.toLowerCase() === selectedCategory.toLowerCase();
          const matchSearch = item.name
            ?.toLowerCase()
            .includes(normalizedSearch);

          return matchCategory && matchSearch;
        });
  }, [items, recommendedItems, searchQuery, selectedCategory]);

  // Pagination logic
  const { currentItems, totalPages } = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    return {
      currentItems: filteredProducts.slice(indexOfFirstItem, indexOfLastItem),
      totalPages: Math.ceil(filteredProducts.length / itemsPerPage),
    };
  }, [currentPage, filteredProducts]);

  if (status === "idle" || status === "loading") {
    return (
      <p className="text-center mt-20 font-bold text-xl">Vibe is Loading...</p>
    );
  }

  const handleAddToCart = async (event, product) => {
    event.stopPropagation();
    setCartError("");
    setAddingProductId(product._id);

    try {
      await dispatch(
        addToCart({ productId: product._id, quantity: 1 }),
      ).unwrap();
    } catch (error) {
      setCartError(error || "Unable to add this product to your cart.");
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <>
      <SEO
        title="Shop"
        description="Stop by our shop and explore a wide range of products that cater to your unique style and vibe. From trendy fashion pieces to must-have accessories, we have everything you need to express yourself. Shop now and elevate your vibe with our curated collection."
        canonical="https://vibes-ecommerce-website.vercel.app/shop"
      />
      {isLoggedIn && user ? (
        <div className="w-full min-h-screen overflow-x-hidden bg-white text-black">
          <div className="mt-[18vh] flex justify-center">
            <input
              type="text"
              placeholder="Search your vibe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-4 border-black px-4 py-2 w-1/2 font-bold rounded-md font-[poppins]"
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-12">
            <div className="w-full font-semibold font-[poppins] px-10 text-2xl flex flex-wrap items-center justify-around mt-[5vh] lg:mt-[10vh]">
              {[
                "All",
                "clothing",
                "accessories",
                "electronics",
                "Shoes",
                "Recommended",
              ].map((item) => (
                <motion.button
                  key={item}
                  whileHover={{
                    x: 4,
                    y: 4,
                    boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  animate={{
                    backgroundColor:
                      selectedCategory === item ? "#FFFFFF" : "#10b981",
                    transition: { duration: 0.5 },
                  }}
                  onClick={() => setSelectedCategory(item)}
                  className={`px-[2rem] text-[1.3vmax] border-4 border-black font-semibold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-2 mt-4 lg:mt-0`}
                >
                  {item === "All"
                    ? item
                    : item[0].toUpperCase() + item.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-10 mb-10">
            {cartError && (
              <p className="col-span-full border-4 border-black bg-rose-200 p-3 font-bold text-rose-900">
                {cartError}
              </p>
            )}
            
            {selectedCategory === "Recommended" && recommendationStatus === "loading" ? (
               <div className="col-span-full flex justify-center p-10">
                 <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
               </div>
            ) : currentItems.length > 0 ? (
              currentItems.map((item) => (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -10 }}
                  className="border-4 border-black p-4 rounded-xl funky-shadow cursor-pointer flex flex-col"
                  onClick={() => navigate(`/product/${item._id}`)}
                >
                  <img
                    src={item.images?.[0]?.url}
                    alt={item.name}
                    loading="lazy"
                    className="h-64 w-full object-cover mb-4 background-yellow-300 rounded-md"
                  />
                  <h3 className="font-black uppercase">{item.name}</h3>
                  <p className="text-xl font-bold mb-auto">${item.price}</p>

                  {/* FIXED: Check cartItem.product._id to match the nested slice structure */}
                  {cartItems.some((cartItem) => cartItem.product?._id === item._id) ? (
                    <motion.button
                      onClick={(e) => e.stopPropagation()} // Prevent card navigation
                      whileHover={{
                        x: 4,
                        y: 4,
                        boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="w-full bg-white text-zinc-900 border-4 border-zinc-950 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold py-2 text-md mt-4"
                      disabled
                    >
                      Ordered
                    </motion.button>
                  ) : item.stock < 1 ? (
                    <motion.button
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-zinc-300 text-zinc-700 border-4 border-zinc-950 uppercase font-bold py-2 text-md mt-4 cursor-not-allowed"
                      disabled
                    >
                      Sold Out
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={(e) => handleAddToCart(e, item)}
                      whileHover={{
                        x: 4,
                        y: 4,
                        boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
                      }}
                      whileTap={{ scale: 0.9 }}
                      disabled={addingProductId === item._id}
                      className="w-full bg-emerald-400 border-4 border-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold py-2 text-md mt-4"
                    >
                      {addingProductId === item._id ? "Adding..." : "Add to Cart"}
                    </motion.button>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="col-span-full text-center font-bold text-xl">
                No products match your vibe 😶
              </p>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mb-12 font-[poppins]">
              <motion.button
                whileHover={
                  currentPage === 1
                    ? {}
                    : { x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }
                }
                whileTap={currentPage === 1 ? {} : { scale: 0.9 }}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-6 py-2 border-4 border-black font-bold uppercase transition-all ${
                  currentPage === 1
                    ? "bg-zinc-200 opacity-60 cursor-not-allowed"
                    : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                Previous
              </motion.button>

              <span className="font-extrabold text-lg uppercase bg-yellow-300 border-4 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {currentPage} / {totalPages}
              </span>

              <motion.button
                whileHover={
                  currentPage === totalPages
                    ? {}
                    : { x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }
                }
                whileTap={currentPage === totalPages ? {} : { scale: 0.9 }}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-6 py-2 border-4 border-black font-bold uppercase transition-all ${
                  currentPage === totalPages
                    ? "bg-zinc-200 opacity-60 cursor-not-allowed"
                    : "bg-emerald-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                Next
              </motion.button>
            </div>
          )}

          <Footer />
        </div>
      ) : (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-white text-black font-[poppins]">
          <h1 className="text-3xl font-bold mb-4">Please Log In to Shop</h1>
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 0px 0px 0px black",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/vibe/login")}
            className="bg-emerald-400 border-4 border-black px-4 py-2 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-lg"
          >
            Log In
          </motion.button>
        </div>
      )}
    </>
  );
}

export default Shop;