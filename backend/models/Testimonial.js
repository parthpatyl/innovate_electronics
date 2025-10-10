const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true
    },
    title: { // e.g., "Senior Technology Lead"
        type: String,
        trim: true
    },
    text: {
        type: String,
        required: [true, 'Testimonial text is required']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Rating is required']
    },
    image: { // URL to the image
        type: String
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);

