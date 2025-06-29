const mongoose = require('mongoose');

/**
 * Product Schema for dynamic nested product structure
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
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
  },
  // Dynamic products structure - can handle any category and subcategory
  products: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// Static method to get all products by category
productSchema.statics.getProductsByCategory = function(category) {
  return this.findOne({}, { [`products.${category}`]: 1 });
};

// Static method to get all products structure
productSchema.statics.getAllProducts = function() {
  return this.findOne({}, { products: 1 });
};

// Static method to get categories
productSchema.statics.getCategories = function() {
  return this.findOne({}, { products: 1 }).then(doc => {
    if (doc && doc.products) {
      return Object.keys(doc.products);
    }
    return [];
  });
};

// Static method to get subcategories within a category
productSchema.statics.getSubcategories = function(category) {
  return this.findOne({}, { [`products.${category}`]: 1 }).then(doc => {
    if (doc && doc.products && doc.products[category]) {
      return Object.keys(doc.products[category]);
    }
    return [];
  });
};

// Static method to get a specific product by category and subcategory
productSchema.statics.getProduct = function(category, subcategory) {
  return this.findOne({}, { [`products.${category}.${subcategory}`]: 1 }).then(doc => {
    if (doc && doc.products && doc.products[category] && doc.products[category][subcategory]) {
      return doc.products[category][subcategory];
    }
    return null;
  });
};

module.exports = mongoose.model('Product', productSchema); 