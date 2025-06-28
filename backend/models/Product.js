const mongoose = require('mongoose');

/**
 * Product Schema for product details
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  tableSpecs: {
    specifications: String,
    performance: String,
    outputLevel: String,
    additionalFeatures: String
  },
  overview: {
    description: [String],
    features: [String],
    applications: [String]
  },
  specifications: {
    electrical: [{
      parameter: String,
      specification: String
    }],
    mechanical: [{
      item: String,
      description: String
    }]
  },
  library: {
    catalogue: [{
      name: String,
      link: String
    }],
    drawings: [{
      name: String,
      link: String
    }],
    testReports: [{
      name: String,
      link: String
    }],
    executionFiles: [{
      name: String,
      link: String
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', category: 'text' });

// Virtual for formatted creation date
productSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category: category }).sort({ name: 1 });
};

// Static method to search products
productSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query }
  }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Product', productSchema); 