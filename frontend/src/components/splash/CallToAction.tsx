/**
 * CallToAction Component (Responsive)
 * Responsive buttons for sign-up and sign-in with animated hover interactions
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="text-center py-16 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
    >
      <h3 className="text-lg sm:text-xl mb-6">Ready to get started?</h3>
      <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
        {/* Sign Up */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-indigo-900 font-bold px-6 py-3 rounded-xl shadow hover:bg-gray-200 transition text-sm sm:text-base"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </motion.button>

        {/* Sign In */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="border border-white px-6 py-3 rounded-xl text-white hover:bg-white/10 transition text-sm sm:text-base"
          onClick={() => navigate("/signin")}
        >
          Sign In
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CallToAction;
