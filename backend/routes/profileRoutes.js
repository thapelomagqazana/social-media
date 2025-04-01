const express = require("express");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController.js");
const { protect } = require("../middleware/authMiddleware.js");
const { upload } = require("../middleware/uploadMiddleware.js");

const router = express.Router();

// @route   GET /api/profile/:userId
router.get("/:userId", protect, getProfile);

// @route   PUT /api/profile/:userId
router.put("/:userId", protect, upload.single("file"), updateProfile);

module.exports = router;
