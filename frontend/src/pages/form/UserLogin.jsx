import { useRef, useState, useEffect } from "react";
import backgroundVideo from "/video/backgroundVideo.mp4";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";

import {
  loginUser,
  selectAuthStatus,
  selectAuthError,
  selectUser,
  clearAuthError,
} from "../../redux/features/userSlice";

const UserLogin = () => {
  const videoRef = useRef(null);
  const containerform = useRef(null);
  const shardContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const user = useSelector(selectUser);

  const [show, setShow] = useState(false);
  const [hidepassword, setHidepassword] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ---------- Reusable shake ----------
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

  // ---------- Redirect on success ----------
  useEffect(() => {
    if (user) {
      toast.success(`Welcome back, ${user.name}!`);
      const role = user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "vendor") navigate("/vendor");
      else if (role === "delivery") navigate("/delivery");
      else navigate("/");
    }
  }, [user, navigate]);

  // ---------- Redux error effect ----------
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

    try {
      const result = await dispatch(
        loginUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        })
      );

      if (result.meta.requestStatus === "rejected") {
        const msg = result.payload || "Login failed";
        toast.error(msg);
        shakeForm();
      }
      // On fulfilled — the `user` useEffect above handles redirect
    } catch (err) {
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

  const handleVideoEnd = () => {
    setRefresh(false);
  };

  const isLoading = status === "loading" || submitting;

  return (
    <>
      <div className="relative w-full h-screen video-container">
        <div
          ref={shardContainerRef}
          className={`${refresh ? "fixed inset-0 z-50 pointer-events-none flex flex-col" : "hidden"}`}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="shard-item w-full h-[17vh] bg-white border-r border-zinc-200"
              style={{ transform: "translateX(-100%)" }}
            />
          ))}
        </div>

        <video
          autoPlay
          muted
          src={backgroundVideo}
          ref={videoRef}
          onEnded={handleVideoEnd}
          className="bg-video w-full h-screen fixed top-0 left-0 z-0 overflow-hidden object-cover"
          width={100}
          height={100}
        ></video>

        <div
          className={`${
            show ? "flex" : "hidden"
          } items-center justify-center h-screen px-4`}
          ref={containerform}
        >
          <div className="pop">
            <div className=" pop-inner bg-white/10 backdrop-blur-xl p-8 rounded-4xl border-4 border-black funky-shadow w-full max-w-md animate-[wiggle_3s_ease-in-out_infinite]">
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
                    aria-label={
                      hidepassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                  >
                    {hidepassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-600 border-4 border-black py-4 rounded-2xl font-black text-xl hover:bg-yellow-400 hover:text-black transition-all active:scale-95 uppercase disabled:opacity-50"
                >
                  {isLoading ? "Igniting..." : "Ignition →"}
                </button>

                <div>
                  <p className="text-black font-bold text-center">
                    don't have an account?{" "}
                    <span
                      className="text-blue-600 cursor-pointer"
                      onClick={() => navigate("/vibe/register")}
                    >
                      Register
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

export default UserLogin;