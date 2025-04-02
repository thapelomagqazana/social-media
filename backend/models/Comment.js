/**
 * @fileoverview Comment Model
 * @module models/Comment
 * @description Schema for storing comments related to posts.
 */

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - post
 *         - user
 *         - text
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the comment
 *         post:
 *           type: string
 *           description: The ID of the post the comment belongs to
 *         user:
 *           type: string
 *           description: The ID of the user who made the comment
 *         text:
 *           type: string
 *           description: The text content of the comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was last updated
 */

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
