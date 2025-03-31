import Notification from '../models/Notification.js';

// Create a notification
export const createNotification = async ({ type, recipient, sender, post }) => {
  if (recipient.toString() === sender.toString()) return; // Don't notify self

  const notification = await Notification.create({ type, recipient, sender, post });

  // Optional WebSocket broadcast
  if (global.io) {
    global.io.to(recipient.toString()).emit('notification', notification);
  }

  return notification;
};
