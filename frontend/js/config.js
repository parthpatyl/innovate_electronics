// Configuration for API endpoints
const API_CONFIG = {
    // Base URL for API calls - automatically detect environment
    BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://momentscape-backend.onrender.com/',
    
    // API endpoints
    ENDPOINTS: {
        // CMS Endpoints
        PRODUCTS: 'api/unifiedproducts', // Managed via CMS
        CATEGORIES: 'api/unifiedproducts', // Alias for public-facing category pages
        PRODUCTS_BY_SUBCATEGORY: 'api/products/category', // Base path for /:category/subcategory/:subcategory
        UNIFIED_PRODUCTS: 'api/unifiedproducts', // For public-facing product pages
        EVENTS: 'api/events',
        BLOGS: 'api/blogs',
        NEWSLETTERS: 'api/newsletters',
        NEWSLETTER_SUBSCRIBE: 'api/newsletter/subscribe',
        TESTIMONIALS: 'api/testimonials',
        STATS: 'api/stats',
        CHATBOT: 'api/chatbot/message',
        CONTACT: 'api/contact'
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