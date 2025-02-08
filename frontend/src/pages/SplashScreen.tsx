import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typography } from "@mui/material";

const SplashScreen = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("neoSocialUser");
    if (storedUser) {
      setUsername(JSON.parse(storedUser).name);
    }

    // Start fade-out animation before unmounting
    setTimeout(() => {
      setFadeOut(true);
    }, 2500);
  }, []);

  return (
    <motion.div
      className={`h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary text-text transition-opacity ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Branding */}
      <motion.h1
        className="text-4xl md:text-5xl font-bold glitch-effect text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
      >
        🚀 NEO SOCIAL
      </motion.h1>

      {/* Personalized Welcome Message */}
      <Typography
        variant="h6"
        className="mt-4 text-center text-text"
        component={motion.p}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        {username ? `Welcome back, ${username}!` : "Connecting you with the world in a futuristic way!"}
      </Typography>

      {/* Loading Animation */}
      <motion.div
        className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mt-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
};

export default SplashScreen;
