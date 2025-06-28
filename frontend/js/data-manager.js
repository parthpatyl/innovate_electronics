/**
 * Data Manager for Innovate Electronics JSON Databases
 * Handles loading, validation, and management of categories.json and products.json
 */

class DataManager {
    constructor() {
        this.categories = null;
        this.products = null;
        this.loaded = false;
        this.loading = false;
    }

    /**
     * Load both categories and products data
     * @returns {Promise} Promise that resolves when both datasets are loaded
     */
    async loadAllData() {
        if (this.loading) {
            return new Promise((resolve) => {
                const checkLoaded = () => {
                    if (this.loaded) {
                        resolve();
                    } else {
                        setTimeout(checkLoaded, 100);
                    }
                };
                checkLoaded();
            });
        }

        this.loading = true;
        
        try {
            const [categoriesData, productsData] = await Promise.all([
                this.loadCategories(),
                this.loadProducts()
            ]);

            this.categories = categoriesData;
            this.products = productsData;
            this.loaded = true;
            
            console.log('All data loaded successfully');
            return { categories: this.categories, products: this.products };
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Load categories data from categories.json
     * @returns {Promise} Promise that resolves with categories data
     */
    async loadCategories() {
        try {
            const response = await fetch('data/categories.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Validate categories structure
            if (!data.categories || !Array.isArray(data.categories)) {
                throw new Error('Invalid categories data structure');
            }
            
            console.log(`Loaded ${data.categories.length} categories`);
            return data.categories;
        } catch (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
    }

    /**
     * Load products data from products.json
     * @returns {Promise} Promise that resolves with products data
     */
    async loadProducts() {
        try {
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Validate products structure
            if (!data.products || typeof data.products !== 'object') {
                throw new Error('Invalid products data structure');
            }
            
            const categoryCount = Object.keys(data.products).length;
            let totalProducts = 0;
            Object.values(data.products).forEach(category => {
                totalProducts += Object.keys(category).length;
            });
            
            console.log(`Loaded ${categoryCount} product categories with ${totalProducts} total products`);
            return data.products;
        } catch (error) {
            console.error('Error loading products:', error);
            throw error;
        }
    }

    /**
     * Get all categories
     * @returns {Array} Array of categories
     */
    getCategories() {
        if (!this.loaded) {
            throw new Error('Data not loaded. Call loadAllData() first.');
        }
        return this.categories;
    }

    /**
     * Get all products
     * @returns {Object} Products object
     */
    getProducts() {
        if (!this.loaded) {
            throw new Error('Data not loaded. Call loadAllData() first.');
        }
        return this.products;
    }

    /**
     * Get products by category
     * @param {string} category - Category name
     * @returns {Array} Array of products in the category
     */
    getProductsByCategory(category) {
        if (!this.loaded) {
            throw new Error('Data not loaded. Call loadAllData() first.');
        }
        
        const categoryKey = category.toLowerCase().replace(/[^a-z0-9]/g, '');
        const products = this.products[categoryKey] || this.products[category];
        
        if (!products) {
            return [];
        }
        
        return Object.entries(products).map(([id, product]) => ({
            id,
            ...product
        }));
    }

    /**
     * Search products by name, model, or category
     * @param {string} searchTerm - Search term
     * @returns {Array} Array of matching products
     */
    searchProducts(searchTerm) {
        if (!this.loaded) {
            throw new Error('Data not loaded. Call loadAllData() first.');
        }
        
        const term = searchTerm.toLowerCase();
        const results = [];
        
        Object.entries(this.products).forEach(([category, categoryProducts]) => {
            Object.entries(categoryProducts).forEach(([id, product]) => {
                if (product.name.toLowerCase().includes(term) ||
                    id.toLowerCase().includes(term) ||
                    (product.category && product.category.toLowerCase().includes(term))) {
                    results.push({
                        id,
                        category,
                        ...product
                    });
                }
            });
        });
        
        return results;
    }

    /**
     * Get a specific product by ID
     * @param {string} productId - Product ID
     * @returns {Object|null} Product object or null if not found
     */
    getProductById(productId) {
        if (!this.loaded) {
            throw new Error('Data not loaded. Call loadAllData() first.');
        }
        
        for (const [category, categoryProducts] of Object.entries(this.products)) {
            if (categoryProducts[productId]) {
                return {
                    id: productId,
                    category,
                    ...categoryProducts[productId]
                };
            }
        }
        
        return null;
    }

    /**
     * Validate data integrity
     * @returns {Object} Validation results
     */
    validateData() {
        if (!this.loaded) {
            throw new Error('Data not loaded. Call loadAllData() first.');
        }
        
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        // Validate categories
        this.categories.forEach((category, index) => {
            if (!category.title) {
                results.errors.push(`Category ${index}: Missing title`);
                results.valid = false;
            }
            if (!category.items || !Array.isArray(category.items)) {
                results.errors.push(`Category ${index}: Missing or invalid items array`);
                results.valid = false;
            }
        });
        
        // Validate products
        Object.entries(this.products).forEach(([category, categoryProducts]) => {
            Object.entries(categoryProducts).forEach(([id, product]) => {
                if (!product.name) {
                    results.errors.push(`Product ${id}: Missing name`);
                    results.valid = false;
                }
                if (!product.image) {
                    results.warnings.push(`Product ${id}: Missing image`);
                }
            });
        });
        
        return results;
    }
}

// Create global instance
window.dataManager = new DataManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} 