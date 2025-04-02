/**
 * @fileoverview Profile Routes
 * @module routes/profileRoutes
 * @description Defines API endpoints for getting and updating user profiles.
 */

const express = require("express");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController.js");
const { protect } = require("../middleware/authMiddleware.js");
const { upload } = require("../middleware/uploadMiddleware.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Profile management
 */

/**
 * @swagger
 * /api/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB User ID
 *     responses:
 *       200:
 *         description: Profile returned
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get("/:userId", protect, getProfile);

/**
 * @swagger
 * /api/profile/{userId}:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     consumes:
 *       - multipart/form-data
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *               interests:
 *                 type: string
 *                 description: JSON array string (e.g., ["coding", "music"])
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.put("/:userId", protect, upload.single("file"), updateProfile);

module.exports = router;
