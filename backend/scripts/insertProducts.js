const mongoose = require('mongoose');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
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

// Function to transform the JSON data to match the Product schema
function transformProductsData(jsonData) {
  const products = [];
  
  // Iterate through categories
  for (const category of jsonData.categories) {
    // Iterate through subcategories
    for (const subcategory of category.subcategories) {
      // Iterate through products in each subcategory
      for (const product of subcategory.products) {
        // Create a product document that matches the Product schema
        const productDoc = {
          name: product.name,
          category: product.category || category.name,
          image: product.image,
          tableSpecs: product.tableSpecs || {},
          overview: product.overview || {
            description: [],
            features: [],
            applications: []
          },
          specifications: product.specifications || {
            electrical: [],
            mechanical: []
          },
          library: product.library || {
            catalogue: [],
            drawings: [],
            testReports: [],
            executionFiles: []
          }
        };
        
        // Add subcategory information as additional metadata
        if (subcategory.name && subcategory.name !== 'Default') {
          productDoc.subcategory = subcategory.name;
        }
        
        // Add model information if available
        if (product.model) {
          productDoc.model = product.model;
        }
        
        products.push(productDoc);
      }
    }
  }
  
  return products;
}

// Function to insert products into database
async function insertProducts() {
  try {
    // Read the JSON file
    const jsonFilePath = path.join(__dirname, '../../frontend/data/products.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Transform the data
    const products = transformProductsData(jsonData);
    console.log(`Found ${products.length} products to insert`);
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert the products
    const insertedProducts = await Product.insertMany(products);
    console.log(`Successfully inserted ${insertedProducts.length} products:`);
    
    // Group products by category for better reporting
    const productsByCategory = {};
    insertedProducts.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product.name);
    });
    
    Object.entries(productsByCategory).forEach(([category, productNames]) => {
      console.log(`- ${category}: ${productNames.length} products`);
      productNames.forEach(name => {
        console.log(`  * ${name}`);
      });
    });
    
  } catch (error) {
    console.error('Error inserting products:', error);
  }
}

// Main execution function
async function main() {
  await connectDB();
  await insertProducts();
  // Close the connection
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
} 