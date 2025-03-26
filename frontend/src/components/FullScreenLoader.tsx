/**
 * FullScreenLoader Component
 * Displays a full-screen loading splash with the app logo
 */

import { motion } from "framer-motion";

const FullScreenLoader = () => {
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.img
        src="/logo.png" // Place your logo in /public or assets
        alt={import.meta.env.VITE_APP_NAME}
        className="w-24 h-24"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      />
    </motion.div>
  );
};

export default FullScreenLoader;
