const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// User validation rules
const userValidation = {
  register: [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required')
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ]
};

// Event validation rules
const eventValidation = {
  create: [
    body('title').notEmpty().withMessage('Event title is required'),
    body('description').notEmpty().withMessage('Event description is required'),
    body('category_id').notEmpty().withMessage('Category is required'),
    body('start_datetime').isISO8601().withMessage('Valid start date is required'),
    body('end_datetime').isISO8601().withMessage('Valid end date is required'),
    body('city').notEmpty().withMessage('City is required')
  ]
};

module.exports = { validate, userValidation, eventValidation };
