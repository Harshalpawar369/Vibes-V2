import { Link } from 'react-router-dom';
import { GrInstagram } from "react-icons/gr";
import { FaUserCircle } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { motion } from 'framer-motion';

const Footer = () => {
    return (
        <>
        <footer className="bg-black text-white p-8 lg:p-20 border-t-4 border-black overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-6xl font-black mb-8 font-['Syne'] uppercase">VIBE CHECK.</h2>
            <p className="text-2xl text-[#ccff00] font-bold mb-8 italic">DON'T MISS THE DROP.</p>
            <div className="flex border-4 border-[#ccff00] rounded-full overflow-hidden max-w-md bg-white/5">
             
            </div>
          </div>
          <div>
  <h2 className="font-black text-xl mb-6 text-[#ff007a] uppercase">Guides</h2>
  <ul className="space-y-4 font-bold text-gray-400">
    {[
      { label: 'Shipping?', path: '/shipping' },
      { label: 'Who are we', path: '/about' },
      { label: 'Careers', path: '/careers' }
    ].map((link) => (
      <li key={link.label}>
        <Link 
          to={link.path} 
          className="hover:text-white transition uppercase"
        >
          {link.label}
        </Link>
      </li>
    ))}
  </ul>
</div>
          <div>
            <h2 className="font-black text-xl mb-6 text-[#8b5cf6] uppercase">Socials</h2>
            <div className="flex gap-6">
              {[GrInstagram, FaGithub, FaUserCircle].map((Icon, i) => (
                <motion.a 
                  key={i}
                  whileHover={{ y: -5, color: "#ccff00" }}
                  href="#" 
                  aria-label={`Visit our ${Icon.name.replace('Fa', '').replace('Gr', '')} page`}
                  className="text-3xl transition-colors"

                >
                  <Icon size={32} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t-2 border-white/20 text-center font-bold text-gray-500 italic uppercase tracking-widest">
          Keep it real. © 2026 VIBE CHECK. Made for the grid.
        </div>
      </footer>
        </>
    );
};

export default Footer;