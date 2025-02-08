import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typography } from "@mui/material";
import "../styles/SplashScreen.css"; // Import CSS file

/**
 * 📌 Splash Screen Component
 * - Displays a branding screen before navigating to the main app.
 * - Features a **massive branding title**, glitch animation, fade-out effect, and a **large loading spinner**.
 * - Fully **centered on the screen** with **bigger UI elements**.
 * - Optimized for **smartphone, tablet, and desktop views**.
 */
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
      className={`splash-screen ${fadeOut ? "opacity-0" : "opacity-100"}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 🚀 Huge Glitch Branding */}
      <motion.h1
        className="glitch-text text-center tracking-wide"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        🚀 NEO SOCIAL
      </motion.h1>

      {/* 📝 Large Welcome Message */}
      <Typography
        variant="h6"
        className="splash-message"
        component={motion.p}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        {username ? `Welcome back, ${username}!` : "Connecting you with the world in a futuristic way!"}
      </Typography>

      {/* 🔄 Extra Large Loading Spinner */}
      <motion.div
        className="loading-spinner"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* ✨ Bigger Particle Effect (Optional) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
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
