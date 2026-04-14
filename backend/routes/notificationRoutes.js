const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserNotifications, markAsRead } = require('../services/notificationService');

router.get('/', protect, getUserNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
