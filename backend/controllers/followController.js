import Follow from "../models/Follow.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * @desc    Follow a user
 * @route   POST /api/follow/:userId
 * @access  Private
 */
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
      
    if (req.user._id.toString() === userId)
      return res.status(400).json({ message: "Cannot follow yourself" });

    const follow = await Follow.findOneAndUpdate(
      { follower: req.user._id, following: userId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Followed user", follow });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Unfollow a user
 * @route   DELETE /api/follow/:userId
 * @access  Private
 */
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const unfollow = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: userId,
    });

    if (!unfollow)
      return res.status(404).json({ message: "Not following this user" });

    res.status(200).json({ message: "Unfollowed user" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Suggest users to follow (excluding already-followed users & self)
 * @route   GET /api/follow/suggestions
 * @access  Private
 */
export const whoToFollow = async (req, res) => {
    try {
      const following = await Follow.find({ follower: req.user._id }).select("following");
      const followingIds = following.map(f => f.following);
  
      const suggestions = await User.find({
        _id: { $nin: [...followingIds, req.user._id] },
      })
        .select("name email")
        .limit(5);
  
      res.status(200).json({ suggestions });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
};
  