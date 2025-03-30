import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import mongoose from "mongoose";
import escape from "escape-html";

/**
 * @desc    Create a new post with optional image
 * @route   POST /api/posts
 * @access  Private
 */
export const createPost = async (req, res) => {
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
export const deletePost = async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Not your post' });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({ message: 'Post and related comments deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Toggle like/unlike a post
 * @route   PUT /api/posts/:postId/like
 * @access  Private
 */
export const toggleLikePost = async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const liked = post.likes.includes(req.user._id);

    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.status(200).json({ message: liked ? 'Unliked post' : 'Liked post' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Comment on a post
 * @route   POST /api/posts/:postId/comment
 * @access  Private
 */
export const commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  if (!text?.trim()) {
    return res.status(400).json({ message: 'Comment text required' });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      text: text.trim(),
    });

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
