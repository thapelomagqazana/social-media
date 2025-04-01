/**
 * @fileoverview Server Entry Point
 * @description Starts the Express server after connecting to MongoDB.
 */

const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

global.io = io; // So notify.js can use it

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) socket.join(userId); // Join room for user
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
