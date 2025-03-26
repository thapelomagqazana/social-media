/**
 * FeatureHighlights Component (Responsive)
 * Staggered animation of key app benefits, with responsive spacing
 */

import { motion } from "framer-motion";

const features: string[] = [
  "🧭 Explore a clean, content-first feed",
  "💬 Real-time likes, comments, and notifications",
  "🌙 Beautiful light and dark modes",
  "🎨 Smooth animations and transitions",
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.25 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const FeatureHighlights = () => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6">
        
        <motion.div
            className="flex flex-col items-center justify-center px-4 py-12 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <h2 className="text-xl sm:text-2xl font-semibold text-center">
                Why join {import.meta.env.VITE_APP_NAME}?
            </h2>
            <ul className="w-full max-w-2xl space-y-4 px-4 sm:px-0">
                {features.map((feat, index) => (
                <motion.li
                    key={index}
                    className="text-sm sm:text-base bg-white/10 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm text-white"
                    variants={itemVariants}
                >
                    {feat}
                </motion.li>
                ))}
            </ul>
        </motion.div>
    </div>

  );
};

export default FeatureHighlights;
