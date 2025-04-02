/**
 * @fileoverview Post Model
 * @module models/Post
 * @description Represents a social media post, which can contain text, an image, and user likes.
 */

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the post
 *         user:
 *           type: string
 *           description: ID of the user who created the post
 *         text:
 *           type: string
 *           description: Text content of the post
 *         image:
 *           type: string
 *           description: Optional image URL or path
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked the post
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Post creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Post update timestamp
 */

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
