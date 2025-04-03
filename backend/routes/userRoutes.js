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

router.get("/:userId/posts", protect, getUserPosts);
router.get("/:userId/liked-posts", protect, getLikedPostsByUser);
router.get("/:userId/media-posts", protect, getMediaPostsByUser);
router.get("/:userId/followers", protect, getUserFollowers);
router.get("/:userId/following", protect, getUserFollowing);
router.get("/:userId/stats", protect, getUserStats);

module.exports = router;
