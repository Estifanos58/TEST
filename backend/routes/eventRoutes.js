const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventsByOrganizer,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getFeaturedEvents
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getEvents);
router.get('/featured', getFeaturedEvents);
router.get('/:id', getEventById);

// Protected routes - ORDER MATTERS! Put specific routes before generic ones
router.get('/organizer/my-events', protect, authorize('organizer', 'admin'), getEventsByOrganizer);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

module.exports = router;

// Update for: feat(controlroom): create staff management UI and assignment screens
// Update for: feat(controlroom): oversee control room integration and code reviews
// Update for: feat(controlroom): build email notification service with templates