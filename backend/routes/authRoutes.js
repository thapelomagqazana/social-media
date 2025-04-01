/**
 * @fileoverview Authentication Routes
 * @module routes/authRoutes
 * @description Defines API endpoints for user authentication (sign-up, sign-in, and sign-out).
 */

const express = require("express");
const { signinRateLimiter } = require("../middleware/rateLimiter.js");
const { protect } = require("../middleware/authMiddleware.js");
const {
  signup,
  signin,
  signout,
  getMe,
} = require("../controllers/authController.js");

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signinRateLimiter, signin);
router.get("/me", protect, getMe);
router.get("/signout", signout);

module.exports = router;
