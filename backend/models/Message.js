/**
 * @fileoverview MongoDB Schema for Messages
 * @module models/Message
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    read: { type: Boolean, default: false },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true, // Index for fast sorting by time
    },
  },
  { timestamps: true }
);

// Index sender & receiver for efficient querying
messageSchema.index({ sender: 1, receiver: 1 });

export default mongoose.model("Message", messageSchema);
