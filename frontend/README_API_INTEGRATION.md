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

## API Endpoints Used

1. **GET `/api/categories`** - Fetch all categories
2. **GET `/api/products`** - Fetch all products
3. **GET `/api/products/:id`** - Fetch specific product by ID
4. **GET `/api/products/category/:category`** - Fetch products by category
5. **GET `/api/search`** - Search products (available for future use)
6. **GET `/api/stats`** - Get database statistics (available for future use)

## Data Structure Changes

### Categories API Response
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "title": "RF and Microwave",
      "headerImage": "assets/image35.png",
      "items": [...]
    }
  ]
}
```

### Products API Response
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "totalPages": 5,
  "data": [
    {
      "_id": "...",
      "name": "Product Name",
      "category": "switches",
      "image": "assets/product.png",
      "tableSpecs": {...},
      "overview": {...},
      "specifications": {...},
      "library": {...}
    }
  ]
}
```

## Subcategory Mapping

The following mapping is used to convert display names to API category keys:

```javascript
const subcategoryKeyMap = {
    'Switches': 'switches',
    'Amplifiers': 'amplifiers',
    'Passive Components': 'passive_components',
    'Waveguides': 'waveguides',
    'Cable Assembly': 'cable_assembly',
    'Filters': 'filters',
    'DRO & PLDRO': 'dro_pldro',
    'Thin Film Circuits': 'thin_film_circuits',
    'Inductors': 'inductors',
    'Capacitors': 'capacitors',
    'Chambers EMI & Anechoic': 'chambers_emi_anechoic',
    'EMI EMC Chamber': 'emi_emc_chamber',
    'Anechoic Chamber': 'anechoic_chamber',
    'EMI EMC Scanner/Probe': 'emi_emc_scanner_probe',
    'Reverberation Chamber': 'reverberation_chamber'
};
```

## Error Handling

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

## Benefits

1. **Real-time Data**: Products and categories are fetched from the database
2. **Scalability**: Can handle large datasets with pagination
3. **Maintainability**: Centralized API configuration
4. **Performance**: Efficient database queries
5. **Flexibility**: Easy to add new features like search and filtering 