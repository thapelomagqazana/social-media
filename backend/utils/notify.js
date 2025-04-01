const Notification = require("../models/Notification");

/**
 * @function createNotification
 * @description Creates a notification and optionally broadcasts it via Socket.IO
 * @param {Object} param0 - Notification details
 * @param {string} param0.type - Type of notification
 * @param {string} param0.recipient - User receiving the notification
 * @param {string} param0.sender - User triggering the notification
 * @param {string} [param0.post] - Optional related post ID
 * @returns {Promise<Object>} - Created notification document
 */
const createNotification = async ({ type, recipient, sender, post }) => {
  if (recipient.toString() === sender.toString()) return; // Don't notify self

  const notification = await Notification.create({ type, recipient, sender, post });

  if (global.io) {
    global.io.to(recipient.toString()).emit("notification", notification);
  }

  return notification;
};

module.exports = { createNotification };
