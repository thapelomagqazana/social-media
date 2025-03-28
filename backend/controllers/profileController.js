import Profile from "../models/Profile.js";
import escape from 'escape-html';
import mongoose from "mongoose";

/**
 * @desc    Get a user's profile
 * @route   GET /api/profile/:userId
 * @access  Private
 */
export const getProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find profile and populate user
    const profile = await Profile.findOne({ user: userId }).populate("user", "email name role");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Escape user-generated fields
    const safeProfile = {
      _id: profile._id,
      user: profile.user,
      username: escape(profile.username || ""),
      bio: escape(profile.bio || ""),
      interests: Array.isArray(profile.interests)
        ? profile.interests.map((i) => escape(i))
        : [],
      profilePicture: profile.profilePicture || "",
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    res.status(200).json({ profile: safeProfile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Update a user's profile
 * @route   PUT /api/profile/:userId
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { username, bio, profilePicture, interests } = req.body;

  try {
    if (Object.keys(req.body).length === 0 && !req.file) {
      return res.status(400).json({ message: "No update fields provided" });
    }

    const forbidden = ["role", "password", "tokens"];
    const hasForbidden = Object.keys(req.body).some((f) => forbidden.includes(f));
    if (hasForbidden) {
      return res.status(403).json({ message: "Cannot update restricted fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Ensure only the owner or admin can update
    if (req.user._id.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Find or create profile
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = new Profile({ user: userId });
    }

    // Optional fields update
    if (Object.prototype.hasOwnProperty.call(req.body, "username")) {
      profile.username = escape(username?.trim() || "");
    }
    
    if (Object.prototype.hasOwnProperty.call(req.body, "bio")) {
      profile.bio = escape(bio?.trim() || "");
    }

    
    if (Object.prototype.hasOwnProperty.call(req.body, "interests")) {
      try {
        // Accept JSON string or array directly
        const parsedInterests =
          typeof interests === "string" ? JSON.parse(interests) : interests;

        if (!Array.isArray(parsedInterests)) {
          return res.status(400).json({ message: "Interests must be an array" });
        }

        profile.interests = parsedInterests
          .map((interest) => escape(interest.trim()))
          .filter(Boolean); // remove empty strings
      } catch {
        return res.status(400).json({ message: "Invalid interests format" });
      }
    }

    // Handle profile picture (via req.file or direct link)
    if (req.file) {
      profile.profilePicture = `/uploads/${req.file.filename}`;
    } else if (Object.prototype.hasOwnProperty.call(req.body, "profilePicture")) {
      profile.profilePicture = profilePicture;
    }

    await profile.save();

    res.status(200).json({ message: "Profile updated", profile });
  } catch (error) {
    console.error(error);
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(400).json({ message: "Username already taken" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};