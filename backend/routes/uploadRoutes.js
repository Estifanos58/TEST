const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadEventImage, upload } = require('../controllers/uploadController');

// Upload event banner image (protected - only authenticated users)
router.post('/event-image', protect, upload.single('image'), uploadEventImage);

module.exports = router;

// Update for: chore(controlroom): finalize control room deployment config