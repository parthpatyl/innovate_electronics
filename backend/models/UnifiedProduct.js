const mongoose = require('mongoose');

/**
 * UnifiedProduct Schema
 * This schema combines category and product information into a single document.
 * Each document represents a "main category" (like "RF and Microwave") and contains
 * an array of its products. This denormalized structure is optimized for read-heavy
 * operations, such as populating the frontend, by reducing the need for database joins/lookups.
 */
const UnifiedProductSchema = new mongoose.Schema({
  // Fields from the old Category model
  title: {
    type: String,
    required: [true, 'Category title is required'],
    trim: true,
    unique: true
  },
  headerImage: {
    type: String,
    trim: true
  },
  // This array represents the subcategories within the main category.
  items: [{
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true
    },
    // Array of products within this subcategory
    products: [{
      name: { type: String, required: true, trim: true },
      image: { type: String, trim: true },
      tableSpecs: {
        specifications: String,
        performance: String,
        outputLevel: String,
        additionalFeatures: String
      },
      overview: {
        body: [String],
        features: [String],
        applications: [String]
      },
      specifications: {
        electrical: [{ parameter: String, specification: String }],
        mechanical: [{ item: String, body: String }]
      },
      library: {
        catalogue: [{ name: String, link: String }],
        drawings: [{ name: String, link: String }],
        testReports: [{ name: String, link: String }],
        executionFiles: [{ name: String, link: String }]
      }
    }]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
// Index for efficient category title lookups
UnifiedProductSchema.index({ title: 1 });

// Index to support searching for products within a category
UnifiedProductSchema.index({ "items.products.name": 'text', "items.name": 'text' });

/**
 * Virtual: Returns the count of products in the category
 */
UnifiedProductSchema.virtual('productCount').get(function () {
  return this.products ? this.products.length : 0;
});
module.exports = mongoose.model('UnifiedProduct', UnifiedProductSchema);