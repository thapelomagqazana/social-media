/**
 * @fileoverview Post Model for MongoDB
 * @module models/Post
 */

import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [1000, "Post content cannot exceed 1000 characters"],
    },
    hashtags: {
        type: [String], // Array of hashtags
        index: true, // Create an index for faster lookups
    },
    media: {
      type: String,
      validate: {
        validator: function (value) {
          return !value || /^https?:\/\/.+\.(jpg|jpeg|png|gif|mp4|webm|avi|mov)$/i.test(value);
        },
        message: "Invalid media URL",
      },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    // comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    commentCount: { type: Number, default: 0 },

    // Soft Delete Fields
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    createdAt: {
        type: Date,
        default: Date.now,
    },
  },
  { timestamps: true }
);

/**
 * Ensure hashtags are always stored in lowercase.
 * This prevents duplicate entries (e.g., #Tech and #tech are treated the same).
 */
postSchema.pre("save", function (next) {
    if (this.hashtags && this.hashtags.length > 0) {
      this.hashtags = this.hashtags.map((tag) => tag.toLowerCase());
    }
    next();
});
  
// Create a MongoDB index on the hashtags field for **fast lookups**
postSchema.index({ hashtags: 1 });

export default mongoose.model("Post", postSchema);
