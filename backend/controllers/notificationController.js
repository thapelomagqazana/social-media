import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

/**
 * Get notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name email')
      .populate('post', 'text')
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid Notification ID' });
    }
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });
    if (notification.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    notification.read = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
