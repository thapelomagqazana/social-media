import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../styles/SplashScreen.css"; // Optimized Tailwind & Glassmorphism styles

/**
 * **Optimized Splash Screen**
 * - **Futuristic UI**: Glassmorphism, glitch effects, animated particles.
 * - **High-performance animations** using **GPU acceleration**.
 * - **Minimizes unnecessary re-renders** for better UX.
 */
const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const username = useMemo(() => {
    const storedUser = localStorage.getItem("neoSocialUser");
    return storedUser ? JSON.parse(storedUser).name : null;
  }, []);

  // Memoized Welcome Message (avoids recalculations)
  const welcomeMessage = useMemo(
    () => (username ? `Welcome back, ${username}!` : "Connecting you with the world in a futuristic way!"),
    [username]
  );

  // Handles fade-out and navigation efficiently
  const handleFadeOut = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      navigate(username ? "/dashboard" : "/signin");
    }, 500); // Smooth transition after fade-out
  }, [navigate, username]);

  useEffect(() => {
    const timer = setTimeout(handleFadeOut, 2500);
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [handleFadeOut]);

  return (
    <motion.div
      className={`splash-screen ${fadeOut ? "opacity-0" : "opacity-100"}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Massive Glitch Branding */}
      <motion.h1
        className="glitch-text text-center tracking-wide"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        🚀 NEO SOCIAL
      </motion.h1>

      {/* Large Welcome Message */}
      <Typography
        variant="h6"
        className="splash-message"
        component={motion.p}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        {welcomeMessage}
      </Typography>

      {/* Extra Large Animated Loading Spinner */}
      <motion.div
        className="loading-spinner"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Floating Animated Particles */}
      <div className="particle-container">
        <motion.div
          className="particle bg-[#bb86fc]"
          animate={{ y: [0, -200, 200, 0], x: [0, 100, -100, 0] }}
          transition={{ repeat: Infinity, duration: 5 }}
          style={{ top: "20%", left: "10%" }}
        />
        <motion.div
          className="particle bg-[#00ff7f]"
          animate={{ y: [-150, 150, -150], x: [200, -200, 200] }}
          transition={{ repeat: Infinity, duration: 6 }}
          style={{ top: "80%", left: "90%" }}
        />
      </div>
    </motion.div>
  );
};

export default SplashScreen;
