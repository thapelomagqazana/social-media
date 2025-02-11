/**
 * @fileoverview Comment Controller
 * @description Handles adding comments to posts.
 */

import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import redisClient from "../config/redisClient.js";

/**
 * @function addComment
 * @description Adds a comment to a post.
 * @route POST /api/posts/:postId/comment
 * @access Private (Requires authentication)
 */
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Validate postId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID format" });
    }

    // Validate text
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters" });
    }

    // Check if the post exists and is not soft-deleted
    const post = await Post.findById(postId);
    if (!post || post.deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create comment in a separate collection
    const comment = await Comment.create({
      post: postId,
      user: userId,
      text,
    });

    // Increment comment count in post (without storing the comments inside the post)
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    return res.status(201).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    return res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

/**
 * @function deleteComment
 * @description Soft deletes a comment on a post.
 * @route DELETE /api/posts/:postId/comment/:commentId
 * @access Private (Requires authentication)
 */
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Check if post exists and is not soft deleted
    const post = await Post.findOne({ _id: postId, deleted: { $ne: true } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if comment exists
    const comment = await Comment.findOne({ _id: commentId, post: postId });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Authorization: Allow comment owner or admin to delete
    if (comment.user.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    // Soft delete comment
    comment.deleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    // **Prevent decrementing below zero**
    if (post.commentCount > 0) {
        await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } }, { new: true });
    }

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

/**
 * @function getTrendingPosts
 * @description Retrieves trending posts based on engagement.
 * @route GET /api/posts/trending
 * @access Public
 */
export const getTrendingPosts = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
  
      // Cache key for trending posts
      const cacheKey = `trending:limit=${limit}`;
  
      // Check Redis cache
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
  
      // Engagement Score Formula
      // score = (likesCount * 3) + (commentCount * 2) + (newer posts get a higher boost)
      const trendingPosts = await Post.aggregate([
        {
          $match: { deleted: { $ne: true } }, // Exclude soft-deleted posts
        },
        {
          $addFields: {
            engagementScore: {
              $add: [
                { $multiply: ["$likesCount", 3] }, // Likes have highest weight
                { $multiply: ["$commentCount", 2] }, // Comments have medium weight
                {
                  $divide: [
                    { $subtract: [new Date(), "$createdAt"] },
                    -1000 * 60 * 60 * 24, // Normalize age of the post (negative for recency boost)
                  ],
                },
              ],
            },
          },
        },
        { $sort: { engagementScore: -1 } }, // Sort by highest score
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            content: 1,
            media: 1,
            likesCount: 1,
            commentCount: 1,
            createdAt: 1,
            engagementScore: 1,
            user: { _id: 1, name: 1, avatar: 1 },
          },
        },
      ]);
  
      // Cache result for 5 minutes
      await redisClient.setex(cacheKey, 300, JSON.stringify(trendingPosts));
  
      return res.status(200).json(trendingPosts);
    } catch (error) {
      return res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
};

