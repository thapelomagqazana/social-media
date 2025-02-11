import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Typography } from "@mui/material";
import "../styles/SplashScreen.css"; // Import optimized CSS

/**
 * Optimized Splash Screen
 * - Shows a branding screen before navigating to the main app.
 * - Features **massive branding title, glitch effect, fade-out animation, and large spinner**.
 * - **Optimized for high performance** using **GPU-accelerated animations**.
 */
const SplashScreen: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("neoSocialUser");
    if (storedUser) {
      setUsername(JSON.parse(storedUser).name);
    }

    // Trigger fade-out animation before unmounting
    setTimeout(() => setFadeOut(true), 2500);
  }, []);

  // Memoized username greeting (prevents unnecessary recalculations)
  const welcomeMessage = useMemo(
    () =>
      username
        ? `Welcome back, ${username}!`
        : "Connecting you with the world in a futuristic way!",
    [username]
  );

  return (
    <motion.div
      className={`splash-screen ${fadeOut ? "opacity-0" : "opacity-100"}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Massive Branding Title */}
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

      {/* Extra Large Loading Spinner */}
      <div className="loading-spinner" />

      {/* Floating Particles for Visual Effect */}
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
