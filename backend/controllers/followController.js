import Follow from "../models/Follow.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notify.js";

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

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const alreadyFollowing = await Follow.findOne({
      follower: req.user._id,
      following: userId,
    });

    if (alreadyFollowing) {
      return res.status(200).json({ message: "Already following" });
    }

    const follow = await Follow.create({
      follower: req.user._id,
      following: userId,
    });

    // Trigger follow notification
    await createNotification({
      type: 'follow',
      recipient: userId,
      sender: req.user._id,
    });

    return res.status(200).json({ message: "Followed user", follow });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Unfollow a user
 * @route   DELETE /api/follow/:userId
 * @access  Private
 */
export const unfollowUser = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (req.user._id.toString() === userId) {
    return res.status(400).json({ message: 'Cannot unfollow yourself' });
  }

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(200).json({ message: 'User not found, but treated as unfollowed' });
    }

    const follow = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: userId
    });

    return res.status(200).json({
      message: follow ? 'Unfollowed user' : 'Already not following user'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
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
  