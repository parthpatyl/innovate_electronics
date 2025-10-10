const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// MongoDB connection string - use the same logic as database.js
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/innovateelectronics';

// Function to connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Function to verify products in database
async function verifyProducts() {
  try {
    const products = await Product.find({});
    console.log(`\nFound ${products.length} products in database:`);
    
    // Group products by category
    const productsByCategory = {};
    products.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });
    
    Object.entries(productsByCategory).forEach(([category, categoryProducts]) => {
      console.log(`\n${category} (${categoryProducts.length} products):`);
      categoryProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        
        // Check if product has a model field (not the mongoose model function)
        const productModel = product.get('model');
        if (productModel) {
          console.log(`     Model: ${productModel}`);
        }
        
        if (product.subcategory) {
          console.log(`     Subcategory: ${product.subcategory}`);
        }
        console.log(`     Image: ${product.image}`);
        
        // Show some specifications if available
        if (product.specifications && product.specifications.electrical && product.specifications.electrical.length > 0) {
          const firstSpec = product.specifications.electrical[0];
          console.log(`     Key Spec: ${firstSpec.parameter}: ${firstSpec.specification}`);
        }
        
        // Show library items count
        if (product.library) {
          const totalLibraryItems = (product.library.catalogue?.length || 0) + 
                                   (product.library.drawings?.length || 0) + 
                                   (product.library.testReports?.length || 0) + 
                                   (product.library.executionFiles?.length || 0);
          console.log(`     Library Items: ${totalLibraryItems}`);
        }
      });
    });
    
    console.log(`\nTotal products: ${products.length}`);
    console.log(`Total categories: ${Object.keys(productsByCategory).length}`);
    
  } catch (error) {
    console.error('Error verifying products:', error);
  }
}

// Main execution function
async function main() {
  await connectDB();
  await verifyProducts();
  // Close the connection
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
  process.exit(0);
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
} 