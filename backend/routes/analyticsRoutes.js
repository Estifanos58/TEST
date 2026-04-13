const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getEventAnalytics, getOrganizerStats, exportOrganizerDashboardCsv } = require('../controllers/analyticsController');

// Get organizer dashboard stats
router.get('/organizer/stats', protect, authorize('organizer'), getOrganizerStats);
router.get('/organizer/stats/csv', protect, authorize('organizer'), exportOrganizerDashboardCsv);

// Get event analytics
router.get('/event/:eventId', protect, authorize('organizer'), getEventAnalytics);

module.exports = router;

// Update for: feat(controlroom): add dashboard navigation and layout coherence
// Update for: chore(controlroom): finalize control room deployment config
// Update for: feat(controlroom): build email notification service with templates