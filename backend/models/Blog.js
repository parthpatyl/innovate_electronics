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
        enum: ['draft', 'published'],
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
    },
    slug: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to generate slug from title
blogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

module.exports = mongoose.model('Blog', blogSchema);
