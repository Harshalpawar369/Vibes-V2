import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  selectUser, 
  updateProfile, 
  deleteAccount, 
  selectAuthStatus, 
  selectAuthError 
} from "../../redux/features/userSlice";

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await dispatch(updateProfile(formData));
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
    if (confirmDelete) {
      await dispatch(deleteAccount());
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 flex items-center justify-center px-4 font-[poppins]">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-6 uppercase tracking-tight">
          My Vibe
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-200 border-2 border-black text-red-900 font-bold text-sm">
            {error}
          </div>
        )}

        {status === "authenticated" && !error && (
           <div className="mb-4 text-emerald-600 font-bold text-sm">
             {/* Invisible placeholder for layout stability or success flash */}
           </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="flex flex-col space-y-1.5">
            <label className="font-bold text-zinc-800 uppercase text-sm">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-bold text-zinc-800 uppercase text-sm">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-bold text-zinc-800 uppercase text-sm">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-100 border-2 border-black focus:bg-emerald-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)", y: 2, x: 2 }}
              whileTap={{ scale: 0.95 }}
              disabled={status === "loading"}
              className="flex-1 bg-emerald-400 border-3 border-black px-4 py-3 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-extrabold text-sm sm:text-base transition-all disabled:opacity-70"
            >
              {status === "loading" ? "Saving..." : "Update Profile"}
            </motion.button>

            <motion.button
              type="button"
              onClick={handleDelete}
              whileHover={{ scale: 1.02, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)", y: 2, x: 2 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-rose-400 border-3 border-black px-4 py-3 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-extrabold text-sm sm:text-base transition-all"
            >
              Delete Account
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default Profile;