const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Like:
 *       type: object
 *       required:
 *         - user
 *         - post
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the like entry
 *         user:
 *           type: string
 *           format: uuid
 *           description: ID of the user who liked the post
 *         post:
 *           type: string
 *           format: uuid
 *           description: ID of the post that was liked
 *         likedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the like was created
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of record creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last record update
 */
const likeSchema = new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
      likedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
  // Prevent duplicate likes
  likeSchema.index({ user: 1, post: 1 }, { unique: true });
  
  module.exports = mongoose.model('Like', likeSchema);
  