/**
 * @fileoverview Admin Routes
 * @description Defines routes for banning users and deleting posts by admin or moderator.
 */

const express = require('express');
const {
  banUser,
  unbanUser,
  deletePostByAdmin,
} = require('../controllers/adminController.js');
const { protect, requireRole } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Must be authenticated and an admin/moderator
router.use(protect);

// Admin-only
router.put('/ban/:userId', requireRole('admin'), banUser);
router.put('/unban/:userId', requireRole('admin'), unbanUser);

// Admin or Moderator
router.delete('/posts/:postId', requireRole('admin', 'moderator'), deletePostByAdmin);

module.exports = router;
