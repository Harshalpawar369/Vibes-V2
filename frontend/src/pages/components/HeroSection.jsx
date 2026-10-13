import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
// import { useNavigate } from "react-router-dom";

function HeroSection() {
  // const navigate = useNavigate();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const pupilX = useSpring(mouseX, springConfig);
  const pupilY = useSpring(mouseY, springConfig);

  const x = useTransform(
    pupilX,
    (val) => (val / window.innerWidth - 0.5) * -16,
  );
  const y = useTransform(
    pupilY,
    (val) => (val / window.innerHeight - 0.5) * -16,
  );

  const handleMouseMove = (e) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  return (
    <div className="w-full overflow-x-hidden">
       <div className="w-full flex flex-wrap items-center justify-between overflow-x-hidden">
        <div className="w-full md:w-1/2">
        <div
          role="heading"
          aria-level="1"
          className="pt-[15vh] text-[7vw] font-extrabold ml-[2.5vw] m-5"
        >
          {["MAIN", "AUTHENTIC", "CHARACTER", "ENERGY."].map((item, index) =>
            index === 1 ? (
              <motion.span
                key={item}
                animate={{
                  backgroundColor: "#e32b86",
                  rotate: 20,
                  transition: { duration: 1.3, delay: 0.5 },
                }}
                className={`block w-fit bg-pink-600 font-["Arial"] text-[4vw] border-3 border-zinc-800 text-white font-bold`}
              >
                {item}
              </motion.span>
            ) : (
              <motion.span
                key={item}
                className={`block font-[poppins] leading-[6vw] ${index === 2 ? "text-sky-400" : ""}`}
              >
                {item}
              </motion.span>
            ),
          )}
        </div>

          <div className="w-1/2 font-extralight text-[1.5vmax]  mt-[2vmin] leading-[4vmin] ">
            <p className="w-full">
              Stop scrolling. Start serving. The only fit you need for the
              digital age.
            </p>
          </div>
          <div className="w-1/2 font-bold font-[poppins] text-[1.3vmax] m-3">
            <motion.button
              // onClick={() => navigate("/shop")}
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
              className="bg-emerald-400  border-4 border-black p-2 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Shop Now
            </motion.button>
          </div>
        </div>
        <div
          onMouseMove={handleMouseMove}
          className="w-full md:w-1/2 relative flex justify-center items-center z-0 overflow-hidden bg-white"
        >
          <img
            src="/images/eye-960.webp"
            alt="Main Visual of the eye"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            width={951}
            height={524}
            srcSet="/images/eye-640.webp 640w, /images/eye-960.webp 960w"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="block w-full max-w-full h-auto object-cover z-0"
          />

          <div className="absolute left-83 top-[45.5%] z-10 hidden w-[28%] -translate-x-1/2 -translate-y-1/2 rotate-165 items-center gap-10 pointer-events-none sm:flex md:flex">
            <motion.div
              style={{ x, y }}
              className="relative bg-zinc-900 rounded-full p-2"
            ></motion.div>
            <motion.div
              style={{ x, y }}
              className="bg-zinc-900 rounded-full relative p-2"
            ></motion.div>
          </div>
        </div>
      </div>
        
     
    </div>

    
  )
}

export default HeroSection;
