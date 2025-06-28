// Configuration for API endpoints
const API_CONFIG = {
    // Base URL for API calls - change this based on your server setup
    BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : '',
    
    // API endpoints
    ENDPOINTS: {
        CATEGORIES: '/api/categories',
        PRODUCTS: '/api/products',
        PRODUCTS_BY_CATEGORY: '/api/products',
        SEARCH: '/api/search',
        STATS: '/api/stats'
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