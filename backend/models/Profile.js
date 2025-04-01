/**
 * Profile Model
 * Associates extended profile details with a user
 */

const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Each user has one profile
    },

    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allow null/undefined
      minlength: 3,
      maxlength: 30,
    },

    bio: {
      type: String,
      maxlength: 300,
    },

    profilePicture: {
      type: String, // path or external URL
      default: "",  // optional
    },

    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", ProfileSchema);
module.exports = Profile;
