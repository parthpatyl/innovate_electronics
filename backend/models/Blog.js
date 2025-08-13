const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    body: {
        type: String,
        required: [true, 'Body content is required']
    },
    author: {
        type: String,
        required: [true, 'Author is required']
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    excerpt: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    featuredImage: {
        type: String
    },
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);
