import express from "express";
import {
  getProfile,
  updateProfile,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js"; 

const router = express.Router();

// @route   GET /api/profile/:userId
router.get("/:userId", protect, getProfile);

// @route   PUT /api/profile/:userId
router.put("/:userId", protect, upload.single("file"), updateProfile);

export default router;