const express = require('express');
const router = express.Router();
const Campaign = require('../models/Newsletter');

// Get all campaigns
router.get('/', async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .sort({ createdAt: -1 })
            .populate('sentBy', 'name email');
        res.json({ success: true, data: campaigns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get a single campaign
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('sentBy', 'name email');
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        res.json({ success: true, data: campaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a new campaign
router.post('/', async (req, res) => {
    try {
        const campaign = new Campaign({
            ...req.body,
            sentBy: req.user.id,
            status: 'draft'
        });
        await campaign.save();
        res.status(201).json({ success: true, data: campaign });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Update a campaign
router.put('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        // Only allow updates to draft campaigns
        if (campaign.status !== 'draft') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot update a campaign that has already been sent or is in progress' 
            });
        }

        Object.assign(campaign, req.body);
        await campaign.save();
        res.json({ success: true, data: campaign });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        // Only allow deletion of draft campaigns
        if (campaign.status !== 'draft') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete a campaign that has already been sent or is in progress' 
            });
        }

        await campaign.remove();
        res.json({ success: true, message: 'Campaign deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Schedule a campaign
router.post('/:id/schedule', async (req, res) => {
    try {
        const { scheduledFor } = req.body;
        if (!scheduledFor) {
            return res.status(400).json({ success: false, message: 'Scheduled date is required' });
        }

        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        if (campaign.status !== 'draft') {
            return res.status(400).json({ 
                success: false, 
                message: 'Can only schedule draft campaigns' 
            });
        }

        campaign.scheduledFor = new Date(scheduledFor);
        await campaign.save();
        res.json({ success: true, data: campaign });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Send a campaign immediately
router.post('/:id/send', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        if (campaign.status !== 'draft') {
            return res.status(400).json({ 
                success: false, 
                message: 'Can only send draft campaigns' 
            });
        }

        // Update campaign status to sending
        campaign.status = 'sending';
        campaign.sentAt = new Date();
        await campaign.save();

        // Here you would typically trigger your email sending service
        // This would be handled by a separate service/worker
        // For now, we'll just return success
        
        res.json({ 
            success: true, 
            message: 'Campaign sending has been initiated',
            data: campaign 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get campaign statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        const stats = {
            recipientCount: campaign.recipientCount,
            sentCount: campaign.sentCount,
            failedCount: campaign.failedCount,
            successRate: campaign.successRate,
            status: campaign.status,
            scheduledFor: campaign.scheduledFor,
            sentAt: campaign.sentAt
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
