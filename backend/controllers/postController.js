const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
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

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({ message: "Post and related comments deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Toggle like/unlike a post
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

    const liked = post.likes.includes(req.user._id);

    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);

      if (post.user.toString() !== req.user._id.toString()) {
        await createNotification({
          type: "like",
          recipient: post.user,
          sender: req.user._id,
          post: post._id,
        });
      }
    }

    await post.save();
    res.status(200).json({ message: liked ? "Unliked post" : "Liked post", post });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
 * @desc    Get newsfeed for logged-in user (posts by followed users)
 * @route   GET /api/posts/newsfeed
 * @access  Private
 */
const getNewsfeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("following");
    const followingIds = [...user.following, req.user._id];

    const posts = await Post.find({ user: { $in: followingIds } })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createPost,
  deletePost,
  toggleLikePost,
  commentOnPost,
  getNewsfeed,
};
