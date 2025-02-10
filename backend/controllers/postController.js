/**
 * @fileoverview Controller for handling posts
 * @module controllers/postController
 */

import Post from "../models/Post.js";
import User from "../models/User.js";
import redisClient from "../config/redisClient.js";
import mongoose from "mongoose";

/**
 * @function createPost
 * @description Allows an authenticated user to create a post.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {JSON} Success or error message
 */
export const createPost = async (req, res) => {
    try {
      const { content, media } = req.body;
      const userId = req.user._id;
  
      // Validate input
      if (!content) {
        return res.status(400).json({ message: "Post content is required" });
      }
  
      if (typeof content !== "string") {
        return res.status(400).json({ message: "Invalid input format" }); // Correct message
      }
  
      if (content.length > 1000) {
        return res.status(400).json({ message: "Post content cannot exceed 1000 characters" });
      }
  
      if (media && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|mp4|webm|avi|mov)$/i.test(media)) {
        return res.status(400).json({ message: "Invalid media URL" });
      }
  
      // Create post
      const newPost = await Post.create({ user: userId, content, media });
  
      // Increment postCount
      await User.findByIdAndUpdate(userId, { $inc: { postCount: 1 } });
  
      return res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
      return res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
};

/**
 * @function getPosts
 * @description Retrieves paginated posts (newsfeed) with user details, caching enabled. Filters out soft-deleted posts.
 * @route GET /api/posts
 * @access Private (Requires authentication)
 */
export const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const userId = req.query.userId;

        // Validate userId format
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        // Cache key for this request
        const cacheKey = `posts:page=${page}:limit=${limit}:userId=${userId || "all"}`;

        // Check Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData)); // Return cached response
        }

        // Query for fetching posts, ensuring soft-deleted posts are excluded
        const query = { deleted: false }; // Exclude soft-deleted posts
        if (userId) {
            query.user = userId;
        }

        // Fetch posts with user details (prefetching)
        const posts = await Post.find(query)
            .populate("user", "name avatar") // Load user name and avatar
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        // Get total count for pagination (excluding soft-deleted posts)
        const totalPosts = await Post.countDocuments(query);

        const response = {
            posts,
            totalPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
        };

        // Cache result for 5 minutes
        await redisClient.setex(cacheKey, 300, JSON.stringify(response));

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
};


/**
 * @function getPostById
 * @description Retrieves a specific post from the database, using caching to optimize performance.
 * @route GET /api/posts/:postId
 * @param {Object} req - Express request object containing postId in params.
 * @param {Object} res - Express response object.
 * @returns {JSON} Returns the requested post or an error message.
 */
/**
 * @function getPostById
 * @description Fetches a single post by ID, allowing admins to see soft deleted posts.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPostById = async (req, res) => {
    try {
      const { postId } = req.params;
      const includeDeleted = req.query.includeDeleted === "true"; // Convert to boolean
  
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({ message: "Invalid post ID format" });
      }

      // Check if the post is cached in Redis
      const cachedPost = await redisClient.get(`post:${postId}`);
      if (cachedPost) {
        return res.status(200).json({ post: JSON.parse(cachedPost), cached: true });
      }
  
      // Define query filter: Only allow fetching deleted posts if requested by an admin
      const query = { _id: postId };
      if (!includeDeleted || req.user.role !== "admin") {
        query.deleted = false;
      }
  
      // Fetch post with user details
      const post = await Post.findOne(query).populate("user", "name avatar");
  
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Cache the post in Redis for future requests (expires in 60 minutes)
      await redisClient.setex(`post:${postId}`, 3600, JSON.stringify(post));

      return res.status(200).json({ post, cached: false });
    } catch (error) {
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
};
  

/**
 * @function invalidatePostCache
 * @description Deletes a post from cache when it is updated or deleted.
 * @param {string} postId - The ID of the post to be invalidated in the cache.
 */
export const invalidatePostCache = async (postId) => {
    await redisClient.del(`post:${postId}`);
};

/**
 * @function deletePost
 * @description Soft deletes a post (marks it as deleted instead of removing it).
 * @param {Object} req - Express request object containing `postId`.
 * @param {Object} res - Express response object.
 * @returns {JSON} Success or error message.
 */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate ObjectId
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid post ID format" });
    }

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Authorization: Allow only the post owner or an admin to delete
    if (req.user.id !== post.user.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    // Soft delete the post
    post.deleted = true;
    post.deletedAt = new Date();
    await post.save();

    return res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

/**
 * @function likePost
 * @description Allows a user to like a post with atomic updates.
 * @route POST /api/posts/:postId/like
 * @access Private
 */
export const likePost = async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user._id;
  
      // Validate post ID format
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({ message: "Invalid post ID format" });
      }
  
      // Find post
      const post = await Post.findById(postId);
      if (!post || post.deleted) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      // Check if user already liked the post
      const alreadyLiked = post.likes.includes(userId);
      if (alreadyLiked) {
        return res.status(200).json({ message: "Post already liked" });
      }
  
      // Atomic update to add like
      await Post.updateOne(
        { _id: postId },
        { $addToSet: { likes: userId } } // $addToSet prevents duplicate entries
      );
      await Post.updateOne({ _id: postId }, { $inc: { likesCount: 1 } });
  
      return res.status(200).json({ message: "Post liked successfully" });
  
    } catch (error) {
      return res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

/**
 * @function unlikePost
 * @description Allows a user to unlike a post.
 * @route POST /api/posts/:postId/unlike
 * @access Private
 */
export const unlikePost = async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user._id;
  
      // Validate post ID format
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({ message: "Invalid post ID format" });
      }
  
      // Find post
      const post = await Post.findById(postId);
      if (!post || post.deleted) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      // Check if user has already liked the post
      if (!post.likes.includes(userId)) {
        return res.status(200).json({ message: "Post not liked yet" });
      }
      // Atomic update to remove like
      await Post.updateOne(
        { _id: postId },
        { $pull: { likes: userId } } // $pull ensures the user is removed from likes array
      );
      await Post.updateOne({ _id: postId }, { $inc: { likesCount: -1 } });
      return res.status(200).json({ message: "Post unliked successfully" });
  
    } catch (error) {
      return res.status(500).json({ message: `Server error: ${error.message}` });
    }
};
  
  


