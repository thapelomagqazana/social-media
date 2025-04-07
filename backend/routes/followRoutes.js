/**
 * @fileoverview Follow Routes
 * @module routes/followRoutes
 * @description Defines API endpoints for following/unfollowing users and follow suggestions.
 */

const express = require("express");
const {
  followUser,
  unfollowUser,
  whoToFollow,
  isFollowingUser,
} = require("../controllers/followController.js");
const { protect, checkBanned } = require("../middleware/authMiddleware.js");
const { rateLimiter } = require("../middleware/rateLimiter.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Follow
 *   description: Follow/unfollow users and suggestions
 */

/**
 * @swagger
 * /api/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Follow]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to follow
 *     responses:
 *       200:
 *         description: Followed user
 *       400:
 *         description: Bad request (e.g. trying to follow self)
 *       403:
 *         description: Banned user
 *       500:
 *         description: Server error
 */
router.post("/:userId", protect, checkBanned, followUser);

/**
 * @swagger
 * /api/follow/{userId}:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Follow]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Unfollowed user or already not following
 *       400:
 *         description: Bad request (e.g. trying to unfollow self)
 *       403:
 *         description: Banned user
 *       500:
 *         description: Server error
 */
router.delete("/:userId", protect, checkBanned, unfollowUser);

/**
 * @swagger
 * /api/follow/suggestions:
 *   get:
 *     summary: Get suggested users to follow
 *     tags: [Follow]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of suggested users
 *       403:
 *         description: Banned user
 *       500:
 *         description: Server error
 */
router.get("/suggestions", protect, checkBanned, whoToFollow);

/**
 * @swagger
 * /api/follow/{userId}:
 *   get:
 *     summary: Check if the current user is following another user
 *     tags: [Follow]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to check follow status
 *     responses:
 *       200:
 *         description: Follow status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 following:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid user ID
 *       403:
 *         description: Banned user
 *       500:
 *         description: Server error
 */
router.get("/:userId", protect, checkBanned, rateLimiter, isFollowingUser);

module.exports = router;
