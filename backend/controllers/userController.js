/**
 * @fileoverview User Controller
 * @description Controller methods for fetching user-specific posts, liked posts, media posts,
 * followers, following, and user statistics.
 */

const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Follow = require("../models/Follow");

/**
 * @desc    Get posts created by a specific user
 * @route   GET /api/users/:userId/posts?page=1&limit=10
 * @access  Private
 */
exports.getUserPosts = async (req, res) => {
  const { userId } = req.params;
  let page = parseInt(req.query.page || "1");
  page = isNaN(page) || page < 1 ? 1 : page;

  let limit = parseInt(req.query.limit || "10");
  limit = isNaN(limit) || limit < 1 ? 10 : limit;

  if (isNaN(page) || page < 1 || !Number.isInteger(page)) {
    return res.status(400).json({ message: 'Invalid page parameter' });
  }
  if (isNaN(limit) || limit < 1 || !Number.isInteger(limit)) {
    return res.status(400).json({ message: 'Invalid limit parameter' });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name profile.username profile.profilePicture");

    const total = await Post.countDocuments({ user: userId });

    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};

/**
 * @desc    Get posts liked by a specific user
 * @route   GET /api/users/:userId/liked-posts
 * @access  Private
 */
exports.getLikedPostsByUser = async (req, res) => {
    const { userId } = req.params;
  
    let page = parseInt(req.query.page);
    page = isNaN(page) || page < 1 ? 1 : page;
  
    let limit = parseInt(req.query.limit);
    limit = isNaN(limit) || limit < 0 ? 10 : limit;
  
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
  
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    if (limit === 0) {
      return res.status(200).json({
        posts: [],
        totalPosts: 0,
        page,
        totalPages: 0,
      });
    }
  
    try {
      const total = await Post.countDocuments({ likes: userId });
  
      const posts = await Post.find({ likes: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name profile.username profile.profilePicture");
  
      res.status(200).json({
        posts,
        totalPosts: total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch liked posts", error: err.message });
    }
};
  

/**
 * @desc    Get media posts (with images) created by a specific user
 * @route   GET /api/users/:userId/media-posts
 * @access  Private
 */
exports.getMediaPostsByUser = async (req, res) => {
    const { userId } = req.params;
  
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
  
    // Parse and sanitize pagination
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
  
    // Fallback if query injection or invalid values
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 0) limit = 10;

    if (limit === 0) {
        return res.status(200).json({
          posts: [],
          total: 0,
          page,
          totalPages: 0,
        });
    }
  
    try {
      // Check if user exists
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const filter = {
        user: userId,
        image: { $type: "string", $nin: ["", null, " "] }, // Only valid image strings
      };
  
      const total = await Post.countDocuments(filter);
  
      const posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name profile.username profile.profilePicture");
  
      return res.status(200).json({
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Failed to fetch media posts", error: err.message });
    }
};
  

/**
 * @desc    Get all followers of a specific user
 * @route   GET /api/users/:userId/followers
 * @access  Private
 */
exports.getUserFollowers = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const followers = await Follow.find({ following: userId }).populate(
      "follower",
      "name profile.username profile.profilePicture"
    );

    res.json(followers.map((f) => f.follower));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch followers", error: err.message });
  }
};

/**
 * @desc    Get users that a specific user is following
 * @route   GET /api/users/:userId/following
 * @access  Private
 */
exports.getUserFollowing = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const following = await Follow.find({ follower: userId }).populate(
      "following",
      "name profile.username profile.profilePicture"
    );

    res.json(following.map((f) => f.following));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch following", error: err.message });
  }
};

/**
 * @desc    Get stats: number of posts, followers, following
 * @route   GET /api/users/:userId/stats
 * @access  Private
 */
exports.getUserStats = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const [postCount, followersCount, followingCount] = await Promise.all([
      Post.countDocuments({ user: userId }),
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.json({ postCount, followersCount, followingCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
};
