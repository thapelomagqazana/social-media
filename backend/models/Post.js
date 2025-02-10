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

export default mongoose.model("Post", postSchema);
