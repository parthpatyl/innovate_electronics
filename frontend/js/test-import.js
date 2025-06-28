/**
 * Test script to verify JSON database import
 * Run this in the browser console to test the data loading
 */

async function testDataImport() {
    console.log('🧪 Testing JSON Database Import...');
    
    try {
        // Test 1: Load data manager
        console.log('\n📋 Test 1: Loading Data Manager...');
        if (typeof window.dataManager === 'undefined') {
            console.error('❌ Data Manager not found. Make sure data-manager.js is loaded.');
            return;
        }
        console.log('✅ Data Manager loaded successfully');
        
        // Test 2: Load all data
        console.log('\n📊 Test 2: Loading Categories and Products...');
        const data = await window.dataManager.loadAllData();
        console.log('✅ All data loaded successfully');
        console.log(`📁 Categories: ${data.categories.length}`);
        console.log(`📦 Product Categories: ${Object.keys(data.products).length}`);
        
        // Test 3: Validate data structure
        console.log('\n🔍 Test 3: Validating Data Structure...');
        const validation = window.dataManager.validateData();
        if (validation.valid) {
            console.log('✅ Data structure is valid');
        } else {
            console.error('❌ Data structure has errors:', validation.errors);
        }
        if (validation.warnings.length > 0) {
            console.warn('⚠️ Data has warnings:', validation.warnings);
        }
        
        // Test 4: Test category access
        console.log('\n📂 Test 4: Testing Category Access...');
        const categories = window.dataManager.getCategories();
        categories.forEach((category, index) => {
            console.log(`  ${index + 1}. ${category.title} (${category.items.length} items)`);
        });
        
        // Test 5: Test product access
        console.log('\n🛍️ Test 5: Testing Product Access...');
        const productCategories = Object.keys(data.products);
        productCategories.forEach(category => {
            const products = window.dataManager.getProductsByCategory(category);
            console.log(`  ${category}: ${products.length} products`);
        });
        
        // Test 6: Test search functionality
        console.log('\n🔎 Test 6: Testing Search Functionality...');
        const searchResults = window.dataManager.searchProducts('switch');
        console.log(`  Found ${searchResults.length} products matching "switch"`);
        
        // Test 7: Test specific product access
        console.log('\n🎯 Test 7: Testing Specific Product Access...');
        const firstCategory = productCategories[0];
        const firstProduct = window.dataManager.getProductsByCategory(firstCategory)[0];
        if (firstProduct) {
            const specificProduct = window.dataManager.getProductById(firstProduct.id);
            console.log(`  Retrieved product: ${specificProduct.name}`);
        }
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`  - Categories: ${categories.length}`);
        console.log(`  - Product Categories: ${productCategories.length}`);
        console.log(`  - Total Products: ${Object.values(data.products).reduce((sum, cat) => sum + Object.keys(cat).length, 0)}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Test individual JSON files
async function testIndividualFiles() {
    console.log('\n🔧 Testing Individual JSON Files...');
    
    try {
        // Test categories.json
        console.log('\n📁 Testing categories.json...');
        const categoriesResponse = await fetch('data/categories.json');
        const categoriesData = await categoriesResponse.json();
        console.log(`✅ categories.json loaded: ${categoriesData.categories.length} categories`);
        
        // Test products.json
        console.log('\n📦 Testing products.json...');
        const productsResponse = await fetch('data/products.json');
        const productsData = await productsResponse.json();
        const productCount = Object.values(productsData.products).reduce((sum, cat) => sum + Object.keys(cat).length, 0);
        console.log(`✅ products.json loaded: ${Object.keys(productsData.products).length} categories, ${productCount} products`);
        
    } catch (error) {
        console.error('❌ Individual file test failed:', error);
    }
}

// Export functions for manual testing
window.testDataImport = testDataImport;
window.testIndividualFiles = testIndividualFiles;

// Auto-run tests if this script is loaded directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testDataImport, 1000); // Wait for other scripts to load
    });
} else {
    setTimeout(testDataImport, 1000);
}

console.log('🧪 Test script loaded. Run testDataImport() or testIndividualFiles() to test the JSON databases.'); 