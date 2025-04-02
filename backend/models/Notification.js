/**
 * @fileoverview Notification Model
 * @module models/Notification
 * @description Represents user notifications such as follow, like, and comment events.
 */

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - recipient
 *         - sender
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the notification
 *         recipient:
 *           type: string
 *           description: ID of the user receiving the notification
 *         sender:
 *           type: string
 *           description: ID of the user triggering the notification
 *         type:
 *           type: string
 *           enum: [follow, like, comment]
 *           description: Type of notification
 *         post:
 *           type: string
 *           description: Associated post ID if applicable
 *         read:
 *           type: boolean
 *           default: false
 *           description: Read status of the notification
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['follow', 'like', 'comment'],
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
