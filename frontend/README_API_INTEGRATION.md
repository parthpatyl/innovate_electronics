# API Integration for Frontend

This document describes the changes made to integrate the frontend with the backend API instead of using static JSON files.

## Changes Made

### 1. Configuration File (`js/config.js`)
- Created a centralized configuration file for API endpoints
- Provides helper function `getApiUrl()` for constructing full API URLs
- Automatically detects localhost vs production environment

### 2. Updated HTML Files

#### `productpagemain.html`
- **Before**: Fetched data from `data/products.json`
- **After**: Fetches products from `/api/products` and `/api/products/:id`
- **Changes**:
  - Added `config.js` script inclusion
  - Updated `fetchProductData()` to use API
  - Updated `loadProduct()` to fetch individual products by ID
  - Updated `updateProductGallery()` to work with API data structure
  - Updated `onCategoryChange()` to fetch products by category
  - Updated `initializePage()` to use API endpoints

#### `subcategory.html`
- **Before**: Fetched data from `data/products.json`
- **After**: Fetches products by category from `/api/products/category/:category`
- **Changes**:
  - Added `config.js` script inclusion
  - Updated `loadProducts()` to use API
  - Added comprehensive subcategory mapping
  - Updated product links to use MongoDB IDs

#### `products.html`
- **Before**: Fetched data from `data/categories.json`
- **After**: Fetches categories from `/api/categories`
- **Changes**:
  - Added `config.js` script inclusion
  - Updated category fetching to use API
  - Added error handling for API failures

#### `landingpage.html`
- **Before**: Fetched data from `data/categories.json`
- **After**: Fetches categories from `/api/categories`
- **Changes**:
  - Added `config.js` script inclusion
  - Updated category fetching to use API
  - Added comprehensive subcategory mapping
  - Added error handling for API failures

#### `employeezone.html` (NEW)
- **Before**: Used static CMS system with `/api/cms-simple` endpoints
- **After**: Integrated with main product API for product management
- **Changes**:
  - Added `config.js` script inclusion
  - Updated CMS class to use main product API endpoints
  - Modified `fetchStats()` to get real product and category counts
  - Updated `fetchRecentContent()` to display recent products
  - Enhanced `renderContentList()` to show product-specific information
  - Added product-specific methods: `viewProduct()`, `editProduct()`, `deleteProduct()`
  - Created `generateProductForm()` and `populateProductForm()` for product editing
  - Updated `saveContent()` to handle product creation and updates
  - Modified `confirmDelete()` to handle product deletion
  - Added `prepareProductData()` method for form data transformation
  - **Product URLs**: Uses product names instead of MongoDB IDs for API endpoints (with URL encoding)
  - **Robust Error Handling**: Enhanced API calls with proper HTTP status checking and detailed logging

## API Endpoints Used

1. **GET `/api/categories`** - Fetch all categories
2. **GET `/api/products`** - Fetch all products
3. **GET `/api/products/:identifier`** - Fetch specific product by ID or name
4. **GET `/api/products/category/:category`** - Fetch products by category
5. **POST `/api/products`** - Create new product
6. **PUT `/api/products/:identifier`** - Update existing product by ID or name
7. **DELETE `/api/products/:id`** - Delete product by ID
8. **GET `/api/search`** - Search products (available for future use)
9. **GET `/api/stats`** - Get database statistics (available for future use)

## Employee Zone Features

The employee zone now provides a comprehensive product management interface:

### Dashboard
- Real-time product and category counts
- Recent products display
- Quick access to product management

### Product Management
- **View Products**: List all products with category, subcategory, and description
- **Create Products**: Add new products with name, category, subcategory, image, description, features, and applications
- **Edit Products**: Modify existing product details
- **Delete Products**: Remove products from the system
- **Search & Filter**: Find products by name or filter by status

### Product Form Fields
- Product Name (required)
- Category (required)
- Subcategory (optional)
- Image URL (optional)
- Description (multi-line text)
- Features (one per line)
- Applications (one per line)

### Product URL Handling
- **API Endpoints**: Product names are used in API URLs instead of MongoDB IDs for better readability
- **URL Encoding**: Product names are automatically URL-encoded to handle special characters and spaces
- **Examples**:
  - Product: "IE-2-18-2.0.1-FE Amplifier" → API URL: `/api/products/IE-2-18-2.0.1-FE%20Amplifier`
  - Product: "WAVEGUIDE TERMINATION" → API URL: `/api/products/WAVEGUIDE%20TERMINATION`
- **Backend Support**: The backend API supports both MongoDB IDs and product names for fetching/updating products

### Enhanced Error Handling
The employee zone now uses robust error handling similar to `subcategory.html`:
- **HTTP Status Checking**: All API responses are checked for HTTP status codes
- **Detailed Logging**: Console logging for debugging API calls and responses
- **Graceful Degradation**: Fallback content and error messages when API calls fail
- **User-Friendly Messages**: Clear error messages displayed to users
- **Network Error Handling**: Proper handling of network timeouts and connection issues

All API calls now include proper error handling:
- Network errors are caught and logged
- User-friendly error messages are displayed
- Fallback content is shown when API calls fail

## Setup Requirements

1. **Backend Server**: Must be running on the configured port (default: 5000)
2. **Database**: MongoDB must be connected and populated with data
3. **CORS**: Backend must allow CORS requests from frontend domain
4. **Data Import**: Run the import script to populate the database:
   ```bash
   cd backend
   node scripts/importData.js
   ```

## Testing

To test the integration:

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Open the frontend in a browser:
   ```bash
   cd frontend
   # Use any static file server or open directly
   ```

3. Navigate through the pages to verify API calls are working

4. Test the employee zone:
   - Open `employeezone.html`
   - Navigate to the Products section
   - Try creating, editing, and deleting products
   - Verify that changes are reflected in the main product pages

## Benefits

1. **Real-time Data**: Products and categories are fetched from the database
2. **Scalability**: Can handle large datasets with pagination
3. **Maintainability**: Centralized API configuration
4. **Performance**: Efficient database queries
5. **Flexibility**: Easy to add new features like search and filtering
6. **Product Management**: Complete CRUD operations for products through the employee zone
7. **Unified System**: All frontend pages now use the same API endpoints for consistency 