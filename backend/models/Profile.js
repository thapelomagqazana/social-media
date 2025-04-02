/**
 * @fileoverview Profile Model
 * @module models/Profile
 * @description Associates extended profile details with a user
 */

const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the profile
 *         user:
 *           type: string
 *           description: User ID (reference to User collection)
 *         username:
 *           type: string
 *           description: Unique public username
 *         bio:
 *           type: string
 *           description: Short biography
 *         profilePicture:
 *           type: string
 *           description: URL or path to profile picture
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user interests
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      minlength: 3,
      maxlength: 30,
    },
    bio: {
      type: String,
      maxlength: 300,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", ProfileSchema);
module.exports = Profile;
