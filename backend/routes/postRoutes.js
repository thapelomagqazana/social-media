/**
 * @fileoverview Post Routes
 * @module routes/postRoutes
 * @description Defines routes for post-related operations.
 */

import express from "express";
import { 
    createPost,
    getPosts,
    getPostById
 } from "../controllers/postController.js";
import { protect, validateQueryParams } from "../middleware/authMiddleware.js";
import { postRateLimiter } from "../middleware/rateLimiter.js";
import upload from "../config/multer.js";

const router = express.Router();

/**
 * @route POST /api/posts
 * @description Creates a new post.
 * @access Private (Requires authentication)
 */
router.post("/", protect, postRateLimiter, upload.single("media"), createPost);

/**
 * @route GET /api/posts
 * @description Get all posts.
 * @access Private (Requires authentication)
 */
router.get("/", protect, validateQueryParams, getPosts);

/**
 * @route GET /api/posts/:postId
 * @description Get post by id.
 * @access Private (Requires authentication)
 */
router.get("/:postId", protect, getPostById);


export default router;
