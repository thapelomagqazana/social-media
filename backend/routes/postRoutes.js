/**
 * @fileoverview Post Routes
 * @module routes/postRoutes
 * @description Defines routes for post-related operations.
 */

import express from "express";
import { createPost } from "../controllers/postController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/posts
 * @description Creates a new post.
 * @access Private (Requires authentication)
 */
router.post("/", protect, createPost);

export default router;
