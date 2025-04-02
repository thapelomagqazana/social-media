/**
 * @fileoverview Express App Configuration
 * @description Initializes middleware, routes, security headers, and logging.
 */

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const xss = require("xss-clean");
const fs = require("fs");
const path = require("path");
const multer = require("multer"); // Needed for error handling middleware
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerOptions = require('./config/swagger');

const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const followRoutes = require("./routes/followRoutes");
const postRoutes = require("./routes/postRoutes");
const searchRoutes = require("./routes/searchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

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
const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/profile", profileRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/search", searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use("/auth", authRoutes);

// Default route
app.get("/", (req, res) => res.send("MERN Social API Running"));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Only image files")) {
    return res.status(400).json({ message: err.message });
  }

  next(err);
});


module.exports = app;
