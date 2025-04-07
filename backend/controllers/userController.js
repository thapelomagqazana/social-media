/**
 * @fileoverview User Controller
 * @description Controller methods for fetching user-specific posts, liked posts, media posts,
 * followers, following, and user statistics.
 */

const mongoose = require("mongoose");
const Like = require("../models/Like");
const Post = require("../models/Post");
const User = require("../models/User");
const Profile = require("../models/Profile");
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
  
    if (!Number.isInteger(page)) {
      return res.status(400).json({ message: "Invalid page parameter" });
    }
    if (!Number.isInteger(limit)) {
      return res.status(400).json({ message: "Invalid limit parameter" });
    }
  
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const posts = await Post.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
  
      const total = await Post.countDocuments({ user: userId });
  
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const profile = await Profile.findOne({ user: post.user }).select("username profilePicture");
          return {
            ...post.toObject(),
            user: {
              _id: user._id,
              name: user.name,
              username: profile?.username || null,
              profilePicture: profile?.profilePicture || null,
            },
          };
        })
      );
  
      res.status(200).json({
        posts: enrichedPosts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch posts",
        error: err.message,
      });
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
      const total = await Like.countDocuments({ user: userId });
  
      const likeDocs = await Like.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("post");
  
      const posts = likeDocs.map((doc) => doc.post);
  
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const postUser = await User.findById(post.user).select("name email");
          const profile = await Profile.findOne({ user: post.user }).select("username profilePicture");
  
          return {
            ...post.toObject(),
            user: {
              _id: postUser._id,
              name: postUser.name,
              email: postUser.email,
              username: profile?.username || null,
              profilePicture: profile?.profilePicture || null,
            },
          };
        })
      );
  
      res.status(200).json({
        posts: enrichedPosts,
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
  
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 0) limit = 10;
  
    // Handle limit === 0 explicitly
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
  
      // Filter for media posts (image must be valid)
      const filter = {
        user: userId,
        image: { $type: "string", $nin: ["", null, " "] },
      };
  
      const total = await Post.countDocuments(filter);
  
      const posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
  
      // Manually enrich user field with profile data
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const postUser = await User.findById(post.user).select("name email");
          const profile = await Profile.findOne({ user: post.user }).select("username profilePicture");
  
          return {
            ...post.toObject(),
            user: {
              _id: postUser._id,
              name: postUser.name,
              username: profile?.username || null,
              profilePicture: profile?.profilePicture || null,
            },
          };
        })
      );
  
      return res.status(200).json({
        posts: enrichedPosts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch media posts", error: err.message });
    }
};

/**
 * @desc    Get all followers of a specific user
 * @route   GET /api/users/:userId/followers
 * @access  Private
 */
exports.getUserFollowers = async (req, res) => {
    const { userId } = req.params;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
  
    page = page < 1 || isNaN(page) ? 1 : page;
    limit = limit < 1 || isNaN(limit) ? 10 : limit;
  
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
  
    try {
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const totalFollowers = await Follow.countDocuments({ following: userId });
  
      const followers = await Follow.find({ following: userId })
        .populate("follower", "name email") // just from User
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const enrichedFollowers = await Promise.all(
        followers.map(async (f) => {
            const profile = await Profile.findOne({ user: f.follower._id }).select("username profilePicture");
            return {
                ...f.follower.toObject(),
                username: profile?.username || null,
                profilePicture: profile?.profilePicture || null,
            };
        })
      );
  
      res.status(200).json({
        followers: enrichedFollowers,
        page,
        limit,
        totalFollowers,
        totalPages: Math.ceil(totalFollowers / limit),
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to fetch followers", error: err.message });
    }
};

/**
 * @desc    Get users that a specific user is following
 * @route   GET /api/users/:userId/following
 * @access  Private
 */
exports.getUserFollowing = async (req, res) => {
    const { userId } = req.params;
    let limit = parseInt(req.query.limit);
    let page = parseInt(req.query.page);
  
    // Default fallback and validation
    if (isNaN(limit) || limit < 0) limit = 10;
    if (limit === 0) return res.status(200).json({ following: [], total: 0, page: 1, totalPages: 0 });
  
    if (isNaN(page) || page < 1) page = 1;
  
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
  
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }
  
    try {
      // Total followings
      const total = await Follow.countDocuments({ follower: userId });
  
      // Paginated follow entries
      const followingLinks = await Follow.find({ follower: userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
  
      const followingIds = followingLinks.map((f) => f.following);
  
      // Fetch User and Profile info
      const users = await User.find({ _id: { $in: followingIds } }).select("name email");
      const profiles = await Profile.find({ user: { $in: followingIds } }).select("user username profilePicture");
  
      const enriched = users.map((user) => {
        const profile = profiles.find((p) => p.user.toString() === user._id.toString());
        return {
          _id: user._id,
          name: user.name,
          username: profile?.username || null,
          profilePicture: profile?.profilePicture || null,
        };
      });
  
      res.status(200).json({
        following: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
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
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isBanned) {
    return res.status(403).json({ message: "Access denied: user is banned" });
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
