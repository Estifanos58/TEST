const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { initPayment, verifyPayment } = require('../controllers/paymentController');
const { initPlatformFeePayment, verifyPlatformFeePayment, getPlatformFeeHistory } = require('../controllers/platformFeeController');

// Payment routes (Attendee pays for tickets)
router.post('/init', protect, initPayment);

// Verify endpoint - MUST come BEFORE platform-fee routes
router.get('/verify', protect, verifyPayment);

// Platform fee routes (Organizer pays admin)
router.post('/platform-fee', protect, initPlatformFeePayment);
router.post('/platform-fee/callback', verifyPlatformFeePayment);
router.get('/platform-fee/history', protect, getPlatformFeeHistory);

module.exports = router;

// Update for: feat(frontdoor): add POST /api/auth/register and /api/auth/login endpoints
// Update for: feat(frontdoor): implement checkout timer display and payment button