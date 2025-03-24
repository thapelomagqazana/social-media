/**
 * @fileoverview Authentication Routes
 * @module routes/authRoutes
 * @description Defines API endpoints for user authentication (sign-up, sign-in, and sign-out).
 */

import express from "express";
import { signinRateLimiter } from '../middleware/rateLimiter.js';
import { signup, signin, signout } from "../controllers/authController";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signinRateLimiter, signin);
router.get("/signout", signout);

export default router;
