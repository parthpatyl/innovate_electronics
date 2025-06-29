const mongoose = require('mongoose');
require('dotenv').config();

// Import the Product model
const Product = require('./models/Product');

// Database connection
const connectDB = require('./config/database');

async function removeDuplicates() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('Starting duplicate removal process...');
    
    // Get all products documents
    const allProducts = await Product.find({});
    console.log(`Found ${allProducts.length} product documents in database.`);
    
    if (allProducts.length === 0) {
      console.log('No products found in database.');
      return;
    }
    
    // If there's only one document, no duplicates to remove
    if (allProducts.length === 1) {
      console.log('Only one product document found. No duplicates to remove.');
      return;
    }
    
    // Find the most recent document (based on _id or createdAt)
    const sortedProducts = allProducts.sort((a, b) => {
      // Sort by creation date if available, otherwise by _id
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return b._id.toString().localeCompare(a._id.toString());
    });
    
    const latestProduct = sortedProducts[0];
    const duplicatesToRemove = sortedProducts.slice(1);
    
    console.log(`\nKeeping the most recent document: ${latestProduct._id}`);
    console.log(`Found ${duplicatesToRemove.length} duplicate documents to remove.`);
    
    // Show details of duplicates
    duplicatesToRemove.forEach((dup, index) => {
      console.log(`Duplicate ${index + 1}: ${dup._id} (created: ${dup.createdAt || 'unknown'})`);
    });
    
    // Remove duplicates
    const duplicateIds = duplicatesToRemove.map(doc => doc._id);
    const deleteResult = await Product.deleteMany({ _id: { $in: duplicateIds } });
    
    console.log(`\nSuccessfully removed ${deleteResult.deletedCount} duplicate documents.`);
    
    // Verify the result
    const remainingProducts = await Product.find({});
    console.log(`\nRemaining documents in database: ${remainingProducts.length}`);
    
    if (remainingProducts.length === 1) {
      console.log('✅ Duplicate removal completed successfully!');
      
      // Show summary of the remaining document
      const remaining = remainingProducts[0];
      console.log(`\nRemaining document details:`);
      console.log(`- ID: ${remaining._id}`);
      console.log(`- Name: ${remaining.name}`);
      console.log(`- Category: ${remaining.category}`);
      console.log(`- Created: ${remaining.createdAt}`);
      console.log(`- Updated: ${remaining.updatedAt}`);
      
      // Show categories in the remaining document
      if (remaining.products) {
        console.log(`\nCategories in database:`);
        Object.keys(remaining.products).forEach(category => {
          const productCount = Object.keys(remaining.products[category]).length;
          console.log(`- ${category}: ${productCount} products`);
        });
      }
    } else {
      console.log('⚠️  Warning: Multiple documents still exist after duplicate removal.');
    }
    
  } catch (error) {
    console.error('Error removing duplicates:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

// Function to check for duplicate products within categories
async function checkForDuplicateProducts() {
  try {
    await connectDB();
    
    console.log('\nChecking for duplicate products within categories...');
    
    const products = await Product.findOne({});
    if (!products || !products.products) {
      console.log('No products found to check.');
      return;
    }
    
    let totalDuplicates = 0;
    
    Object.entries(products.products).forEach(([category, categoryProducts]) => {
      const productNames = Object.values(categoryProducts).map(product => product.name ? product.name.trim().toLowerCase() : '');
      const uniqueNames = [...new Set(productNames)];
      const duplicates = productNames.length - uniqueNames.length;
      
      if (duplicates > 0) {
        console.log(`⚠️  Category "${category}" has ${duplicates} duplicate product names (case-insensitive).`);
        totalDuplicates += duplicates;
        
        // Find and show duplicate names
        const nameCounts = {};
        productNames.forEach(name => {
          nameCounts[name] = (nameCounts[name] || 0) + 1;
        });
        
        Object.entries(nameCounts).forEach(([name, count]) => {
          if (count > 1) {
            console.log(`   - "${name}" appears ${count} times`);
          }
        });
      }
    });
    
    if (totalDuplicates === 0) {
      console.log('✅ No duplicate product names found within categories.');
    } else {
      console.log(`\nTotal duplicate product names found: ${totalDuplicates}`);
    }
    
  } catch (error) {
    console.error('Error checking for duplicate products:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Function to remove duplicate product names within categories
async function removeDuplicateProductNames() {
  try {
    await connectDB();
    
    console.log('\nRemoving duplicate product names within categories...');
    
    const products = await Product.findOne({});
    if (!products || !products.products) {
      console.log('No products found to process.');
      return;
    }
    
    let totalRemoved = 0;
    const cleanedProducts = {};
    
    Object.entries(products.products).forEach(([category, categoryProducts]) => {
      const seenNames = new Set();
      const cleanedCategoryProducts = {};
      
      Object.entries(categoryProducts).forEach(([key, product]) => {
        const normalized = product.name ? product.name.trim().toLowerCase() : '';
        if (product.name && !seenNames.has(normalized)) {
          seenNames.add(normalized);
          cleanedCategoryProducts[key] = product;
        } else {
          console.log(`Removing duplicate (case-insensitive): "${product.name}" in category "${category}"`);
          totalRemoved++;
        }
      });
      
      cleanedProducts[category] = cleanedCategoryProducts;
    });
    
    if (totalRemoved > 0) {
      // Update the database with cleaned products
      await Product.updateOne(
        { _id: products._id },
        { products: cleanedProducts }
      );
      
      console.log(`\n✅ Successfully removed ${totalRemoved} duplicate product names.`);
    } else {
      console.log('\n✅ No duplicate product names found to remove.');
    }
    
  } catch (error) {
    console.error('Error removing duplicate product names:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'check':
    checkForDuplicateProducts();
    break;
  case 'remove-names':
    removeDuplicateProductNames();
    break;
  default:
    removeDuplicates();
    break;
} 