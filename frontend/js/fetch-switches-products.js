/**
 * Script to fetch all products individually from the switches category
 * Uses the endpoint: /api/products/category/switches/product/:ProductId
 */

// Import configuration
if (typeof API_CONFIG === 'undefined') {
    console.error('API_CONFIG not found. Make sure config.js is loaded before this script.');
}

/**
 * Main function to fetch all switches products individually
 */
async function fetchAllSwitchesProducts() {
    console.log('Starting to fetch all switches products individually...');
    
    try {
        // Step 1: Get all subcategories (product IDs) from the switches category
        const subcategories = await getSwitchesSubcategories();
        console.log('Found subcategories:', subcategories);
        
        if (!subcategories || subcategories.length === 0) {
            console.log('No subcategories found in switches category');
            return [];
        }
        
        // Step 2: Fetch each product individually
        const products = await fetchProductsIndividually(subcategories);
        
        console.log('Successfully fetched all products:', products);
        return products;
        
    } catch (error) {
        console.error('Error fetching switches products:', error);
        throw error;
    }
}

/**
 * Get all subcategories (product IDs) from the switches category
 */
async function getSwitchesSubcategories() {
    try {
        const url = getApiUrl(`${API_CONFIG.ENDPOINTS.SUBCATEGORIES}/switches/subcategories`);
        console.log('Fetching subcategories from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch subcategories');
        }
        
        return data.data || [];
        
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        throw error;
    }
}

/**
 * Fetch products individually using the specific product endpoint
 */
async function fetchProductsIndividually(subcategories) {
    const products = [];
    const errors = [];
    
    console.log(`Fetching ${subcategories.length} products individually...`);
    
    // Process products with a delay to avoid overwhelming the server
    for (let i = 0; i < subcategories.length; i++) {
        const subcategory = subcategories[i];
        
        try {
            console.log(`Fetching product ${i + 1}/${subcategories.length}: ${subcategory}`);
            
            const product = await fetchSingleProduct(subcategory);
            
            if (product) {
                products.push({
                    id: subcategory,
                    ...product
                });
                console.log(`✓ Successfully fetched: ${product.name || subcategory}`);
            } else {
                errors.push({
                    id: subcategory,
                    error: 'Product not found'
                });
                console.log(`✗ Product not found: ${subcategory}`);
            }
            
            // Add a small delay between requests to be respectful to the server
            if (i < subcategories.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
        } catch (error) {
            errors.push({
                id: subcategory,
                error: error.message
            });
            console.error(`✗ Error fetching ${subcategory}:`, error.message);
        }
    }
    
    // Log summary
    console.log(`\n=== FETCH SUMMARY ===`);
    console.log(`Total subcategories: ${subcategories.length}`);
    console.log(`Successfully fetched: ${products.length}`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('Failed products:', errors);
    }
    
    return {
        products,
        errors,
        summary: {
            total: subcategories.length,
            successful: products.length,
            failed: errors.length
        }
    };
}

/**
 * Fetch a single product by its subcategory ID
 */
async function fetchSingleProduct(subcategory) {
    try {
        // Handle case sensitivity and formatting for the product ID
        // Convert to lowercase and replace spaces with underscores
        const processedSubcategory = subcategory.toLowerCase().replace(/\s+/g, '_');
        
        const url = getApiUrl(`${API_CONFIG.ENDPOINTS.SPECIFIC_PRODUCT}/switches/product/${encodeURIComponent(processedSubcategory)}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch product');
        }
        
        return data.data;
        
    } catch (error) {
        console.error(`Error fetching product ${subcategory}:`, error);
        throw error;
    }
}

/**
 * Display products in a formatted way
 */
function displayProducts(productsData) {
    const { products, errors, summary } = productsData;
    
    console.log('\n=== PRODUCTS DETAILS ===');
    
    products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name || product.id}`);
        console.log(`   Category: ${product.category || 'switches'}`);
        console.log(`   ID: ${product.id}`);
        
        if (product.tableSpecs) {
            console.log(`   Specifications: ${product.tableSpecs.specifications || 'N/A'}`);
            console.log(`   Performance: ${product.tableSpecs.performance || 'N/A'}`);
        }
        
        if (product.overview && product.overview.description) {
            console.log(`   Description: ${product.overview.description[0] || 'N/A'}`);
        }
    });
    
    if (errors.length > 0) {
        console.log('\n=== ERRORS ===');
        errors.forEach(error => {
            console.log(`- ${error.id}: ${error.error}`);
        });
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total: ${summary.total}`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Success Rate: ${((summary.successful / summary.total) * 100).toFixed(2)}%`);
}

