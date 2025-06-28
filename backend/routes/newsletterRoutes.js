const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { auth, requireRole } = require('../middleware/auth');
const { validateNewsletterSubscription } = require('../middleware/validation');

// Public routes
router.post('/subscribe', validateNewsletterSubscription, newsletterController.subscribe);
router.get('/unsubscribe', newsletterController.unsubscribe);

// Protected admin routes
router.get('/subscribers', auth, requireRole(['admin', 'super_admin']), newsletterController.getSubscribers);
router.get('/stats', auth, requireRole(['admin', 'super_admin']), newsletterController.getStats);
router.delete('/subscribers/:id', auth, requireRole(['admin', 'super_admin']), newsletterController.deleteSubscriber);

module.exports = router; 