/**
 * @fileoverview Express App Configuration
 * @description Initializes middleware, routes, security headers, and logging.
 */

import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan"; // HTTP request logger middleware
import xss from 'xss-clean';
import fs from "fs";
import path from "path";
import profileRoutes from "./routes/profileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import followRoutes from "./routes/followRoutes.js";

// Load environment variables
dotenv.config();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Initialize Express app
const app = express();

// Serve Static Uploads
app.use("/uploads", express.static("uploads"));

// Middleware configuration
app.use(morgan("dev")); // Log HTTP requests and responses in the terminal
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(cookieParser()); // Parse and handle cookies
app.use(compression()); // Compress response bodies
app.use(helmet()); // Secure app with HTTP headers
app.use(xss());

const whitelist = [process.env.FRONTEND_URL];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
}));// Allow frontend requests

// app.use((req, res, next) => {
//     console.log("👉 Incoming Request:", req.method, req.url);
//     console.log("📥 Request Body:", req.body);
//     console.log("📥 Request Headers:", req.headers);
  
//     const oldSend = res.send;
//     res.send = function (data) {
//       console.log("📤 Response Status:", res.statusCode);
//       console.log("📤 Response Body:", data);
//       oldSend.apply(res, arguments);
//     };
  
//     next();
// });
  

// Routes
app.use("/api/profile", profileRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/users", userRoutes);
app.use("/auth", authRoutes);

// Default route
app.get("/", (req, res) => res.send("MERN Social API Running"));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Only image files")) {
    return res.status(400).json({ message: err.message });
  }

  next(err);
});


export default app;
