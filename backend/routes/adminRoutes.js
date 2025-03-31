import express from 'express';
import {
  banUser,
  unbanUser,
  deletePostByAdmin,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Must be authenticated and an admin/moderator
router.use(protect);

// Admin-only
router.put('/ban/:userId', requireRole('admin'), banUser);
router.put('/unban/:userId', requireRole('admin'), unbanUser);

// Admin or Moderator
router.delete('/posts/:postId', requireRole('admin', 'moderator'), deletePostByAdmin);

export default router;
