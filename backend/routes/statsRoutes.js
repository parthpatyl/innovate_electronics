const express = require('express');
const router = express.Router();

const UnifiedProduct = require('../models/UnifiedProduct');
const Event = require('../models/Event');
const Blog = require('../models/Blog');
const Newsletter = require('../models/Newsletter');
const Testimonial = require('../models/Testimonial');

// GET /api/stats
router.get('/', async (req, res) => {
	try {
		// Since products are nested, we need to use an aggregation pipeline to count them.
		const productCountResult = await UnifiedProduct.aggregate([
			{ $unwind: '$items' }, // Deconstruct the items (subcategories) array
			{ $project: { productCount: { $size: '$items.products' } } }, // Get the size of the products array for each subcategory
			{ $group: { _id: null, totalProducts: { $sum: '$productCount' } } } // Sum up all the counts
		]);

		const products = productCountResult.length > 0 ? productCountResult[0].totalProducts : 0;

		// Get counts for other models
		const [events, blogs, newsletters, testimonials] = await Promise.all([
			Event.countDocuments(),
			Blog.countDocuments(),
			Newsletter.countDocuments(),
			Testimonial.countDocuments()
		]);

		return res.json({
			success: true,
			data: { products, events, blogs, newsletters, testimonials }
		});
	} catch (error) {
		console.error('Stats error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
	}
});

module.exports = router; 