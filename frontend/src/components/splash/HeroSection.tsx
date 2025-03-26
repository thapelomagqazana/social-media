/**
 * HeroSection Component (Responsive)
 * Displays app name and tagline with mobile-first scaling
 */

import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <motion.div
      className="text-center py-20 px-6 sm:py-24 md:py-28 lg:py-32"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-tight">
        {import.meta.env.VITE_APP_NAME}
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-xl mx-auto">
        Connect. Share. Engage. Experience the sleekest way to stay social.
      </p>
    </motion.div>
  );
};

export default HeroSection;
