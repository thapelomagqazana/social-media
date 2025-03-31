import User from '../models/User.js';
import Post from '../models/Post.js';
import mongoose from 'mongoose';

/**
 * @desc    Ban a user
 * @route   PUT /api/admin/ban/:userId
 * @access  Admin only
 */
export const banUser = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Admins cannot ban themselves' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User banned', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @desc    Unban a user
 * @route   PUT /api/admin/unban/:userId
 * @access  Admin only
 */
export const unbanUser = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (req.user._id.toString() === userId) {
    return res.status(400).json({ message: "Admins cannot unban themselves" });
  }
  
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User unbanned', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @desc    Delete a post
 * @route   DELETE /api/admin/posts/:postId
 * @access  Moderator/Admin
 */
export const deletePostByAdmin = async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findByIdAndDelete(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json({ message: 'Post removed by admin/moderator' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
