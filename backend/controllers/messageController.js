/**
 * @fileoverview REST API for Sending Messages
 * @module controllers/messageController
 */

import Message from "../models/Message.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { io } from "../ws/socket.js"; // Import WebSocket instance

/**
 * @function sendMessage
 * @description Sends a message between users and emits it via WebSocket if online.
 * @route POST /api/messages/send
 * @access Private (Authenticated users only)
 */
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    // Validate receiver
    if (!receiverId || !content.trim()) {
      return res.status(400).json({ message: "Receiver and content are required" });
    }

    if (content.trim().length > 500) {
        return res.status(400).json({ message: "Message exceeds maximum length" });
    }

    // Ensure receiver exists
    const recipientExists = await User.findById(receiverId);
    if (!recipientExists) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Store message in DB
    const message = await Message.create({ senderId, receiverId, content });

    // Emit message via WebSocket if recipient is online
    if (io && io.sockets) {
      io.to(receiverId.toString()).emit("newMessage", message);
    }

    res.status(201).json({ message: "Message sent successfully", data: message });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @function getMessages
 * @description Retrieves paginated chat messages between two users.
 * @route GET /api/messages
 * @access Private
 */
export const getMessages = async (req, res) => {
    try {
      let { receiverId, page = 1, limit = 20 } = req.query;
      let senderId = req.user._id;

      if (!receiverId) {
        return res.status(400).json({ message: "Receiver ID is required" });
      }
  
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ message: "Invalid receiver ID format" });
      }

      // Ensure only sender or receiver can access messages
      if (req.user._id !== senderId && req.user._id !== receiverId) {
        return res.status(403).json({ message: "You do not have permission to view these messages" });
      }
    
  
      // Convert page & limit to numbers
      page = parseInt(page, 10);
      limit = parseInt(limit, 10);
  
      if (page < 1 || limit < 1) {
        return res.status(400).json({ message: "Page and limit must be positive integers" });
      }
  
      // Query for messages exchanged between sender and receiver
      const messages = await Message.find({
        $or: [
          { senderId, receiverId }, // Sender → Receiver
          { senderId: receiverId, receiverId: senderId }, // Receiver → Sender
        ],
      })
        .sort({ createdAt: -1 }) // Get latest messages first
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("senderId", "name avatar")
        .populate("receiverId", "name avatar");
  
      if (messages.length === 0) {
        return res.status(404).json({ message: "No messages found" });
      }
  
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
};


