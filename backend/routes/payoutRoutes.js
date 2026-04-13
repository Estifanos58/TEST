const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { initPayout, getPayoutHistory } = require('../controllers/payoutController');

router.post('/init', protect, initPayout);
router.get('/history', protect, getPayoutHistory);

module.exports = router;

// Update for: feat(controlroom): implement event media upload endpoints under /api/upload
// Update for: feat(controlroom): create staff management UI and assignment screens