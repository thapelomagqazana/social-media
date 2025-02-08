/**
 * @fileoverview Authentication Routes
 * @module routes/authRoutes
 * @description Defines API endpoints for user authentication (sign-up, sign-in, and sign-out).
 */

import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Check if running in test mode
const isTestEnv = process.env.NODE_ENV === "test";

// Rate limiting middleware (Tracks by IP)
const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isTestEnv ? 20 : 5, // Higher limit in tests
  standardHeaders: true, // Return rate limit headers
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Tracks failed attempts by IP
  handler: (req, res) => {
    return res.status(429).json({ message: "Too many login attempts. Please try again later." });
  },
});

/**
 * @route POST /auth/signup
 * @description Registers a new user.
 * @access Public
 */
router.post("/signup", registerUser);

/**
 * @route POST /auth/signin
 * @description Authenticates a user and sets JWT in cookies.
 * @access Public
 */
router.post("/signin", loginRateLimiter, loginUser);

/**
 * @route GET /auth/signout
 * @description Logs out the user by clearing the JWT cookie.
 * @access Public
 */
router.get("/signout", logoutUser);

export default router;
