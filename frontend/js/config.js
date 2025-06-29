// Configuration for API endpoints
const API_CONFIG = {
    // Base URL for API calls - change this based on your server setup
    BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : '',
    
    // API endpoints
    ENDPOINTS: {
        // Legacy endpoints
        CATEGORIES: '/api/categories',
        PRODUCTS: '/api/products',
        PRODUCTS_BY_CATEGORY: '/api/products/category',
        SEARCH: '/api/search',
        STATS: '/api/stats',
        
        // New dynamic product endpoints
        ALL_CATEGORIES: '/api/products/categories',
        ALL_PRODUCTS: '/api/products/all',
        PRODUCTS_BY_CATEGORY_DYNAMIC: '/api/products/category',
        SUBCATEGORIES: '/api/products/category',
        SPECIFIC_PRODUCT: '/api/products/category'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, getApiUrl };
} 