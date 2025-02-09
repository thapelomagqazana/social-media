/**
 * @fileoverview User Routes
 * @module routes/userRoutes
 * @description Defines API endpoints for user CRUD operations.
 */

import express from "express";
import {
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  getUserFollowers
} from "../controllers/userController.js";
import { protect, validateQueryParams, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route GET /api/users
 * @description Retrieves all users.
 * @access Protected (Requires authentication)
 */
router.get("/", protect, validateQueryParams, getUsers);

/**
 * @route GET /api/users/:userId
 * @description Retrieves a single user by ID.
 * @access Protected (Requires authentication)
 */
router.get("/:userId", protect, validateQueryParams, getUserDetails);

/**
 * @route PUT /api/users/:userId
 * @description Updates user details (only the signed-in user can update their own info).
 * @access Protected (Requires authentication & authorization)
 */
router.put("/:userId", protect, updateUser);

/**
 * @route DELETE /api/users/:userId
 * @description Deletes a user account (only the signed-in user can delete their own account).
 * @access Protected (Requires authentication & authorization)
 */
router.delete("/:userId", protect, authorize(["admin", "user"]), deleteUser);

/**
 * @route   GET /api/users/:userId/followers
 * @desc    Get a paginated list of followers for a user
 * @access  Public (Authentication may be required based on app logic)
 */
router.get("/:userId/followers", protect, getUserFollowers);

export default router;
