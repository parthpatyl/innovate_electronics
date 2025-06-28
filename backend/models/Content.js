const mongoose = require('mongoose');

/**
 * Content Schema for CMS
 * Supports blog posts, articles, and other content types
 */
const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    // Auto-generate slug from title if not provided
    default: function() {
      return this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  },
  body: {
    type: String,
    required: [true, 'Content body is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    required: true
  },
  // Optional fields for enhanced functionality
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  featuredImage: {
    type: String,
    trim: true
  },
  // SEO fields
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
contentSchema.index({ slug: 1 });
contentSchema.index({ status: 1 });
contentSchema.index({ author: 1 });
contentSchema.index({ createdAt: -1 });

// Virtual for formatted date
contentSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Pre-save middleware to ensure slug uniqueness
contentSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    // Generate slug from title if slug wasn't explicitly set
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Check for slug uniqueness
  const existingContent = await this.constructor.findOne({ 
    slug: this.slug,
    _id: { $ne: this._id } // Exclude current document
  });
  
  if (existingContent) {
    // Append timestamp to make slug unique
    this.slug = `${this.slug}-${Date.now()}`;
  }
  
  next();
});

// Static method to find published content
contentSchema.statics.findPublished = function() {
  return this.find({ status: 'published' }).sort({ createdAt: -1 });
};

// Instance method to publish content
contentSchema.methods.publish = function() {
  this.status = 'published';
  return this.save();
};

// Instance method to archive content
contentSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

module.exports = mongoose.model('Content', contentSchema); 