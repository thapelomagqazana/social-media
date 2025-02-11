/**
 * @fileoverview Server Entry Point
 * @description Starts the Express server after connecting to MongoDB & WebSockets.
 */

import dotenv from "dotenv";
import http from "http"; // Import HTTP module to wrap Express
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocketServer } from "./ws/messages.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create an HTTP server
const server = http.createServer(app);

// Initialize WebSocket Server
initializeSocketServer(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));