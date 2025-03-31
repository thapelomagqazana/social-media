/**
 * @fileoverview Authentication and Authorization Middleware
 * @module middleware/authMiddleware
 * @description Protects routes by verifying JWT tokens and authorizing users.
 */

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

/**
 * @function protect
 * @description Middleware to check if user is authenticated
 */
export const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token)
    return res.status(401).json({ message: "Not authorized, token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: 'User not found or deleted' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * @function isAdmin
 * @description Middleware to allow only admin users
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Access denied: Admins only" });
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

export const checkBanned = (req, res, next) => {
  if (req.user.isBanned) {
    return res.status(403).json({ message: 'Your account has been banned' });
  }
  next();
};

  
  
