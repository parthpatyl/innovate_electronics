const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');

// List newsletters
router.get('/', async (req, res) => {
	try {
		const newsletters = await Newsletter.find()
			.sort({ createdAt: -1 })
			.populate('sentBy', 'name email');
		res.json({ success: true, data: newsletters });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// Get a single newsletter
router.get('/:id', async (req, res) => {
	try {
		const newsletter = await Newsletter.findById(req.params.id)
			.populate('sentBy', 'name email');
		if (!newsletter) {
			return res.status(404).json({ success: false, message: 'Newsletter not found' });
		}
		res.json({ success: true, data: newsletter });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// Create newsletter (force all-subscribers audience)
router.post('/', async (req, res) => {
	try {
		const payload = {
			subject: req.body.subject,
			body: req.body.body,
			htmlBody: req.body.htmlBody,
			status: req.body.status || 'draft',
			audience: 'all-subscribers',
			recipients: [],
			sentBy: (req.user && req.user.id) ? req.user.id : null,
			imageData: req.body.imageData || ''
		};
		const newsletter = new Newsletter(payload);
		await newsletter.save();
		res.status(201).json({ success: true, data: newsletter });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
});

// Update newsletter (ignore audience/recipients)
router.put('/:id', async (req, res) => {
	try {
		const newsletter = await Newsletter.findById(req.params.id);
		if (!newsletter) {
			return res.status(404).json({ success: false, message: 'Newsletter not found' });
		}

		newsletter.subject = req.body.subject ?? newsletter.subject;
		newsletter.body = req.body.body ?? newsletter.body;
		newsletter.htmlBody = req.body.htmlBody ?? newsletter.htmlBody;
		newsletter.status = req.body.status ?? newsletter.status;
		newsletter.audience = 'all-subscribers';
		newsletter.recipients = [];
		if (req.body.imageData) newsletter.imageData = req.body.imageData;

		await newsletter.save();
		res.json({ success: true, data: newsletter });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
});

// Delete newsletter
router.delete('/:id', async (req, res) => {
	try {
		const newsletter = await Newsletter.findById(req.params.id);
		if (!newsletter) {
			return res.status(404).json({ success: false, message: 'Newsletter not found' });
		}
		await newsletter.deleteOne();
		res.json({ success: true, message: 'Newsletter deleted successfully' });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// Send newsletter to all active subscribers
router.post('/:id/send', async (req, res) => {
	try {
		const newsletter = await Newsletter.findById(req.params.id);
		if (!newsletter) {
			return res.status(404).json({ success: false, message: 'Newsletter not found' });
		}

		const Subscriber = require('../models/Subscriber');
		const emailService = require('../services/emailService');

		const recipients = await Subscriber.find({ isActive: true }).select('email unsubscribeToken');
		if (recipients.length === 0) {
			return res.status(400).json({ success: false, message: 'No active subscribers to send to' });
		}

		const results = await emailService.sendBulkEmails(recipients, newsletter.subject, newsletter.htmlBody);
		const sent = results.filter(r => r.success).length;
		const failed = results.length - sent;

		newsletter.status = 'published';
		await newsletter.save();

		return res.json({ success: true, message: `Sent to all subscribers. ${sent} succeeded, ${failed} failed.`, data: { sent, failed, total: results.length } });
	} catch (error) {
		console.error('Newsletter send error:', error);
		return res.status(500).json({ success: false, message: 'Failed to send newsletter' });
	}
});

module.exports = router;
