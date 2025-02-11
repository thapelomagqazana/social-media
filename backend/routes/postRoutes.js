/**
 * @fileoverview Post Routes
 * @module routes/postRoutes
 * @description Defines routes for post-related operations.
 */

import express from "express";
import { 
    createPost,
    getPosts,
    getPostById,
    deletePost,
    likePost,
    unlikePost,
    getPostsByHashtag
 } from "../controllers/postController.js";
import {
    addComment,
    deleteComment,
    getTrendingPosts
} from "../controllers/commentController.js";
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

/**
 * @route DELETE /api/posts/:postId
 * @description Soft delete post by id.
 * @access Private (Requires authentication)
 */
router.delete("/:postId", protect, deletePost);

/**
 * @route POST /api/posts/:postId/like
 * @description Like the post.
 * @access Private (Requires authentication)
 */
router.post("/:postId/like", protect, likePost);

/**
 * @route POST /api/posts/:postId/unlike
 * @description Unlike the post.
 * @access Private (Requires authentication)
 */
router.post("/:postId/unlike", protect, unlikePost);

/**
 * @route   POST /api/posts/:postId/comment
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post("/:postId/comment", protect, addComment);

/**
 * @route   DELETE /api/posts/:postId/comment/:commentId
 * @desc    Soft delete a comment
 * @access  Private
 */
router.delete("/:postId/comment/:commentId", protect, deleteComment);

/**
 * @route   GET /api/posts/trending
 * @desc    Get trending posts with engagements
 * @access  Public
 */
router.get("/trending", protect, validateQueryParams, getTrendingPosts);

/**
 * @route GET /api/posts/hashtag/:tag
 * @description Fetch all posts containing a specific hashtag.
 * @access Public
 */
router.get("/hashtag/:tag", getPostsByHashtag);


export default router;
