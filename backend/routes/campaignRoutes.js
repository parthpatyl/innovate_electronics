const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { auth, requireRole } = require('../middleware/auth');
const { validateCampaign } = require('../middleware/validation');

// All routes require authentication
router.use(auth);
router.use(requireRole(['admin', 'super_admin']));

// Campaign CRUD operations
router.post('/', validateCampaign, campaignController.createCampaign);
router.get('/', campaignController.getCampaigns);
router.get('/stats', campaignController.getCampaignStats);
router.get('/:id', campaignController.getCampaign);
router.put('/:id', validateCampaign, campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Send campaign
router.post('/:id/send', campaignController.sendCampaign);

module.exports = router; 