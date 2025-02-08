/**
 * @fileoverview User Controller
 * @module controllers/userController
 * @description Implements logic for user CRUD operations.
 */

import User from "../models/User.js";
import mongoose from "mongoose";

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
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @function getUserById
 * @description Retrieves a user by ID.
 * @param {Object} req - Express request object containing `userId` as a URL parameter.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response containing the user data (excluding password).
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Ensure user can only fetch their profile or admin can fetch any user
    if (!isAdmin && userId !== requesterId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // XSS Attack Prevention
    const xssRegex = /<script>|<\/script>/i;
    if (xssRegex.test(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate ObjectID format
    if (!mongoose.Types.ObjectId.isValid(userId) || !isNaN(userId) || userId.length > 24) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

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
    const updateData = req.body;
    const requestingUser = req.user; // Extract user from auth middleware

    // Validate user ID format before querying MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Prevent non-admin users from updating others
    if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Prevent restricted fields from being updated
    if (updateData.password) {
      return res.status(400).json({ message: "Password update not allowed" });
    }

    // Prevent `_id` modification
    delete updateData._id;

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
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
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    // Validate ObjectID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Prevent Non-Admin from deleting other users
    if (requesterId !== userId && requesterRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    // Send appropriate messages
    if (requesterId === userId) {
      return res.status(200).json({ message: "Your account has been deleted" });
    } else {
      return res.status(200).json({ message: "User deleted successfully" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get User Followers
 * - Retrieves all followers of a specific user.
 * - Uses **Mongoose aggregation** for optimized data retrieval.
 * - Returns follower details such as **ID, name, and avatar**.
 * 
 * @route   GET /api/users/:userId/followers
 * @access  Private
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch followers with populated user details (name & avatar)
    const followers = await User.find({ following: userId }).select("name avatar");

    return res.status(200).json({
      success: true,
      count: followers.length,
      followers,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return res.status(500).json({ message: "Server error" });
  }
};