/**
 * Category Tabs Functionality for Innovate Electronics Products Page
 * Updated to work with the new JSON structure from categories.json and products.json
 */

document.addEventListener('DOMContentLoaded', function () {
    // Get all category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    const productsGrid = document.querySelector('.products-grid');

    let productCategories = {};
    let tabToCategory = {};

    // Fetch products data from products.json
    fetch('data/products.json')
        .then(response => response.json())
        .then(data => {
            // Build productCategories and tabToCategory from JSON
            const mainCategories = Object.keys(data.products);

            mainCategories.forEach((category, idx) => {
                const key = category.toLowerCase().replace(/[^a-z0-9]/g, '');
                productCategories[key] = [];

                // Get all products in this category
                const categoryProducts = data.products[category];
                for (const productId in categoryProducts) {
                    const product = categoryProducts[productId];
                    if (product.name) {
                        productCategories[key].push({
                            name: product.name,
                            model_no: productId,
                            category: product.category || category,
                            subcategory: product.category || category,
                            image: product.image,
                            overview: product.overview,
                            specifications: product.specifications
                        });
                    }
                }

                // Map tab names to category keys
                tabToCategory[category] = key;
            });

            // Add click event listener to each tab
            categoryTabs.forEach(tab => {
                tab.addEventListener('click', function () {
                    categoryTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    const categoryKey = tabToCategory[this.textContent.trim()];
                    document.querySelector('.breadcrumb').textContent = 'Categories > ' + this.textContent.trim();
                    loadProducts(categoryKey);
                });
            });

            // Initialize with the active tab's products
            const activeTab = document.querySelector('.category-tab.active');
            if (activeTab) {
                const initialCategory = tabToCategory[activeTab.textContent.trim()];
                loadProducts(initialCategory);
            }
        })
        .catch(error => {
            console.error('Error loading product data:', error);
            productsGrid.innerHTML = '<div class="error">Error loading products. Please try again later.</div>';
        });

    // Load categories.json for additional category information
    fetch('data/categories.json')
        .then(response => response.json())
        .then(data => {
            // Access the categories array
            console.log('Categories loaded:', data.categories);
            // You can now use data.categories in your JS code
        })
        .catch(error => {
            console.error('Error loading data/categories.json:', error);
        });

    // Function to load products for selected category
    function loadProducts(categoryKey) {
        productsGrid.innerHTML = '';
        const products = productCategories[categoryKey] || [];

        if (products.length === 0) {
            productsGrid.innerHTML = '<div class="no-products">No products available in this category.</div>';
            return;
        }

        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product-item';

            // Create product content with image and details
            let productContent = `
                <div class="product-image">
                    <img src="${product.image || 'assets/placeholder.png'}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    ${product.model_no ? `<p class="model-no">Model: ${product.model_no}</p>` : ''}
                    <p class="category-info">${product.subcategory}</p>
                </div>
            `;

            productElement.innerHTML = productContent;

            productElement.addEventListener('click', function() {
                // Pass complete product information to the details page
                sessionStorage.setItem('selectedProduct', JSON.stringify(product));
                window.location.href = 'productpagemain.html';
            });

            productsGrid.appendChild(productElement);
        });

        animateProducts();
    }

    // Function to animate products appearance
    function animateProducts() {
        const productItems = document.querySelectorAll('.product-item');

        productItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';

            setTimeout(() => {
                item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 50 * index);
        });
    }

    // Search functionality
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const activeTab = document.querySelector('.category-tab.active');
            const categoryKey = tabToCategory[activeTab.textContent.trim()];
            const products = productCategories[categoryKey] || [];

            const filteredProducts = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                (product.model_no && product.model_no.toLowerCase().includes(searchTerm)) ||
                product.subcategory.toLowerCase().includes(searchTerm)
            );

            productsGrid.innerHTML = '';

            if (filteredProducts.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No products found matching your search.';
                productsGrid.appendChild(noResults);
            } else {
                filteredProducts.forEach(product => {
                    const productElement = document.createElement('div');
                    productElement.className = 'product-item';

                    let productContent = `
                        <div class="product-image">
                            <img src="${product.image || 'assets/placeholder.png'}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                        </div>
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            ${product.model_no ? `<p class="model-no">Model: ${product.model_no}</p>` : ''}
                            <p class="category-info">${product.subcategory}</p>
                        </div>
                    `;

                    productElement.innerHTML = productContent;

                    productElement.addEventListener('click', function() {
                        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
                        window.location.href = 'productpagemain.html';
                    });

                    productsGrid.appendChild(productElement);
                });

                animateProducts();
            }
        });
    }

    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function (e) {
            window.location.href = 'landingpage.html';
        });
    }
});