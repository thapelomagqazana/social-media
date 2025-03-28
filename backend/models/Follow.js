import mongoose from "mongoose";

/**
 * @description Schema representing follow relationships between users.
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

followSchema.index({ follower: 1, following: 1 }, { unique: true }); // Prevent duplicates

export default mongoose.model("Follow", followSchema);