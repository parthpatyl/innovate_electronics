const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

const validateNewsletterSubscription = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('preferences.categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('preferences.categories.*')
    .optional()
    .isIn(['electronics', 'tech-news', 'promotions', 'events', 'blog'])
    .withMessage('Invalid category'),
  body('preferences.frequency')
    .optional()
    .isIn(['weekly', 'monthly', 'quarterly'])
    .withMessage('Invalid frequency'),
  handleValidationErrors
];

const validateCampaign = [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and cannot exceed 200 characters'),
  body('htmlBody')
    .trim()
    .isLength({ min: 1 })
    .withMessage('HTML body is required'),
  body('targetAudience')
    .optional()
    .isIn(['all', 'specific', 'filtered'])
    .withMessage('Invalid target audience'),
  body('specificEmails')
    .optional()
    .isArray()
    .withMessage('Specific emails must be an array'),
  body('specificEmails.*')
    .optional()
    .isEmail()
    .withMessage('Invalid email in specific emails list'),
  body('scheduledFor')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for scheduled time'),
  handleValidationErrors
];

const validateAdminLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateAdminRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'super_admin'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

module.exports = {
  validateNewsletterSubscription,
  validateCampaign,
  validateAdminLogin,
  validateAdminRegistration,
  handleValidationErrors
}; 