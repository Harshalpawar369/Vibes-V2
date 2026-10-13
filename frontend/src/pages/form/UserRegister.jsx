import { useRef, useState, useEffect } from "react";
import formvideoBackground from "/video/formvideoBackground.mp4";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";

import {
  registerUser,
  selectAuthStatus,
  selectAuthError,
  clearAuthError,
} from "../../redux/features/userSlice";

const UserRegister = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [show, setShow] = useState(false);
  const [hidepassword, setHidepassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // ---------- Reusable shake animation ----------
  const shakeForm = () => {
    gsap.to(".pop", {
      x: 10,
      scale: 0.98,
      duration: 0.1,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 5,
    });
  };

  // ---------- Redux error effect (in case thunk rejects via rejectWithValue) ----------
  useEffect(() => {
    if (error) {
      toast.error(error);
      shakeForm();
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    const clean = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
    };

    try {
      const result = await dispatch(registerUser(clean));

      if (result.meta.requestStatus === "fulfilled") {
        toast.success("Account created! Please login.");
        navigate("/vibe/login");
      } else {
        // Thunk returned rejectWithValue — error is in result.payload
        const msg = result.payload || "Registration failed";
        toast.error(msg);
        shakeForm();
      }
    } catch (err) {
      // Thunk threw — catch it manually
      const msg = err?.message || err || "Something went wrong";
      toast.error(msg);
      shakeForm();
    } finally {
      setSubmitting(false);
    }
  };

  useGSAP(() => {
    const video = videoRef.current;
    gsap.delayedCall(5, () => {
      if (video) {
        video.pause();
        video.currentTime = 5;
      }
      setShow(true);
      gsap.from(".pop", {
        scale: 0,
        opacity: 0,
        y: -40,
        rotate: -10,
        duration: 0.2,
        ease: "back.out(1.7)",
      });
    });
  });

  const isLoading = status === "loading" || submitting;

  return (
    <>
      <div className="relative w-full h-screen min-h-screen overflow-hidden bg-black video-container">
        <video
          autoPlay
          muted
          src={formvideoBackground}
          ref={videoRef}
          onEnded={() => console.log("Video ended")}
          className="bg-video absolute inset-0 z-0 block w-full h-full object-cover"
        ></video>

        <div
          className={`${
            show ? "flex" : "hidden"
          } relative z-10 items-center justify-center h-screen px-4`}
        >
          <div className="pop">
            <div className="pop-inner bg-white/10 backdrop-blur-xl p-8 rounded-4xl border-4 border-black funky-shadow w-full max-w-md animate-[wiggle_3s_ease-in-out_infinite]">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-orange-500">
                  Join<br></br>Club
                </h1>
                <span className="bg-emerald-400 text-black px-3 py-1 font-bold text-xs -rotate-12 rounded-sm">
                  Vibe fill
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="USERNAME"
                  required
                  className="w-full bg-black/40 border-2 border-black p-4 rounded-xl font-bold placeholder:text-zinc-600 outline-none focus:bg-white focus:text-black transition-all"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="EMAIL"
                  required
                  className="w-full bg-black/40 border-2 border-black p-4 rounded-xl font-bold placeholder:text-zinc-600 outline-none focus:bg-white focus:text-black transition-all"
                />

                <div className="relative w-full">
                  <input
                    type={hidepassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="PASSWORD"
                    required
                    className="w-full bg-black/40 border-2 border-black p-4 pr-12 rounded-xl font-bold placeholder:text-zinc-600 outline-none focus:bg-white focus:text-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setHidepassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={hidepassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                  >
                    {hidepassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="CONTACT NO"
                  required
                  className="w-full bg-black/40 border-2 border-black p-4 rounded-xl font-bold placeholder:text-zinc-600 outline-none focus:bg-white focus:text-black transition-all"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-600 border-4 border-black py-4 rounded-2xl font-black text-xl hover:bg-yellow-400 hover:text-black transition-all active:scale-95 uppercase disabled:opacity-50"
                >
                  {isLoading ? "Igniting..." : "Ignition →"}
                </button>

                <div>
                  <p className="text-black font-bold text-center">
                    Already a member?{" "}
                    <span
                      className="text-blue-600 cursor-pointer"
                      onClick={() => navigate("/vibe/login")}
                    >
                      Login
                    </span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserRegister;