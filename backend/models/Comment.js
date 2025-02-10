/**
 * @fileoverview Comment Model
 * @description Defines the structure of the Comment document in MongoDB.
 */

import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Post", 
      required: true, 
      index: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    deleted: { 
        type: Boolean, 
        default: false 
    },  // Soft delete flag
    deletedAt: { 
        type: Date, 
        default: null 
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
