/**
 * Category Tabs Functionality for Innovate Electronics Products Page
 * Updated to work with the new JSON structure from IE products.xlsx
 */

document.addEventListener('DOMContentLoaded', function () {
    // Get all category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    const productsGrid = document.querySelector('.products-grid');

    let productCategories = {};
    let tabToCategory = {};

    // Fetch products data from products.json (converted from Excel)
    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            // Build productCategories and tabToCategory from JSON
            const mainCategories = Object.keys(data.Products);

            mainCategories.forEach((category, idx) => {
                const key = category.toLowerCase().replace(/[^a-z0-9]/g, '');
                productCategories[key] = [];

                // Get all subcategories and their items
                const subCategories = data.Products[category];
                for (const subCategory in subCategories) {
                    const items = subCategories[subCategory];

                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            if (item.name) {
                                productCategories[key].push({
                                    name: item.name,
                                    model_no: item.model_no || '',
                                    category: category,
                                    subcategory: subCategory
                                });
                            }
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

    // Example: Load categories.json and log the categories array
    fetch('data/categories.json')
        .then(response => response.json())
        .then(data => {
            // Access the categories array
            console.log(data.categories);
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

            // Create product content - adjust this based on your actual HTML/CSS structure
            let productContent = `<h3>${product.name}</h3>`;
            if (product.model_no) {
                productContent += `<p class="model-no">${product.model_no}</p>`;
            }
            productContent += `<p class="category-info">${product.subcategory}</p>`;

            productElement.innerHTML = productContent;

            productElement.addEventListener('click', function() {
                // Pass category and subcategory information to the details page
                sessionStorage.setItem('selectedProduct', JSON.stringify(product));
                window.location.href = 'product-details.html';
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

                    let productContent = `<h3>${product.name}</h3>`;
                    if (product.model_no) {
                        productContent += `<p class="model-no">${product.model_no}</p>`;
                    }
                    productContent += `<p class="category-info">${product.subcategory}</p>`;

                    productElement.innerHTML = productContent;

                    productElement.addEventListener('click', function() {
                        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
                        window.location.href = 'product-details.html';
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