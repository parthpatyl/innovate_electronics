const mongoose = require('mongoose');
const Category = require('../models/Category');
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

// Function to transform the JSON data to match the Category schema
function transformCategoriesData(jsonData) {
  const categories = [];
  for (const [key, categoryData] of Object.entries(jsonData.Products)) {
    const category = {
      title: categoryData.title || key,
      headerImage: categoryData.headerImage || '',
      items: categoryData.items || []
    };
    categories.push(category);
  }
  return categories;
}

// Function to insert categories into database
async function insertCategories() {
  try {
    // Read the JSON file
    const jsonFilePath = path.join(__dirname, '../../frontend/data/categories.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    // Transform the data
    const categories = transformCategoriesData(jsonData);
    console.log(`Found ${categories.length} categories to insert`);
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    // Insert the categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`Successfully inserted ${insertedCategories.length} categories:`);
    insertedCategories.forEach(cat => {
      console.log(`- ${cat.title} (${cat.items.length} items)`);
    });
  } catch (error) {
    console.error('Error inserting categories:', error);
  }
}

// Main execution function
async function main() {
  await connectDB();
  await insertCategories();
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