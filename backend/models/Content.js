const mongoose = require('mongoose');

// Blog/Content Schema
const contentSchema = new mongoose.Schema({
  // Core fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    trim: true
  },
  body: {
    type: String,
    required: [true, 'Content body is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  type: {
    type: String,
    enum: ['blog', 'article', 'newsletter', 'other'],
    default: 'article',
    required: true
  },

  // Author & status
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    required: true
  },

  // Optional fields
  excerpt: {
    type: String,
    trim: true
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
  // Always generate slug from title
  let baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  let slug = baseSlug;
  let counter = 0;
  // Check for slug uniqueness and append timestamp if needed
  while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
    counter++;
    slug = `${baseSlug}-${Date.now()}${counter > 1 ? '-' + counter : ''}`;
  }
  this.slug = slug;
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