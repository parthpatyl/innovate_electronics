const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Route to get all categories
router.get('/products/categories', async (req, res) => {
  try {
    const categories = await Product.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Route to get all products structure
router.get('/products/all', async (req, res) => {
  try {
    const products = await Product.getAllProducts();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all products',
      error: error.message
    });
  }
});

// Route to get subcategories within a category
router.get('/products/category/:category/subcategories', async (req, res) => {
  try {
    const { category } = req.params;
    const subcategories = await Product.getSubcategories(category);
    
    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
});

// Route to get a specific product by category and subcategory
router.get('/products/category/:category/product/:subcategory', async (req, res) => {
  try {
    const { category, subcategory } = req.params;
    console.log('Fetching product with category:', category, 'subcategory:', subcategory);
    
    const product = await Product.getProduct(category, subcategory);
    console.log('Product found:', product ? 'Yes' : 'No');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        debug: { category, subcategory }
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error in getProduct route:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message,
      debug: { category: req.params.category, subcategory: req.params.subcategory }
    });
  }
});

// Route to get products by category
router.get('/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.getProductsByCategory(category);
    
    if (!products || !products.products || !products.products[category]) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: products.products[category]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
});

// Route to get all products (legacy - returns the main products document)
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      total,
      page,
      totalPages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Route to get a single product by ID (legacy)
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Route to create a new product (legacy)
router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// Route to update a product (legacy)
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// Route to delete a product (legacy)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

module.exports = router; 