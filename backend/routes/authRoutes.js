const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validate } = require('../middleware/validationMiddleware');
const { userValidation } = require('../middleware/validationMiddleware');

// Public routes
router.post('/register', validate(userValidation.register), register);
router.post('/login', validate(userValidation.login), login);

module.exports = router;

// Update for: feat(frontdoor): add landing page hero section and search bar
// Update for: chore(frontdoor): update frontend flow documentation and API specs
// Update for: feat(frontdoor): implement filter system and category chips