/**
 * Export products data to JSON file (for browser download)
 */
function exportToJSON(productsData) {
    const dataStr = JSON.stringify(productsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `switches-products-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('Products data exported to JSON file');
}

/**
 * Create a simple HTML report
 */
function createHTMLReport(productsData) {
    const { products, errors, summary } = productsData;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Switches Products Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .product { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
                .product h3 { margin-top: 0; color: #333; }
                .error { background: #ffe6e6; border: 1px solid #ff9999; padding: 10px; margin: 5px 0; border-radius: 3px; }
                .success { color: green; }
                .failed { color: red; }
            </style>
        </head>
        <body>
            <h1>Switches Products Report</h1>
            
            <div class="summary">
                <h2>Summary</h2>
                <p><strong>Total Products:</strong> ${summary.total}</p>
                <p><strong>Successfully Fetched:</strong> <span class="success">${summary.successful}</span></p>
                <p><strong>Failed:</strong> <span class="failed">${summary.failed}</span></p>
                <p><strong>Success Rate:</strong> ${((summary.successful / summary.total) * 100).toFixed(2)}%</p>
            </div>
            
            <h2>Products (${products.length})</h2>
            ${products.map(product => `
                <div class="product">
                    <h3>${product.name || product.id}</h3>
                    <p><strong>ID:</strong> ${product.id}</p>
                    <p><strong>Category:</strong> ${product.category || 'switches'}</p>
                    ${product.tableSpecs ? `
                        <p><strong>Specifications:</strong> ${product.tableSpecs.specifications || 'N/A'}</p>
                        <p><strong>Performance:</strong> ${product.tableSpecs.performance || 'N/A'}</p>
                    ` : ''}
                    ${product.overview && product.overview.description ? `
                        <p><strong>Description:</strong> ${product.overview.description[0] || 'N/A'}</p>
                    ` : ''}
                </div>
            `).join('')}
            
            ${errors.length > 0 ? `
                <h2>Errors (${errors.length})</h2>
                ${errors.map(error => `
                    <div class="error">
                        <strong>${error.id}:</strong> ${error.error}
                    </div>
                `).join('')}
            ` : ''}
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `switches-products-report-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    console.log('HTML report generated and downloaded');
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('=== SWITCHES PRODUCTS FETCHER ===');
        console.log('Starting fetch process...\n');
        
        const productsData = await fetchAllSwitchesProducts();
        
        // Display results
        displayProducts(productsData);
        
        // Export options
        console.log('\n=== EXPORT OPTIONS ===');
        console.log('To export data, call:');
        console.log('- exportToJSON(productsData) - for JSON export');
        console.log('- createHTMLReport(productsData) - for HTML report');
        
        // Store in global scope for easy access
        window.switchesProductsData = productsData;
        
        return productsData;
        
    } catch (error) {
        console.error('Main execution failed:', error);
        throw error;
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchAllSwitchesProducts,
        getSwitchesSubcategories,
        fetchProductsIndividually,
        fetchSingleProduct,
        displayProducts,
        exportToJSON,
        createHTMLReport,
        main
    };
} else {
    // Browser environment - make functions globally available
    window.fetchAllSwitchesProducts = fetchAllSwitchesProducts;
    window.getSwitchesSubcategories = getSwitchesSubcategories;
    window.fetchProductsIndividually = fetchProductsIndividually;
    window.fetchSingleProduct = fetchSingleProduct;
    window.displayProducts = displayProducts;
    window.exportToJSON = exportToJSON;
    window.createHTMLReport = createHTMLReport;
    window.main = main;
}

// Auto-execute if this script is loaded directly
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else if (typeof document !== 'undefined') {
    // Document is already loaded
    main();
} 