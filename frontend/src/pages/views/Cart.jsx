import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import Footer from "../components/Footer";
import { useDispatch, useSelector } from "react-redux";

import { removeFromCart, clearCart, updateCartItem } from "../../redux/features/cartSlice.js";
import { cancelOrder, fetchMyOrders, createOrder, verifyPayment } from "../../redux/features/orderSlice.js"; 
import { selectUser, selectAuthStatus } from "../../redux/features/userSlice";

import SEO from '../components/SEO.jsx';

function Cart() {
  const dispatch = useDispatch();
  
  const storedCartItems = useSelector((state) => state.cart.items);
  const cartItems = useMemo(() => storedCartItems || [], [storedCartItems]);
  const orders = useSelector((state) => state.orders.items) || [];
  const status = useSelector((state) => state.orders.status);
  const mutationStatus = useSelector((state) => state.orders.mutationStatus);
  
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectAuthStatus) === "authenticated";

  const { totalQuantity, totalAmount } = useMemo(
    () =>
      cartItems.reduce(
        (totals, item) => {
          const quantity = item.quantity || 1;
          totals.totalQuantity += quantity;
          totals.totalAmount += (item.product?.price || 0) * quantity;
          return totals;
        },
        { totalQuantity: 0, totalAmount: 0 },
      ),
    [cartItems],
  );

  const [showOrderForm, setShowOrderForm] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, isLoggedIn]);

  const canPlaceOrder = cartItems.length > 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (productId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return; 
    dispatch(updateCartItem({ productId, quantity: newQty }));
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await dispatch(cancelOrder(orderId)).unwrap();
        alert("Order cancelled successfully.");
      } catch (error) {
        console.error("Failed to cancel order:", error);
        alert(error || "Failed to cancel the order. It might already be processed.");
      }
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    setFormError("");

    const requiredFields = ["fullName", "phone", "address", "city", "state", "pincode"];
    for (const field of requiredFields) {
      if (!shippingAddress[field].trim()) {
        setFormError(`Please fill in your ${field}.`);
        return;
      }
    }

    if (paymentMethod === "razorpay") {
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        setFormError("Unable to load Razorpay.");
        return;
      }
    }

    const payload = {
      shippingAddress,
      paymentMethod 
    };

    try {
      const response = await dispatch(createOrder(payload)).unwrap();
      
      if (paymentMethod === "cod") {
        dispatch(clearCart());
        dispatch(fetchMyOrders());
        setShippingAddress({ fullName: "", phone: "", address: "", city: "", state: "", pincode: "" });
        setShowOrderForm(false);
        alert("Order placed successfully via Cash on Delivery!");
        return;
      }

      const newOrder = response.order;
      const razorpayData = response.razorpay;

      if (!newOrder || !razorpayData) {
        setFormError("Order created but missing Razorpay details from backend.");
        return;
      }

      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount, 
        currency: razorpayData.currency,
        order_id: razorpayData.orderId,
        name: "Vibes",
        description: "Order Payment",
        handler: async function (paymentResponse) {
          try {
            await dispatch(
              verifyPayment({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: newOrder._id, 
              })
            ).unwrap(); 

            dispatch(clearCart());
            dispatch(fetchMyOrders());
            setShippingAddress({ fullName: "", phone: "", address: "", city: "", state: "", pincode: "" });
            setShowOrderForm(false);
            alert("Payment Successful!");

          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            setFormError("Payment verification failed. Please try again.");
            // AUTO-CANCEL: If verification fails, kill the order so they can retry
            await dispatch(cancelOrder(newOrder._id));
            dispatch(fetchMyOrders());
          }
        },
        modal: {
          ondismiss: async function () {
            setFormError("Payment window was closed. You can retry placing your order.");
            // AUTO-CANCEL: If they close the window, kill the order so they can retry
            await dispatch(cancelOrder(newOrder._id));
            dispatch(fetchMyOrders());
          }
        },
        prefill: {
          name: shippingAddress.fullName,
          contact: shippingAddress.phone,
        },
        theme: {
          color: "#10b981",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Checkout process error:", error);
      setFormError(error?.message || error || "An unexpected error occurred during checkout.");
    }
  };

  return (
    <>
    <SEO
      title="Vibes | Cart"
      description="View your selected items in the cart, manage quantities, and proceed to checkout. Ensure a smooth shopping experience with Vibes E-commerce Website."
      canonical="https://vibes-ecommerce-website.vercel.app//cart"
    />
    
    <div className="w-full min-h-screen bg-white text-black font-[poppins]">
      <div className="pt-[18vh] px-6 md:px-12">
        <h1 className="text-3xl font-black mb-6">Your Cart</h1>

        {!isLoggedIn && (
          <div className="border-4 border-black p-4 mb-6 bg-yellow-200 font-semibold rounded-2xl">
            Please log in first to order and see your order history.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="border-4 border-black p-6 text-center font-semibold rounded-2xl">
                Your cart is empty.
              </div>
            ) : (
              <AnimatePresence>
                {cartItems.map((item) => (
                  <Motion.div
                    key={item.product?._id || Math.random()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -200 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="border-4 border-black p-4 flex flex-col md:flex-row gap-4 rounded-2xl"
                  >
                    <img
                      src={item.product?.images?.[0]?.url || ""}
                      alt={item.product?.name || "Product"}
                      loading="lazy"
                      className="w-full md:w-40 h-40 object-cover border-2 border-black rounded-2xl background-yellow-300 "
                    />
                    <div className="flex-1 flex flex-col justify-center">
                      <h2 className="text-xl font-black">{item.product?.name}</h2>
                      <p className="font-semibold">Price: ${item.product?.price}</p>
                      
                      <div className="flex items-center gap-3 my-2">
                        <span className="font-semibold">Quantity:</span>
                        <div className="flex items-center border-2 border-black rounded-lg overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white w-fit">
                          <button 
                            onClick={() => handleQuantityChange(item.product?._id, item.quantity, -1)}
                            disabled={item.quantity <= 1}
                            className="px-3 py-1 font-black bg-zinc-100 hover:bg-emerald-400 border-r-2 border-black transition-colors disabled:opacity-50 disabled:hover:bg-zinc-100"
                          >
                            -
                          </button>
                          <span className="px-4 font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(item.product?._id, item.quantity, 1)}
                            className="px-3 py-1 font-black bg-zinc-100 hover:bg-emerald-400 border-l-2 border-black transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <p className="font-semibold">
                        Total: ${(item.product?.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <Motion.button
                      whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => dispatch(removeFromCart(item.product?._id))}
                      className="px-3.5 h-fit mt-auto md:mt-0 md:ml-auto bg-emerald-400 border-4 border-black font-bold uppercase rounded-2xl self-start"
                    >
                      Remove
                    </Motion.button>
                  </Motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="border-4 border-black p-6 h-fit sticky top-[20vh] rounded-2xl">
            <h2 className="text-2xl font-black mb-4">Summary</h2>
            <p className="font-semibold mb-2">Items: {totalQuantity}</p>
            <p className="font-semibold mb-4">Total: ₹{totalAmount.toFixed(2)}</p>

            <Motion.button
              whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              disabled={!canPlaceOrder || !isLoggedIn}
              onClick={() => setShowOrderForm(true)}
              className="w-full bg-emerald-400 border-4 border-black font-black uppercase py-2 disabled:opacity-60 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Order Now
            </Motion.button>
          </div>
        </div>

        <div className="mt-12 mb-5">
          <h2 className="text-2xl font-black mb-4">Order History</h2>
          {!isLoggedIn ? (
            <div className="border-4 border-black p-6 text-center font-semibold rounded-2xl">
              Please log in to see your orders.
            </div>
          ) : status === "loading" ? (
            <div className="border-4 border-black p-6 text-center font-semibold">
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="border-4 border-black p-6 text-center font-semibold rounded-2xl">
              No orders yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className={`border-4 p-4 rounded-2xl transition-colors ${order.orderStatus === 'cancelled' ? 'border-zinc-400 bg-zinc-100 opacity-80' : 'border-black bg-white'}`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <p className="font-bold">Order ID: {order.orderId || order._id}</p>
                      <p className="font-semibold">
                        Total: ₹{order.totalPrice}
                      </p>
                      <p className="font-semibold flex flex-wrap items-center gap-2">
                        Status: <span className="uppercase font-bold">{order.orderStatus}</span> 
                        
                        {order.orderStatus === 'cancelled' && (
                          <span className="text-sm text-zinc-600 border border-zinc-400 px-2 rounded-md font-bold bg-zinc-200">Cancelled</span>
                        )}

                        {order.orderStatus !== 'cancelled' && order.paymentMethod === 'cod' && (
                          <span className="text-sm text-zinc-600 border border-zinc-300 px-2 rounded-md">Cash on Delivery</span>
                        )}
                        
                        {order.orderStatus !== 'cancelled' && order.paymentMethod === 'razorpay' && order.isPaid && (
                          <span className="text-sm text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 rounded-md font-bold">Paid via Razorpay</span>
                        )}
                        
                        {order.orderStatus !== 'cancelled' && order.paymentMethod === 'razorpay' && !order.isPaid && (
                          <span className="text-sm text-rose-700 bg-rose-100 border border-rose-300 px-2 rounded-md font-bold">Payment Pending</span>
                        )}
                      </p>
                    </div>
                    {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                      <Motion.button
                        whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={() => handleCancelOrder(order._id)}
                        className="px-4 py-2 bg-rose-400 border-4 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Cancel Order
                      </Motion.button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {order.items?.map((line) => (
                      <div
                        key={line._id || Math.random()}
                        className={`border-2 p-2 rounded-2xl ${order.orderStatus === 'cancelled' ? 'border-zinc-400' : 'border-black'}`}
                      >
                        <p className="font-semibold">
                          {line.name || line.product?.name || "Item"}
                        </p>
                        <p className="font-semibold">Qty: {line.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showOrderForm && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <Motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-4 border-black p-6 w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-black mb-4">Checkout</h2>
              <form onSubmit={handleSubmitOrder} className="space-y-3">
                
                <div className="border-b-2 border-black pb-4 mb-2">
                  <label className="block font-black mb-3 text-lg uppercase">1. Payment Method</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex items-center gap-2 cursor-pointer font-bold border-2 border-black p-3 rounded-lg flex-1 transition-colors ${paymentMethod === 'razorpay' ? 'bg-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="razorpay" 
                        checked={paymentMethod === "razorpay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 accent-black"
                      />
                      Pay Online
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer font-bold border-2 border-black p-3 rounded-lg flex-1 transition-colors ${paymentMethod === 'cod' ? 'bg-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cod" 
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 accent-black"
                      />
                      Cash on Delivery
                    </label>
                  </div>
                </div>

                <label className="block font-black pt-2 mb-2 text-lg uppercase">2. Shipping Details</label>
                <div>
                  <label className="block font-bold mb-1 text-sm">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    className="w-full border-4 border-black p-2 outline-none focus:bg-zinc-100"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-sm">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    className="w-full border-4 border-black p-2 outline-none focus:bg-zinc-100"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-sm">Address</label>
                  <textarea
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                    className="w-full border-4 border-black p-2 resize-none outline-none focus:bg-zinc-100"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-sm">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className="w-full border-4 border-black p-2 outline-none focus:bg-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-sm">State</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      className="w-full border-4 border-black p-2 outline-none focus:bg-zinc-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-sm">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={shippingAddress.pincode}
                    onChange={handleInputChange}
                    className="w-full border-4 border-black p-2 outline-none focus:bg-zinc-100"
                  />
                </div>

                {formError && (
                  <p className="text-red-600 font-bold text-sm bg-red-100 p-2 border-2 border-red-600">{formError}</p>
                )}
                <div className="flex gap-3 pt-4">
                  <Motion.button
                    whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    type="submit"
                    disabled={mutationStatus === "loading"}
                    className="flex-1 bg-black text-white border-4 border-black font-black py-3 uppercase disabled:opacity-60 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]"
                  >
                    {mutationStatus === "loading"
                      ? "Processing..."
                      : paymentMethod === 'cod' 
                        ? `Place Order (₹${totalAmount.toFixed(2)})` 
                        : `Pay ₹${totalAmount.toFixed(2)}`
                    }
                  </Motion.button>
                  <Motion.button
                    whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    className="flex-1 bg-white border-4 border-black font-bold py-3 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Close
                  </Motion.button>
                </div>
              </form>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
    </>
  );
}

export default Cart;