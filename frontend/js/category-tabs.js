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
    };
    if (idx === 0) {
      tab.classList.add('active');
      currentCategory = key;
    }
    tabsContainer.appendChild(tab);
  });
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
    productsHTML = products.map(item => `
      <div class="product-item" onclick="viewProduct('${item.id || item._id}')">
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
function viewProduct(productId) {
  // Navigate to product detail page or show modal
  console.log('Viewing product:', productId);
  // You can implement navigation to a product detail page here
  // window.location.href = `/product-detail.html?id=${productId}`;
  
  // For now, show an alert (replace with proper modal or navigation)
  alert(`Product ID: ${productId}\nThis would navigate to product details page.`);
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
  fetch('http://localhost:5000/api/categories')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(apiResponse => {
      console.log('API Data received:', apiResponse);
      
      // Handle the API response structure
      const apiData = apiResponse.data || apiResponse;
      
      // Convert the object into the format we need
      const formattedData = {};
      Object.keys(apiData).forEach((key) => {
        formattedData[key] = {
          title: apiData[key].title,
          headerImage: apiData[key].headerImage,
          items: apiData[key].items || []
        };
      });

      renderTabs(formattedData);
      if (Object.keys(formattedData).length > 0) {
        renderProducts(Object.keys(formattedData)[0], formattedData);
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
