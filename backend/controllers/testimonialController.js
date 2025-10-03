const Testimonial = require('../models/Testimonial');

// @desc    Get all testimonials
// @route   GET /api/testimonials
exports.getTestimonials = async (req, res) => {
    try {
        const query = {};
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        } else {
            // By default, only show published testimonials on public-facing queries
            if (!req.originalUrl.includes('status=all')) {
                query.status = 'published';
            }
        }

        const testimonials = await Testimonial.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
exports.getTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: 'Testimonial not found' });
        }
        res.json({ success: true, data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a testimonial
// @route   POST /api/testimonials
exports.createTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.create(req.body);
        res.status(201).json({ success: true, data: testimonial });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a testimonial
// @route   PUT /api/testimonials/:id
exports.updateTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!testimonial) {
            return res.status(404).json({ success: false, message: 'Testimonial not found' });
        }
        res.json({ success: true, data: testimonial });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
exports.deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: 'Testimonial not found' });
        }
        res.json({ success: true, message: 'Testimonial deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};