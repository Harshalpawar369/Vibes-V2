import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  selectUser, 
  requestVendor, 
  selectAuthStatus,
  fetchVendorRequestStatus // Assuming you exported this thunk in userSlice
} from "../../redux/features/userSlice";

function ApplyVendor() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);

  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    reason: "",
  });

  // Fetch the latest vendor request status when the component mounts
  useEffect(() => {
    dispatch(fetchVendorRequestStatus());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send the flat payload exactly as the backend controller expects it
    await dispatch(requestVendor(formData));
  };

  // If user is already a vendor
  if (user?.role === "vendor") {
    return (
      <div className="min-h-screen bg-zinc-50 pt-24 pb-12 flex items-center justify-center px-4 font-[poppins]">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center max-w-md">
          <h1 className="text-3xl font-extrabold text-zinc-950 mb-4 uppercase">You're In!</h1>
          <p className="font-semibold text-zinc-700 mb-6">You are already an approved vendor.</p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/vendor-dashboard")}
            className="w-full bg-emerald-400 border-2 border-black px-4 py-3 uppercase font-bold"
          >
            Go to Dashboard
          </motion.button>
        </div>
      </div>
    );
  }

  // If request is pending
  if (user?.vendorRequestStatus === "pending") {
    return (
      <div className="min-h-screen bg-zinc-50 pt-24 pb-12 flex items-center justify-center px-4 font-[poppins]">
        <div className="bg-yellow-300 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center max-w-md">
          <h1 className="text-3xl font-extrabold text-black mb-4 uppercase">Hang Tight!</h1>
          <p className="font-bold text-black mb-2">Your application is under review.</p>
          <p className="font-semibold text-zinc-800 text-sm">
            Our admins are checking your details. We'll update your account status soon.
          </p>
        </div>
      </div>
    );
  }

  // Application Form
  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 flex items-center justify-center px-4 font-[poppins]">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-2 uppercase tracking-tight">
          Start Selling
        </h1>
        <p className="font-semibold text-zinc-600 mb-6 text-sm">
          Apply to become a vendor and share your vibe with the world.
        </p>

        {user?.vendorRequestStatus === "rejected" && (
           <div className="mb-6 p-4 bg-rose-200 border-2 border-black text-rose-900 text-sm">
             <p className="font-bold uppercase mb-1">Application Rejected</p>
             <p className="font-semibold">
               Reason: {user?.rejectionReason || "No specific reason provided."}
             </p>
             <p className="mt-2 text-xs font-bold">You may update your details and try applying again.</p>
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col space-y-1.5">
            <label className="font-bold text-zinc-800 uppercase text-sm">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              placeholder="e.g. Vibe Kicks"
              className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-yellow-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-bold text-zinc-800 uppercase text-sm">Business Phone</label>
            <input
              type="tel"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleChange}
              required
              placeholder="e.g. +1 234 567 8900"
              className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-yellow-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-bold text-zinc-800 uppercase text-sm">Business Address</label>
            <textarea
              name="businessAddress"
              rows="2"
              value={formData.businessAddress}
              onChange={handleChange}
              required
              placeholder="Full physical address of your business"
              className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-yellow-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
            ></textarea>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-bold text-zinc-800 uppercase text-sm">Reason for Joining (Optional)</label>
            <textarea
              name="reason"
              rows="3"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Why do you want to sell on Vibes?"
              className="w-full px-4 py-3 bg-zinc-100 border-2 border-black focus:bg-yellow-50 focus:outline-none transition-colors font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
            ></textarea>
          </div>

          <div className="pt-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)", y: 2, x: 2 }}
              whileTap={{ scale: 0.95 }}
              disabled={status === "loading"}
              className="w-full bg-blue-400 border-4 border-black px-4 py-4 uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-extrabold text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Submitting..." : "Submit Application"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default ApplyVendor;