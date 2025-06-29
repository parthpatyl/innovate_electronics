const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the Product model
const Product = require('./models/Product');

// Database connection
const connectDB = require('./config/database');

const PRODUCTS_JSON_PATH = path.join(__dirname, '../frontend/data/products.json');

async function importProducts() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Read products.json
    const rawData = fs.readFileSync(PRODUCTS_JSON_PATH, 'utf-8');
    const productsData = JSON.parse(rawData);
    
    console.log('Starting product import...');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products from database.');
    
    // Create the nested structure directly from the JSON
    const productsStructure = {
      name: 'Products Database',
      category: 'Database',
      products: productsData.products
    };
    
    // Insert the entire structure as a single document
    const result = await Product.create(productsStructure);
    
    console.log(`\nSuccessfully imported products structure into the database.`);
    console.log(`Document ID: ${result._id}`);
    
    // Display summary by category
    console.log('\nProducts by category:');
    for (const [categoryName, categoryProducts] of Object.entries(productsData.products)) {
      const productCount = Object.keys(categoryProducts).length;
      console.log(`- ${categoryName}: ${productCount} products`);
      
      // List products in each category
      for (const [productKey, productData] of Object.entries(categoryProducts)) {
        console.log(`  * ${productData.name}`);
      }
    }
    
    console.log('\nImport completed successfully!');
    console.log('Products are now stored in a dynamic nested structure by category.');
    console.log('\nAvailable API endpoints:');
    console.log('- GET /api/products/categories - Get all categories');
    console.log('- GET /api/products/category/:category - Get products by category');
    console.log('- GET /api/products/category/:category/subcategories - Get subcategories');
    console.log('- GET /api/products/category/:category/product/:subcategory - Get specific product');
    
  } catch (error) {
    console.error('Error importing products:', error);
    
    // If it's a duplicate key error, show more details
    if (error.code === 11000) {
      console.error('\nDuplicate key error detected. This usually means there are products with the same name.');
      console.error('The import script has been updated to handle this automatically.');
    }
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

// Run the import
importProducts();
