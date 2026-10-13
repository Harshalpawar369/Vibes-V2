import React, { useState } from "react";
import { FiShoppingBag } from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HiMenu } from "react-icons/hi";
import { 
  selectUser, 
  selectIsAuthenticated,
  logoutUser 
} from "../../redux/features/userSlice";
import { fetchCart } from "../../redux/features/cartSlice";
import { useSelector, useDispatch } from "react-redux";

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsAuthenticated);
  const cartItems = useSelector((state) => state.cart.items) || [];
  
  

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Shop", path: "/shop" },
  ];

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await dispatch(logoutUser());
    navigate("/");
  };

  return (
    <>
      <motion.nav
        animate={{ y: 0, opacity: 1 }}
        initial={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="navsec w-full fixed z-[100] flex items-center justify-between flex-wrap px-3 py-1.5 bg-white shadow-md font-[poppins] text-zinc-950"
      >
        <div className="ml-3 text-2xl font-bold font-[poppins] font-extrabold logo sm:ml-4 md:ml-5 md:text-3xl">
          Vibes
        </div>

        <div className="hidden md:flex md:items-center md:space-x-8 navbar-links">
          {navItems.map((item, index) => (
            <motion.button
              onClick={() => {
                navigate(item.path);
                setMenuOpen(false);
              }}
              whileHover={{ scale: 1.15 }}
              key={index}
              className="font-semibold font-[poppins] text-[17px] hover:text-gray-600 transition-all border-none outline-none"
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        <div className="relative flex flex-wrap justify-around items-center gap-2 sm:gap-3 md:gap-4">
          <motion.div whileHover={{}} className="mb-0.5 relative">
            {isLoggedIn && user ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="font-[poppins] font-semibold text-xs sm:text-sm md:text-base hover:text-gray-600 focus:outline-none"
                >
                  Hi! {user.name}
                </button>
                
                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/profile");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-emerald-100 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/apply-vendor"); // Update with your actual route
                      }}
                      className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-emerald-100 transition-colors"
                    >
                      Apply for Vendor
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0px 0px 0px 0px black",
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate("/vibe/login/")}
                  className="bg-emerald-400 border-3 border-black px-1.5 py-1 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-xs sm:text-sm"
                >
                  LogIn
                </motion.button>
              </div>
            )}
          </motion.div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            aria-label="Toggle navigation menu"
          >
            <HiMenu size={22} />
          </button>

          {/* ADDED: Wrapped Shopping Bag in a relative div so the absolute badge anchors to it */}
          <div className="relative">
            <motion.div
              whileHover={{ rotateZ: 20 }}
              onClick={() => navigate("/cart")}
              className="bg-emerald-400 rounded-full border-2 border-black mr-1.5 uppercase shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <FiShoppingBag fetchPriority="high" size={35} className="p-1" />
            </motion.div>
            
            {/* ADDED: Cart Items Badge (Only shows if there are items in the cart) */}
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-0.5 bg-gray-900 rounded-full text-white w-5 h-5 text-center flex items-center justify-center text-[13.5px] font-bold z-10">
                {cartItems.length}
              </span>
            )}
          </div>

        </div>

        {menuOpen && (
          <div className="w-full md:hidden">
            <div className="mt-2 flex flex-col space-y-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-md">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left font-semibold font-[poppins] text-base hover:text-gray-600 transition-all border-none outline-none"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.nav>
    </>
  );
}

export default Navbar;