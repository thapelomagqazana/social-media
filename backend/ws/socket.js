/**
 * @fileoverview WebSocket Implementation for Real-time Messaging
 * @module ws/socket
 */

import { Server } from "socket.io";
import Message from "../models/Message";
import Post from "../models/Post";

const onlineUsers = new Map(); // Store online users

export const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔗 New client connected:", socket.id);

    // Store userId and socketId mapping
    socket.on("userConnected", (userId) => {
      onlineUsers.set(userId, socket.id);
    });

    // Handle message sending
    socket.on("sendMessage", async ({ sender, receiver, content }) => {
      if (!sender || !receiver || !content.trim()) return;

      const message = await Message.create({ sender, receiver, content });

      // Emit message to receiver if online
      if (onlineUsers.has(receiver)) {
        io.to(onlineUsers.get(receiver)).emit("newMessage", message);
      }
    });

    // Notify users of new posts
    socket.on("newPost", async (post) => {
        const savedPost = await Post.findById(post._id).populate("user", "name avatar");
        io.emit("postUpdate", savedPost);
    });

    // Notify users of like/comment changes
    socket.on("updatePost", async (postId) => {
        const updatedPost = await Post.findById(postId);
        io.emit("postUpdate", updatedPost);
    });


    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};
