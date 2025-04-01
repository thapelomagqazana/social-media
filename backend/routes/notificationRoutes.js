const express = require('express');
const {
  getNotifications,
  markNotificationRead,
} = require('../controllers/notificationController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markNotificationRead);

module.exports = router;
