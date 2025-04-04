/**
 * @fileoverview Routes for user-specific profile features
 * @module routes/userRoutes
 */

const express = require("express");
const router = express.Router();
const {
  getUserPosts,
  getLikedPostsByUser,
  getMediaPostsByUser,
  getUserFollowers,
  getUserFollowing,
  getUserStats,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware.js");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User-specific profile and interaction features
 */

/**
 * @swagger
 * /api/users/{userId}/posts:
 *   get:
 *     summary: Get posts created by a user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: List of user's posts with pagination info
 *       401:
 *         description: Unauthorized
 */
router.get("/:userId/posts", protect, getUserPosts);

/**
 * @swagger
 * /api/users/{userId}/liked-posts:
 *   get:
 *     summary: Get posts liked by a user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of liked posts
 *       401:
 *         description: Unauthorized
 */
router.get("/:userId/liked-posts", protect, getLikedPostsByUser);

/**
 * @swagger
 * /api/users/{userId}/media-posts:
 *   get:
 *     summary: Get user's media-only posts
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of media posts
 *       401:
 *         description: Unauthorized
 */
router.get("/:userId/media-posts", protect, getMediaPostsByUser);

/**
 * @swagger
 * /api/users/{userId}/followers:
 *   get:
 *     summary: Get list of followers for a user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of followers with metadata
 *       401:
 *         description: Unauthorized
 */
router.get("/:userId/followers", protect, getUserFollowers);

/**
 * @swagger
 * /api/users/{userId}/following:
 *   get:
 *     summary: Get list of users a user is following
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of followed users
 *       401:
 *         description: Unauthorized
 */
router.get("/:userId/following", protect, getUserFollowing);

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     summary: Get user statistics (post, follower, and following counts)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/:userId/stats", protect, getUserStats);

module.exports = router;

