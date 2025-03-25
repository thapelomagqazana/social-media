/**
 * @fileoverview Authentication controller
 * @module controllers/authController
 * @description Handles user registration, login, and logout using JWT and cookies.
 */
import User from "../models/User.js";
import mongoose from "mongoose";
import { generateToken } from "../utils/token.js";

/**
 * @function signup
 * @description Registers a new user and sets a token cookie
 */
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email: email?.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }
    // Handle Mongoose validation errors
    if (err instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(". ") });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @function signin
 * @description Authenticates a user and issues a JWT cookie
 */
export const signin = async (req, res) => {
  const { email, password } = req.body;

  // Validate presence
  if (!email || !password) {
    return res.status(400).json({ message: !email ? "Email is required" : "Password is required" });
  }

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @function signout
 * @description Clears the JWT cookie to log out the user
 */
export const signout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
};
