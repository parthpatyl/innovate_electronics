const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Event = require('../models/Event');
const Blog = require('../models/Blog');
const Newsletter = require('../models/Newsletter');

// GET /api/stats
router.get('/', async (req, res) => {
	try {
		const [products, events, blogs, newsletters] = await Promise.all([
			Product.countDocuments(),
			Event.countDocuments(),
			Blog.countDocuments(),
			Newsletter.countDocuments()
		]);

		return res.json({
			success: true,
			data: { products, events, blogs, newsletters }
		});
	} catch (error) {
		console.error('Stats error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
	}
});

module.exports = router; 