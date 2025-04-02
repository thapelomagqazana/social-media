/**
 * @fileoverview Follow Model
 * @module models/Follow
 * @description Schema representing follow relationships between users.
 */

const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Follow:
 *       type: object
 *       required:
 *         - follower
 *         - following
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the follow relationship
 *         follower:
 *           type: string
 *           description: The user who is following another user
 *         following:
 *           type: string
 *           description: The user who is being followed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the follow was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the last follow update
 */

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate follow entries
followSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
