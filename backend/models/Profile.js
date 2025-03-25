import mongoose from "mongoose";

/**
 * @description Schema for user profile linked to the User model
 */
const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 30,
    },
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },
    profilePicture: {
      type: String, // URL or cloudinary path
      default: "",
    },
  },
  { timestamps: true }
);

// Create compound index to ensure fast lookups
profileSchema.index({ username: 1 });

export default mongoose.model("Profile", profileSchema);