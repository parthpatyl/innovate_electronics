const mongoose = require('mongoose');

/**
 * Category Schema for product categories
 */
const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Category title is required'],
    trim: true,
    unique: true // Ensures no duplicate category titles
  },
  headerImage: {
    type: String,
    trim: true // Path or URL to header image
  },
  items: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      trim: true // Optional item image
    },
    subproducts: [{
      type: String,
      trim: true // List of subproduct names, could be IDs in future
    }]
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true }, // Allows virtuals in JSON output
  toObject: { virtuals: true }
});

/**
 * Index to optimize query performance on title field
 */
categorySchema.index({ title: 1 });

/**
 * Virtual: Returns the count of items in the category
 */
categorySchema.virtual('itemCount').get(function () {
  return this.items ? this.items.length : 0;
});

module.exports = mongoose.model('Category', categorySchema);
