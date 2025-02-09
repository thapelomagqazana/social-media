/**
 * @fileoverview User Controller
 * @module controllers/userController
 * @description Implements logic for user CRUD operations.
 */

import User from "../models/User.js";
import Follower from "../models/Follower.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import redisClient from "../config/redisClient.js";

// Function to check valid ObjectId format
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

/**
 * @function getUsers
 * @description Retrieves paginated users with optional search filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response containing a list of users (excluding passwords).
 */
export const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, role } = req.query;

    // Convert page & limit to integers
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let query = {};

    // Search by name or email (case insensitive)
    if (search) {
      const searchTerm = search.trim();

      query.$or = [
        { name: { $regex: `^${searchTerm}$`, $options: "i" } }, // Exact name match
        { email: { $regex: searchTerm, $options: "i" } } // Case-insensitive email search
      ];
    }

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Get paginated results
    const users = await User.find(query)
      .select("-password") // Exclude passwords
      .sort({ createdAt: -1 }) // Show latest users first
      .skip(skip)
      .limit(limitNumber);

    // Count total users (for pagination metadata)
    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      totalUsers,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalUsers / limitNumber),
    });
  } catch (error) {
    // console.error("Error fetching users:", error.message);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

/**
 * @function getUserDetails
 * @description Fetches a user's details from the database (with caching).
 * @param {Object} req - Express request object (contains userId).
 * @param {Object} res - Express response object.
 */
export const getUserDetails = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID format
    if (!isValidObjectId(userId) || /[<>'";()=]/.test(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    

    // Check Redis cache first
    const cachedUser = await redisClient.get(`user:${userId}`);
    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser));
    }

    // Fetch user from MongoDB
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cache user data in Redis
    await redisClient.setex(`user:${userId}`, 3600, JSON.stringify(user));

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Server Error in GET /api/users/:userId:", error.message);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
});

/**
 * @function updateUser
 * @description Updates user details (name, password).
 * @param {Object} req - Express request object containing `userId` and updated data.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with the updated user details.
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch user from DB
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser && existingUser._id.toString() !== req.params.userId) {
      return res.status(400).json({ message: "Email already in use" });
    }


    // Authorization Check (Prevent user from updating another user's profile)
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const imageRegex = /\.(jpg|jpeg|png|gif)$/i;
    if (req.body.avatar && !imageRegex.test(req.body.avatar)) {
      return res.status(400).json({ message: "Invalid avatar URL" });
    }


    // Validate Request Body (Reject empty updates)
    const updateFields = {};
    
    if (req.body.name) {
      if (req.body.name.trim().length === 0){
        return res.status(400).json({ message: "Invalid name" });
      }
      if (req.body.name.length > 255) {
        return res.status(400).json({ message: "Name too long" });
      }
      if (/['";<>()=]/.test(req.body.name)) {
        return res.status(400).json({ message: "Invalid characters in name" });
      }
      updateFields.name = req.body.name;
    }

    if (req.body.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      updateFields.email = req.body.email;
    }

    if (req.body.avatar) {
      updateFields.avatar = req.body.avatar;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Update User (Use $set to avoid unnecessary field updates)
    user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({ user });

  } catch (error) {
    // Catch Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @function deleteUser
 * @description Deletes a user from the database.
 * @param {Object} req - Express request object containing `userId` as a URL parameter.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response confirming user deletion.
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

  
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure user can only delete their account unless they are an admin
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this user" });
    }

    // Cascade delete related data
    await Promise.all([
      // Post.deleteMany({ userId }),           // Delete user’s posts
      // Comment.deleteMany({ userId }),        // Delete user’s comments
      Follower.deleteMany({ $or: [{ following: userId }, { follower: userId }] }), // Remove follow relationships
    ]);

    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: "User and related data deleted successfully" });

  } catch (error) {
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

/**
 * @route GET /api/users/:userId/followers
 * @description Get a user's followers with pagination
 * @access Public
 */
export const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query; // Default page: 1, limit: 10

    // Validate userId format to avoid MongoDB errors
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert pagination params to numbers
    const pageNum = Math.max(1, parseInt(page)); // Ensure page is at least 1
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Set a reasonable max limit (100)

    // Use indexed query for performance
    const followers = await Follower.find({ following: userId })
      .populate("follower", "name email avatar") // Populate follower details
      .sort({ createdAt: -1 }) // Most recent followers first
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(); // Convert to plain JSON for efficiency

    // Get total followers count for pagination info
    const totalFollowers = await Follower.countDocuments({ following: userId });

    res.status(200).json({
      followers,
      totalFollowers,
      currentPage: pageNum,
      totalPages: Math.ceil(totalFollowers / limitNum),
    });
  } catch (error) {
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

/**
 * @function getUserFollowing
 * @description Retrieves a paginated list of users that a given user is following, with caching optimization.
 * @param {Object} req - Express request object (contains userId, page, limit)
 * @param {Object} res - Express response object
 * @returns {JSON} List of users the given user is following
 */
export const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Validate userId format
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check Redis cache for follow list
    const cacheKey = `user:${userId}:following:page:${page}:limit:${limit}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Verify if the user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch users the given user follows
    const following = await Follower.find({ follower: userId })
      .populate({ path: "following", select: "name email avatar" })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalFollowing = await Follower.countDocuments({ follower: userId });

    const response = {
      following: following.map(f => f.following),
      totalFollowing,
      currentPage: page,
      totalPages: Math.ceil(totalFollowing / limit)
    };

    // Cache the response for faster future retrieval
    await redisClient.setex(cacheKey, 3600, JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

/**
 * @function followUser
 * @description Allows an authenticated user to follow another user, ensuring atomicity to avoid race conditions.
 * @param {Object} req - Express request object (contains logged-in user ID)
 * @param {Object} res - Express response object
 * @returns {JSON} Success or failure message
 */
export const followUser = async (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user._id.toString();

  try {
    // Validate userId format
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Prevent self-following
    if (loggedInUserId === userId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if the user to be followed exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Perform an atomic update to prevent race conditions
    const result = await Follower.updateOne(
      { follower: loggedInUserId, following: userId },
      { $setOnInsert: { follower: loggedInUserId, following: userId } },
      { upsert: true }
    );

    if (result.upsertedCount === 0) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Increment follow count for both users
    await User.updateOne({ _id: loggedInUserId }, { $inc: { followingCount: 1 } });
    await User.updateOne({ _id: userId }, { $inc: { followerCount: 1 } });

    // Invalidate Redis cache for the user's following list
    await redisClient.del(`user:${loggedInUserId}:following`);
    await redisClient.del(`user:${userId}:followers`);

    res.status(200).json({ message: "Successfully followed user" });
  } catch (error) {
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};