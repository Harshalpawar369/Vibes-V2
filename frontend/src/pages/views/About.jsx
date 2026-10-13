import React from 'react';
import Footer from "../components/Footer.jsx";
import cool from "/images/cool.webp";
import SEO from '../components/SEO.jsx';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function About() {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="About Us | Vibes" 
        description="Vibes is the ultimate Gen Z fashion playground. Where Y2K nostalgia meets streetwear edge."
        canonical="https://vibes-ecommerce-website.vercel.app/about"
      />
      <div className='w-full min-h-screen bg-white font-[poppins] flex flex-col justify-between overflow-x-hidden'>
        
        {/* Main Content Container */}
        <div className='flex flex-col-reverse lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full px-6 md:px-12 lg:px-20 pt-[18vh] pb-16 mb-auto'>
          
          {/* ================= TEXT SECTION ================= */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className='w-full lg:w-1/2 flex flex-col gap-6'
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter text-zinc-950">
              The Vibe Story
            </h1>
            
            <p className="font-semibold text-lg md:text-xl leading-relaxed text-justify text-zinc-900">
              Vibes is the ultimate Gen Z fashion playground—a high-key,
              community-first platform where Y2K nostalgia meets streetwear edge.
              Moving beyond basic fast fashion, it champions circular commerce
              and ethical thrifting for a generation that demands authenticity and
              sustainability.
            </p>

            {/* Highlighted Callout Box */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-emerald-400 p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <p className="font-bold text-md md:text-lg text-black">
                <span className="font-black uppercase text-xl block mb-1">No Cap, Just Style.</span> 
                A feed curated by AI-driven aesthetics, tailored to your specific core: Cottagecore, Gorpcore, or Cyber-Y2K.
              </p>
            </motion.div>

            <p className="font-semibold text-lg md:text-xl leading-relaxed text-justify text-zinc-900 mt-2">
              <span className="font-black bg-yellow-300 px-2 py-0.5 border-2 border-black mr-2 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Main Character Energy
              </span>
              Built for resale and remixing, allowing you to flip pre-loved grails and keep the circular economy thriving. The Ultimate Flex: Unlike legacy apps, this platform is a vibe check for your closet connecting you with underground creators and eco-conscious sellers who actually get it.
            </p>

            {/* Interactive Call to Action */}
            <motion.button 
              whileHover={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop')}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-fit mt-4 bg-black text-white border-4 border-black px-8 py-4 text-lg font-black uppercase shadow-[6px_6px_0px_0px_rgba(16,185,129,1)] hover:bg-zinc-800 transition-colors"
            >
              Check the Vibe →
            </motion.button>
          </motion.div>

          {/* ================= IMAGE SECTION ================= */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className='w-full lg:w-1/2 flex justify-center items-center'
          >
            <motion.img 
              whileHover={{ rotate: 3, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
              src={cool} 
              alt="Vibes Fashion Style" 
              fetchPriority='high' 
              className='w-full max-w-sm md:max-w-md lg:max-w-lg rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] object-cover bg-yellow-300' 
            />
          </motion.div>

        </div>
        
        <Footer />
      </div>
    </>
  );
}

export default About;