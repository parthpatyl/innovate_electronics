// Configuration for API endpoints
const API_CONFIG = {
    // Base URL for API calls - always use backend URL
    BASE_URL: 'http://localhost:5000',
    
    // API endpoints
    ENDPOINTS: {
        // Legacy endpoints
        CATEGORIES: '/api/categories',
        PRODUCTS: '/api/products',
        PRODUCTS_BY_CATEGORY: '/api/products/category',
        SEARCH: '/api/search',
        STATS: '/api/stats',
        
        // New dynamic product endpoints from category-demo.html
        ALL_CATEGORIES: '/api/products/categories',
        ALL_PRODUCTS: '/api/products/all',
        PRODUCTS_BY_CATEGORY_DYNAMIC: '/api/products/category',
        SUBCATEGORIES: '/api/products/category',
        SPECIFIC_PRODUCT: '/api/products'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    if (typeof API_CONFIG === 'undefined' || !API_CONFIG.BASE_URL) {
        throw new Error('API_CONFIG is not defined or missing BASE_URL');
    }
    // Use the original regex to avoid invalid character error
    return (API_CONFIG.BASE_URL + '/' + endpoint).replace(/([^:]\/)\/+/g, '$1');
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, getApiUrl };
} 
// Make getApiUrl available globally
window.getApiUrl = getApiUrl; 