/**
 * @fileoverview Post Routes
 * @module routes/postRoutes
 * @description Defines API endpoints for creating, deleting, liking, commenting, and retrieving posts.
 */

const express = require("express");
const { protect, checkBanned } = require("../middleware/authMiddleware.js");
const { upload } = require("../middleware/uploadMiddleware.js");
const {
  createPost,
  deletePost,
  toggleLikePost,
  commentOnPost,
  getNewsfeed,
} = require("../controllers/postController.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management and interactions
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post (with optional image)
 *     tags: [Posts]
 *     consumes:
 *       - multipart/form-data
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", protect, checkBanned, upload.single("image"), createPost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted
 *       400:
 *         description: Invalid post ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.delete("/:postId", protect, checkBanned, deletePost);

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   put:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like toggled
 *       400:
 *         description: Invalid post ID
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.put("/:postId/like", protect, checkBanned, toggleLikePost);

/**
 * @swagger
 * /api/posts/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post("/:postId/comment", protect, checkBanned, commentOnPost);

/**
 * @swagger
 * /api/posts/newsfeed:
 *   get:
 *     summary: Get newsfeed for the authenticated user
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of posts
 *       500:
 *         description: Server error
 */
router.get("/newsfeed", protect, checkBanned, getNewsfeed);

module.exports = router;
