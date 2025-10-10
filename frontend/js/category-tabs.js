// Global variables
let allProducts = [];
let currentCategory = null;

// Get references to the containers
const tabsContainer = document.querySelector('.category-tabs');
const productsGrid = document.querySelector('.products-grid');
const searchInput = document.getElementById('searchInput');
const searchIcon = document.getElementById('searchIcon');

// Function to render tabs
function renderTabs(data) {
  if (!tabsContainer) return;
  
  tabsContainer.innerHTML = '';
  Object.keys(data).forEach((key, idx) => {
    const tab = document.createElement('button');
    tab.textContent = data[key].title;
    tab.className = 'category-tab';
    tab.onclick = () => {
      currentCategory = key;
      renderProducts(key, data);
      // Clear search when switching categories
      if (searchInput) searchInput.value = '';
      // Dispatch categoryChanged event for hero section
      dispatchCategoryChanged(data[key]);
    };
    if (idx === 0) {
      tab.classList.add('active');
      currentCategory = key;
    }
    tabsContainer.appendChild(tab);
  });
}

// Dispatch custom event for hero section update
function dispatchCategoryChanged(categoryData) {
  const event = new CustomEvent('categoryChanged', {
    detail: {
      name: categoryData.title,
      image: categoryData.headerImage || '',
      description: categoryData.description || ''
    }
  });
  document.dispatchEvent(event);
}

// Function to render products for a selected category
function renderProducts(selectedKey, data) {
  // Remove active class from all tabs
  document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
  
  // Add active class to the clicked tab
  const tabs = Array.from(tabsContainer.children);
  const idx = Object.keys(data).indexOf(selectedKey);
  if (tabs[idx]) tabs[idx].classList.add('active');

  // Render products
  const category = data[selectedKey];
  if (!productsGrid) return;
  
  // Store all products for search functionality
  allProducts = category.items || [];
  
  displayProducts(allProducts);
}

// Function to display products (used by both renderProducts and search)
function displayProducts(products) {
  if (!productsGrid) return;
  
  let productsHTML = '';
  
  if (products && products.length > 0) {
    productsHTML = products.map((item, index) => `
      <div class="product-item" onclick="viewProduct('${item.name}', ${index})">
        <img src="${item.image || 'assets/placeholder-product.png'}" 
             alt="${item.name}" 
             class="product-thumbnail" 
             onerror="this.src='assets/placeholder-product.png'">
        <h3>${item.name}</h3>
      </div>
    `).join('');
  } else {
    productsHTML = `
      <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #666;">
        <p>No products found.</p>
        <p>Try adjusting your search terms or browse different categories.</p>
      </div>
    `;
  }
  
  productsGrid.innerHTML = productsHTML;
}

// Function to handle product view
function viewProduct(productName) {
  // Find the selected product from allProducts by name
  const selectedProduct = allProducts.find(product => product.name === productName);
  
  if (selectedProduct) {
    // Get the category title from the currently selected category's data
    // The 'data' object is available in the scope of the event handler that calls this.
    const categoryTitle = window.currentApiData[currentCategory].title;

    // Redirect to subcategory.html with product parameters
    const params = new URLSearchParams({
      category: categoryTitle, // Main category (e.g., "RF and Microwave")
      productName: selectedProduct.name // Subcategory (e.g., "Switches")
    });
    window.location.href = `subcategory.html?${params.toString()}`;
  } else {
    console.error('Product not found:', productName);
  }
}

// Search functionality
function setupSearch() {
  if (!searchInput) return;
  
  // Search on input change
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    performSearch(searchTerm);
  });
  
  // Search on icon click
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      performSearch(searchTerm);
    });
  }
  
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const searchTerm = searchInput.value.toLowerCase().trim();
      performSearch(searchTerm);
    }
  });
}

// Perform search function
function performSearch(searchTerm) {
  if (!searchTerm) {
    // If search is empty, show all products in current category
    displayProducts(allProducts);
    return;
  }
  
  const filteredProducts = allProducts.filter(item => {
    const name = item.name.toLowerCase();
    const subproducts = (item.subproducts || []).join(' ').toLowerCase();
    
    return name.includes(searchTerm) || subproducts.includes(searchTerm);
  });
  
  displayProducts(filteredProducts);
}

// Initialize the application
let currentApiData = {}; // Make API data globally accessible for viewProduct
function initializeApp() {
  // Show loading state
  if (productsGrid) {
    productsGrid.innerHTML = `
      <div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #666;">
        <p>Loading products...</p>
      </div>
    `;
  }
  
  // Fetch data from API
  fetch(getApiUrl(API_CONFIG.ENDPOINTS.CATEGORIES))
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(apiResponse => {
      console.log('API Data received:', apiResponse);
      
      // Handle the API response structure
      window.currentApiData = apiResponse.data || {};

      renderTabs(window.currentApiData);
      if (Object.keys(window.currentApiData).length > 0) {
        renderProducts(Object.keys(window.currentApiData)[0], window.currentApiData);
        dispatchCategoryChanged(window.currentApiData[Object.keys(window.currentApiData)[0]]);
      }
      setupSearch();
    })
    .catch(error => {
      console.error('Error fetching categories:', error);
      if (productsGrid) {
        productsGrid.innerHTML = `
          <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #d32f2f;">
            <p style="color: red; margin-bottom: 10px;">Failed to load categories. Please try again later.</p>
            <p style="font-size: 0.9em; color: #666;">Error: ${error.message}</p>
            <p style="font-size: 0.9em; color: #666;">Make sure the backend server is running on http://localhost:5000</p>
            <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #f33434; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Retry
            </button>
          </div>
        `;
      }
    });
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
