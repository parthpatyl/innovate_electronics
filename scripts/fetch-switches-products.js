#!/usr/bin/env node

/**
 * Node.js script to fetch all products individually from the switches category
 * Uses the endpoint: /api/products/category/switches/product/:ProductId
 * 
 * Usage: node scripts/fetch-switches-products.js [options]
 * Options:
 *   --base-url <url>     Base URL for the API (default: http://localhost:5000)
 *   --output <file>      Output file for JSON results (default: switches-products.json)
 *   --verbose            Enable verbose logging
 *   --delay <ms>         Delay between requests in milliseconds (default: 100)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    baseUrl: 'http://localhost:5000',
    outputFile: 'switches-products.json',
    verbose: false,
    delay: 100
};

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--base-url':
            options.baseUrl = args[++i];
            break;
        case '--output':
            options.outputFile = args[++i];
            break;
        case '--verbose':
            options.verbose = true;
            break;
        case '--delay':
            options.delay = parseInt(args[++i]) || 100;
            break;
        case '--help':
        case '-h':
            console.log(`
Usage: node scripts/fetch-switches-products.js [options]

Options:
  --base-url <url>     Base URL for the API (default: http://localhost:5000)
  --output <file>      Output file for JSON results (default: switches-products.json)
  --verbose            Enable verbose logging
  --delay <ms>         Delay between requests in milliseconds (default: 100)
  --help, -h           Show this help message

Examples:
  node scripts/fetch-switches-products.js
  node scripts/fetch-switches-products.js --base-url https://api.example.com
  node scripts/fetch-switches-products.js --output results.json --verbose
            `);
            process.exit(0);
    }
}

// Helper function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Switches-Products-Fetcher/1.0',
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON response: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });
        
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// Get all subcategories from the switches category
async function getSwitchesSubcategories() {
    const url = `${options.baseUrl}/api/products/category/switches/subcategories`;
    
    if (options.verbose) {
        console.log(`Fetching subcategories from: ${url}`);
    }
    
    try {
        const response = await makeRequest(url);
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch subcategories');
        }
        
        return response.data || [];
        
    } catch (error) {
        console.error('Error fetching subcategories:', error.message);
        throw error;
    }
}

// Fetch a single product by its subcategory ID
async function fetchSingleProduct(subcategory) {
    // Handle case sensitivity and formatting for the product ID
    // Convert to lowercase and replace spaces with underscores
    const processedSubcategory = subcategory.toLowerCase().replace(/\s+/g, '_');
    
    const url = `${options.baseUrl}/api/products/category/switches/product/${encodeURIComponent(processedSubcategory)}`;
    
    if (options.verbose) {
        console.log(`Fetching product: ${subcategory} (processed: ${processedSubcategory})`);
    }
    
    try {
        const response = await makeRequest(url);
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch product');
        }
        
        return response.data;
        
    } catch (error) {
        console.error(`Error fetching product ${subcategory}:`, error.message);
        throw error;
    }
}

// Fetch all products individually
async function fetchAllSwitchesProducts() {
    console.log('🚀 Starting to fetch all switches products individually...');
    console.log(`📡 API Base URL: ${options.baseUrl}`);
    console.log(`⏱️  Delay between requests: ${options.delay}ms`);
    console.log('');
    
    try {
        // Step 1: Get all subcategories
        console.log('📋 Step 1: Fetching subcategories...');
        const subcategories = await getSwitchesSubcategories();
        console.log(`✅ Found ${subcategories.length} subcategories`);
        
        if (subcategories.length === 0) {
            console.log('⚠️  No subcategories found in switches category');
            return {
                products: [],
                errors: [],
                summary: { total: 0, successful: 0, failed: 0 }
            };
        }
        
        // Step 2: Fetch each product individually
        console.log('\n📦 Step 2: Fetching products individually...');
        const products = [];
        const errors = [];
        
        for (let i = 0; i < subcategories.length; i++) {
            const subcategory = subcategories[i];
            
            try {
                console.log(`[${i + 1}/${subcategories.length}] Fetching: ${subcategory}`);
                
                const product = await fetchSingleProduct(subcategory);
                
                if (product) {
                    products.push({
                        id: subcategory,
                        ...product
                    });
                    console.log(`  ✅ Success: ${product.name || subcategory}`);
                } else {
                    errors.push({
                        id: subcategory,
                        error: 'Product not found'
                    });
                    console.log(`  ❌ Not found: ${subcategory}`);
                }
                
                // Add delay between requests
                if (i < subcategories.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, options.delay));
                }
                
            } catch (error) {
                errors.push({
                    id: subcategory,
                    error: error.message
                });
                console.log(`  ❌ Error: ${subcategory} - ${error.message}`);
            }
        }
        
        // Summary
        const summary = {
            total: subcategories.length,
            successful: products.length,
            failed: errors.length
        };
        
        console.log('\n📊 === FETCH SUMMARY ===');
        console.log(`Total subcategories: ${summary.total}`);
        console.log(`Successfully fetched: ${summary.successful}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Success rate: ${((summary.successful / summary.total) * 100).toFixed(2)}%`);
        
        if (errors.length > 0) {
            console.log('\n❌ Failed products:');
            errors.forEach(error => {
                console.log(`  - ${error.id}: ${error.error}`);
            });
        }
        
        return { products, errors, summary };
        
    } catch (error) {
        console.error('❌ Error fetching switches products:', error.message);
        throw error;
    }
}

// Save results to file
function saveResults(results) {
    try {
        const outputPath = path.resolve(options.outputFile);
        const data = JSON.stringify(results, null, 2);
        
        fs.writeFileSync(outputPath, data, 'utf8');
        
        console.log(`\n💾 Results saved to: ${outputPath}`);
        console.log(`📁 File size: ${(data.length / 1024).toFixed(2)} KB`);
        
    } catch (error) {
        console.error('❌ Error saving results:', error.message);
        throw error;
    }
}

// Display results summary
function displayResults(results) {
    const { products, errors, summary } = results;
    
    console.log('\n📋 === PRODUCTS DETAILS ===');
    
    if (products.length > 0) {
        products.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.name || product.id}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Category: ${product.category || 'switches'}`);
            
            if (product.tableSpecs) {
                console.log(`   Specifications: ${product.tableSpecs.specifications || 'N/A'}`);
                console.log(`   Performance: ${product.tableSpecs.performance || 'N/A'}`);
            }
            
            if (product.overview && product.overview.description) {
                console.log(`   Description: ${product.overview.description[0] || 'N/A'}`);
            }
        });
    } else {
        console.log('No products found.');
    }
}

// Main execution
async function main() {
    try {
        console.log('🔌 Switches Products Fetcher');
        console.log('============================\n');
        
        const startTime = Date.now();
        
        // Fetch all products
        const results = await fetchAllSwitchesProducts();
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`\n⏱️  Total execution time: ${duration.toFixed(2)} seconds`);
        
        // Save results
        saveResults(results);
        
        // Display results if verbose
        if (options.verbose) {
            displayResults(results);
        }
        
        console.log('\n✅ Fetch process completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Fetch process failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    fetchAllSwitchesProducts,
    getSwitchesSubcategories,
    fetchSingleProduct
}; 