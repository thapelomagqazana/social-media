const Post = require("../models/Post");
const Follow = require("../models/Follow");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const mongoose = require("mongoose");
const escape = require("escape-html");
const { createNotification } = require("../utils/notify");

/**
 * @desc    Create a new post with optional image
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    const trimmedText = text?.trim();

    if (!trimmedText && !image) {
      return res.status(400).json({ message: "Post must contain text or image" });
    }

    const post = await Post.create({
      user: req.user._id,
      text: escape(text || ""),
      image,
    });

    res.status(201).json({ message: "Post created", post });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Delete a post (user or admin only)
 * @route   DELETE /api/posts/:postId
 * @access  Private
 */
const deletePost = async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden: Not your post" });
    }

    await Like.deleteMany({ post: post._id });
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({ message: "Post and related comments and likes deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Toggle like/unlike a post using Like model
 * @route   PUT /api/posts/:postId/like
 * @access  Private
 */
const toggleLikePost = async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existingLike = await Like.findOne({ user: req.user._id, post: post._id });

    if (existingLike) {
      await existingLike.deleteOne();
      return res.status(200).json({ message: "Unliked post" });
    } else {
      await Like.create({ user: req.user._id, post: post._id });

      if (post.user.toString() !== req.user._id.toString()) {
        await createNotification({
          type: "like",
          recipient: post.user,
          sender: req.user._id,
          post: post._id,
        });
      }

      return res.status(200).json({ message: "Liked post" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Comment on a post
 * @route   POST /api/posts/:postId/comment
 * @access  Private
 */
const commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  if (!text?.trim()) {
    return res.status(400).json({ message: "Comment text required" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      text: text.trim(),
    });

    if (post.user.toString() !== req.user._id.toString()) {
      await createNotification({
        type: "comment",
        recipient: post.user,
        sender: req.user._id,
        post: post._id,
      });
    }

    res.status(201).json({ message: "Comment added", comment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Fetch paginated newsfeed for authenticated user
 * @route   GET /api/posts/newsfeed?page=1&limit=10
 * @access  Private
 */
const getNewsfeed = async (req, res) => {
  try {
    let page = parseInt(req.query.page ?? "1");
    let limit = parseInt(req.query.limit ?? "10");

    // Sanitize inputs
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100)
      return res.status(400).json({ message: "Limit must be between 1 and 100" });

    const skip = (page - 1) * limit;

    // Get followed user IDs
    const followDocs = await Follow.find({ follower: req.user._id }).select("following");
    const followingIds = followDocs.map((doc) => doc.following.toString());

    // Include user's own posts too
    followingIds.push(req.user._id.toString());

    // Count total posts
    const totalPosts = await Post.countDocuments({ user: { $in: followingIds } });

    // Fetch paginated posts
    const posts = await Post.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email profile");

    const totalPages = Math.ceil(totalPosts / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      page,
      totalPages,
      totalPosts,
      hasMore, // For frontend infinite scroll logic
      posts,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createPost,
  deletePost,
  toggleLikePost,
  commentOnPost,
  getNewsfeed,
};
