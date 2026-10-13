import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";

// Redux Actions
import { addToCart } from "../../redux/features/cartSlice";
import { fetchProductById } from "../../redux/features/productSlice";
import { fetchProductReviews, addReview } from "../../redux/features/reviewSlice";
import { toggleWishlist, fetchWishlist } from "../../redux/features/wishlistSlice";
import { selectUser, selectAuthStatus } from "../../redux/features/userSlice";

import SEO from "../components/SEO.jsx";
import Footer from "../components/Footer.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Auth State
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectAuthStatus) === "authenticated";

  // Redux Store State
  const cartItems = useSelector((state) => state.cart.items);
  const { current: product, currentStatus: productStatus } = useSelector((state) => state.products);
  const { items: reviews, status: reviewStatus } = useSelector((state) => state.reviews);
  const wishlistProducts = useSelector((state) => state.wishlist.products);

  // Component State
  const [activeImage, setActiveImage] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [localReviewError, setLocalReviewError] = useState("");
  const [localReviewSuccess, setLocalReviewSuccess] = useState("");

  // Check if product is in cart or wishlist
  const isOrdered = cartItems?.some((item) => item._id === id);
  const isInWishlist = wishlistProducts?.some((item) => (item._id || item) === id);

  // Fetch data on mount or ID change
  useEffect(() => {
    dispatch(fetchProductById(id)).then((action) => {
      if (action.payload?.images?.length > 0) {
        setActiveImage(action.payload.images[0].url);
      }
    });
    
    dispatch(fetchProductReviews(id));

    if (isLoggedIn && wishlistProducts.length === 0) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, id, isLoggedIn]);

  const handleWishlistToggle = () => {
    if (!isLoggedIn) {
      navigate("/vibe/login");
      return;
    }
    dispatch(toggleWishlist(id));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setLocalReviewError("");
    setLocalReviewSuccess("");

    if (!isLoggedIn) {
      setLocalReviewError("You must be logged in to leave a review.");
      return;
    }

    try {
      await dispatch(addReview({ 
        productId: id, 
        payload: { rating: Number(rating), comment: reviewText } 
      })).unwrap();
      
      setLocalReviewSuccess("Review added successfully!");
      setReviewText("");
      setRating(5);
    } catch (error) {
      setLocalReviewError(error || "Failed to submit review.");
    }
  };

  if (productStatus === "loading" || !product) {
    return <p className="text-center mt-20 font-bold text-xl font-[poppins]">Loading your vibe...</p>;
  }

  return (
    <>
      <SEO 
        title={`${product.name} | Shop`} 
        description={product.description?.substring(0, 150)} 
      />
      <div className="w-full min-h-screen bg-white text-black font-[poppins] pt-[15vh]">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* ================= IMAGE GALLERY ================= */}
          <div className="flex flex-col gap-4">
            {/* Clean white background with black border and standard neo-brutal shadow */}
            <div className="border-4 border-black rounded-xl overflow-hidden bg-white h-[50vh] lg:h-[60vh] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2">
              <img 
                src={activeImage || product.images?.[0]?.url} 
                alt={product.name} 
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
            
            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <motion.img 
                    whileHover={{ y: -4 }}
                    key={idx} 
                    src={img.url} 
                    onClick={() => setActiveImage(img.url)}
                    className={`w-24 h-24 object-cover border-4 cursor-pointer rounded-lg flex-shrink-0 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      activeImage === img.url ? 'border-emerald-400' : 'border-black'
                    }`} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* ================= PRODUCT INFO ================= */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">{product.category}</p>
              <h1 className="text-4xl lg:text-5xl font-black uppercase leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Emerald-400 Price Tag */}
              <span className="text-3xl font-extrabold bg-emerald-400 border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                ${product.price}
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-lg">⭐ {product.rating || "No"} / 5</span>
                <span className="text-sm font-semibold underline cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => document.getElementById('reviews').scrollIntoView({behavior: 'smooth'})}>
                  {product.numReviews || 0} Reviews
                </span>
              </div>
            </div>

            <p className="text-lg font-medium leading-relaxed border-l-4 border-black pl-4">
              {product.description}
            </p>

            {/* Stock Indicator */}
            <p className={`font-bold text-lg ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : "✗ Out of Stock"}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
              {isOrdered ? (
                <motion.button
                  whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex-1 w-full bg-white text-zinc-900 border-4 border-zinc-950 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black py-4 text-xl cursor-not-allowed"
                  disabled
                >
                  Already in Cart
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => dispatch(addToCart({ productId: product._id, quantity: 1 }))}
                  disabled={product.stock < 1}
                  className={`flex-1 w-full border-4 border-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black py-4 text-xl ${product.stock < 1 ? 'bg-zinc-300 opacity-70 cursor-not-allowed' : 'bg-emerald-400'}`}
                >
                  {product.stock < 1 ? 'Sold Out' : 'Add to Cart'}
                </motion.button>
              )}

              {/* WISHLIST ICON WITH RATINGS */}
              <div className="flex items-center gap-3 ml-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={handleWishlistToggle}
                  className="flex items-center justify-center p-2 focus:outline-none"
                  title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2}
                    className={`w-10 h-10 transition-colors duration-300 ${isInWishlist ? 'fill-pink-500 stroke-pink-500' : 'fill-transparent stroke-black hover:stroke-pink-500'}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </motion.button>
                
                {/* Ratings Display */}
                <div 
                  className="flex flex-col cursor-pointer group" 
                  onClick={() => document.getElementById('reviews').scrollIntoView({behavior: 'smooth'})}
                >
                  <span className="font-black text-xl leading-none group-hover:text-pink-500 transition-colors">
                    {product.rating ? `${product.rating} ⭐` : "No Rating"}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-black transition-colors mt-1">
                    {product.numReviews || 0} Reviews
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= REVIEWS SECTION ================= */}
        <div id="reviews" className="max-w-7xl mx-auto px-6 lg:px-10 mt-20 mb-20 border-t-8 border-black pt-16">
          <h2 className="text-4xl font-black uppercase mb-10">Vibe Checks (Reviews)</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Review Form */}
            <div className="lg:col-span-1 border-4 border-black p-6 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-fit">
              <h3 className="text-2xl font-black uppercase mb-4">Leave a Review</h3>
              <p className="font-bold text-sm mb-6 text-zinc-600 border-b-2 border-black pb-4">
                Note: You can only review products you have purchased and received.
              </p>
              
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-bold uppercase text-sm">Rating</label>
                  {/* Emerald-400 Select */}
                  <select 
                    value={rating} 
                    onChange={(e) => setRating(e.target.value)} 
                    className="border-4 border-black p-3 font-bold bg-emerald-400 outline-none"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold uppercase text-sm">Comment</label>
                  <textarea 
                    value={reviewText} 
                    onChange={(e) => setReviewText(e.target.value)} 
                    placeholder="Tell us what you think..." 
                    required
                    minLength={3}
                    className="border-4 border-black p-3 font-medium h-32 resize-none outline-none focus:bg-zinc-50"
                  />
                </div>

                {localReviewError && <p className="font-bold text-red-600 bg-red-100 p-2 border-2 border-red-600">{localReviewError}</p>}
                {localReviewSuccess && <p className="font-bold text-emerald-700 bg-emerald-100 p-2 border-2 border-emerald-600">{localReviewSuccess}</p>}

                <motion.button 
                  whileHover={{ x: 2, y: 2, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  disabled={reviewStatus === 'loading'}
                  className="bg-black text-white border-4 border-black px-4 py-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2 disabled:opacity-70"
                >
                  {reviewStatus === 'loading' ? 'Submitting...' : 'Submit Review'}
                </motion.button>
              </form>
            </div>

            {/* Review List */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {reviewStatus === "loading" && !reviews?.length ? (
                <p className="font-bold text-lg">Loading reviews...</p>
              ) : reviews?.length > 0 ? (
                reviews.map((rev) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={rev._id} 
                    className="border-4 border-black p-6 rounded-xl bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-2">
                      <div>
                        <span className="font-black uppercase text-lg block">{rev.user?.name || "Verified Buyer"}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Emerald-400 Rating Badge */}
                      <span className="font-black bg-emerald-400 border-2 border-black px-2 py-1">
                        {rev.rating} ⭐
                      </span>
                    </div>
                    <p className="font-medium text-lg whitespace-pre-wrap">{rev.comment}</p>
                  </motion.div>
                ))
              ) : (
                <div className="border-4 border-black border-dashed p-10 text-center rounded-xl bg-zinc-50">
                  <p className="font-black text-2xl uppercase mb-2">No Reviews Yet</p>
                  <p className="font-bold text-zinc-600">Be the first to check the vibe on this product!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}