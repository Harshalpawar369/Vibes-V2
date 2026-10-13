import { useMemo, useEffect } from "react"; // Added useEffect
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux"; // Added useDispatch
import Footer from "../components/Footer.jsx";
import HeroSection from "../components/HeroSection.jsx";
import SEO from '../components/SEO.jsx';
import { useNavigate } from "react-router-dom";

// Added missing import to fetch products
import { fetchProducts } from "../../redux/features/productSlice"; 

function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialized dispatch
  
  const { items, status } = useSelector((state) => state.products);

  // Added missing useEffect to fetch products when the home page loads
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  const accessories = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items
      // FIXED: Changed itemCategory to category to match Product schema
      .filter((item) => item.category?.toLowerCase() === "clothing")
      .slice(0, 4);
  }, [items]);

  const getOptimizedUrl = (url) => {
    if (!url || !url.includes("ik.imagekit.io")) return url;
    return url.replace(
      "zawzssuyis/",
      "zawzssuyis/tr:w-400,q-60,f-auto/"
    );
  };

  return (
    <>
    <SEO
      title="E-commerce"
      description="Welcome to Vibes E-commerce Website, your ultimate destination for a diverse range of products. Explore our curated collection and enjoy a seamless shopping experience."
      canonical="https://vibes-ecommerce-website.vercel.app/"
    />
    
    <main className="w-full h-screen bg-white text-zinc-900 overflow-x-hidden">
      <HeroSection />
      <div className="w-full flex flex-col md:flex-row items-center justify-between bg-amber-400 p-8 gap-10 overflow-hidden">
        <div className="w-full md:w-1/2 space-y-4 font-[poppins]">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-zinc-900">
            Hi, We are the Vibe
          </h2>
          <p className="text-lg font-bold leading-tight text-zinc-800 text-justify">
            Welcome to the <span className="text-white italic">Vibe</span> of
            Gen-Z fashion. We blend Luminous style with the raw Rhythm of the
            underground, creating a Fusion of accessories that hit different.
            This is the Vibe Check—consider yourself verified.Fuel your
            aesthetic with the ultimate Ignition of street-style and high-speed
            Velocity. Vibe Check isn't just a shop it's a Cinematic movement
            designed for those who live life at full Throttle. We navigate the
            city Circuit with Kinetic energy, turning every Dispatch into a
            major moment. From Vivid accessories to the core pieces that define
            your Aura, we are the Catalyst for your next viral fit. Join the
            Unity, catch the Surge, and stay locked into the Pulse of the
            streets.
          </p>
          <motion.button
            onClick={() => navigate("/about")}
            whileHover={{
              x: 4,
              y: 4,
              boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
            }}
            whileTap={{
              scale: 0.9,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            type="button"
            className="bg-emerald-400 font-bold font-[poppins] border-4 p-2 border-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[1.3vmax]"
          >
            Know More →
          </motion.button>
        </div>

        <div className="w-full md:w-1/2">
          <motion.img
            whileHover={{
              scale: 1.05,
              rotate: -2,
            }}
            src="/images/yellowLady.webp"
            loading="lazy"
            decoding="async"
            alt="fashionate"
            width="715"
            height="990"
            className="block w-full max-w-full h-auto object-cover grayscale hover:grayscale-0 transition duration-700 rounded-3xl border-4 border-black funky-shadow"
          />
        </div>
      </div>

      {status === "loading" ? (
        <div className="h-64" aria-hidden="true"></div>
      ) : (
        <div className="bg-white w-full py-10">
          <div className="w-full  bg-white text-zinc-950 -mt-10 mb-10 rounded-lg">
            <div className="py-10 border-t-2 border-b-2 border-white text-center flex whitespace-nowrap overflow-hidden -mb-5 pt-5 ">
              <motion.h2
                initial={{ x: 0 }}
                animate={{ x: "-100%" }}
                transition={{ ease: "linear", repeat: Infinity, duration: 10 }}
                className="font-bold text-[8vmax] leading-none"
              >
                Match Your Vibe!
              </motion.h2>
              <motion.h2
                initial={{ x: 0 }}
                animate={{ x: "-100%" }}
                transition={{ ease: "linear", repeat: Infinity, duration: 10 }}
                className="font-bold text-[8vmax] leading-none"
              >
                Match Your Vibe!
              </motion.h2>
              <motion.h2
                initial={{ x: 0 }}
                animate={{ x: "-100%" }}
                transition={{ ease: "linear", repeat: Infinity, duration: 10 }}
                className="font-bold text-[8vmax] leading-none"
              >
                Match Your Vibe!
              </motion.h2>
            </div>
          </div>

          <div className="w-full mx-auto px-4 mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 bg-white">
            {accessories && accessories.length > 0 ? (
              accessories.map((item) => (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -10 }}
                  className="bg-white border-4 border-black p-4 rounded-2xl funky-shadow"
                >
                  <div className="w-full h-64 overflow-hidden rounded-xl border-2 border-black bg-zinc-100 mb-4">
                    {/* FIXED: Target the first image URL in the images array */}
                    <img
                      src={getOptimizedUrl(item.images?.[0]?.url)}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="400"
                      className="w-full h-full object-cover background-yellow-300"
                    />
                  </div>
                  <div className="space-y-2">
                    {/* FIXED: Changed brandName to name */}
                    <h3 className="font-black text-xl uppercase italic">
                      {item.name}
                    </h3>
                    <p className="text-3xl font-black ">${item.price}</p>
                    <motion.button
                      onClick={() => navigate("/shop")}
                      whileHover={{
                        x: 4,
                        y: 4,
                        boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
                      }}
                      whileTap={{
                        scale: 0.9,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      className="w-full bg-emerald-400  border-4 border-black  uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]  py-2 text-md font-extrabold"
                    >
                      Buy
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="col-span-full text-center text-xl font-bold">
                No items available yet
              </p>
            )}
          </div>
        </div>
      )}
      <Footer />
    </main>
    </>
  );
}

export default Home;