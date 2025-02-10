/**
 * @fileoverview Controller for handling posts
 * @module controllers/postController
 */

import Post from "../models/Post.js";
import User from "../models/User.js";

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
  
