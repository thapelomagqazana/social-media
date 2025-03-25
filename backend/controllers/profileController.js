import Profile from "../models/Profile.js";
import escape from 'escape-html';

/**
 * @desc    Get a user's profile
 * @route   GET /api/profile/:userId
 * @access  Private
 */
export const getProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const profile = await Profile.findOne({ user: userId }).populate("user", "email name role");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Escape fields that are user-generated
    profile.username = escape(profile.username || '');
    profile.bio = escape(profile.bio || '');

    res.status(200).json(profile);
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
  const { username, bio, profilePicture } = req.body;

  try {
    // Ensure only the owner can update their profile
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let profile = await Profile.findOne({ user: userId });

    // Create profile if not exists
    if (!profile) {
      profile = new Profile({ user: userId });
    }

    if (username) profile.username = username.trim();
    if (bio) profile.bio = bio.trim();
    if (profilePicture) profile.profilePicture = profilePicture;

    // Escape fields that are user-generated
    profile.username = escape(profile.username || '');
    profile.bio = escape(profile.bio || '');

    await profile.save();

    res.status(200).json({ message: "Profile updated", profile });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(400).json({ message: "Username already taken" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};