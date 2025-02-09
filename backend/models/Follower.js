import mongoose from "mongoose";

/**
 * @schema Follower
 * @description Stores relationships between followers and users they follow.
 * @field {ObjectId} follower - User who follows
 * @field {ObjectId} following - User being followed
 * @field {Date} createdAt - Timestamp when the follow relationship was created
 */
const followerSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Ensure a user cannot follow the same person multiple times
followerSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follower = mongoose.model("Follower", followerSchema);
export default Follower;
