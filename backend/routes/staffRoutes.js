const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createStaff, getStaffMembers, getStaffDashboard, scanTicket } = require('../controllers/staffController');

// Organizer routes
router.post('/create', protect, authorize('organizer', 'admin'), createStaff);
router.get('/members', protect, authorize('organizer', 'admin'), getStaffMembers);

// Staff routes
router.get('/dashboard', protect, getStaffDashboard);
router.post('/scan', protect, authorize('staff', 'security', 'admin', 'organizer'), scanTicket);

module.exports = router;

// Update for: feat(controlroom): add organizer management UI and verification states
// Update for: feat(controlroom): build organizer control panel with dashboard UX
// Update for: feat(controlroom): build dashboard UI with KPI widgets and summaries
// Update for: feat(controlroom): create events, ticket tiers, and transactions schema indexes
// Update for: feat(controlroom): build organizer control panel with dashboard UX
// Update for: feat(controlroom): implement multi-step event wizard UI flow
// Update for: feat(controlroom): connect staff dashboard actions to scan and attendance workflows
// Update for: feat(controlroom): oversee control room integration and code reviews