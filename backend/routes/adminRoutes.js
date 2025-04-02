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

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations like banning/unbanning users and deleting posts
 */

/**
 * @swagger
 * /api/admin/ban/{userId}:
 *   put:
 *     summary: Ban a user (Admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     responses:
 *       200:
 *         description: User banned
 *       400:
 *         description: Invalid user ID or trying to ban yourself
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/ban/:userId', requireRole('admin'), banUser);

/**
 * @swagger
 * /api/admin/unban/{userId}:
 *   put:
 *     summary: Unban a user (Admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     responses:
 *       200:
 *         description: User unbanned
 *       400:
 *         description: Invalid user ID or trying to unban yourself
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/unban/:userId', requireRole('admin'), unbanUser);

/**
 * @swagger
 * /api/admin/posts/{postId}:
 *   delete:
 *     summary: Delete a post (Admin or Moderator)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB post ID
 *     responses:
 *       200:
 *         description: Post removed by admin/moderator
 *       400:
 *         description: Invalid post ID
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 */
router.delete('/posts/:postId', requireRole('admin', 'moderator'), deletePostByAdmin);

module.exports = router;
