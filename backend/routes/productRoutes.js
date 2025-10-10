const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

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
    
    const product = await Product.getProduct(category, subcategory);
    
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

// Route to get products by category (updated for flat structure)
router.get('/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Use case-insensitive search for category
    const products = await Product.find({
      category: { $regex: new RegExp(`^${category}$`, 'i') }
    }).sort({ name: 1 });
    
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No products found in category: ${category}`,
        availableCategories: await Product.distinct('category')
      });
    }
    
    res.json({
      success: true,
      data: products,
      count: products.length
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

// Route to get a single product by ID or name
router.get('/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let product;
    
    // Check if it's a valid MongoDB ObjectId (24 character hex string)
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      // Try to find by ID first
      product = await Product.findById(identifier);
    }
    
    // If not found by ID or not a valid ObjectId, try to find by name
    if (!product) {
      product = await Product.findOne({
        name: { $regex: new RegExp(identifier, 'i') }
      });
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        searchedFor: identifier
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

// Route to search products by name (partial match)
router.get('/products/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const products = await Product.find({
      name: { $regex: new RegExp(name, 'i') }
    }).sort({ name: 1 });
    
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No products found matching: ${name}`
      });
    }
    
    res.json({
      success: true,
      data: products,
      count: products.length,
      searchTerm: name
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
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
    const { id } = req.params;
    let product;
    
    // Check if it's a valid MongoDB ObjectId (24 character hex string)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      // Try to find by ID first
      product = await Product.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );
    }
    
    // If not found by ID or not a valid ObjectId, try to find by name
    if (!product) {
      product = await Product.findOneAndUpdate(
        { name: { $regex: new RegExp(id, 'i') } },
        req.body,
        { new: true, runValidators: true }
      );
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        searchedFor: id
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
    const { id } = req.params;
    let product;
    
    // Check if it's a valid MongoDB ObjectId (24 character hex string)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      // Try to find by ID first
      product = await Product.findByIdAndDelete(id);
    }
    
    // If not found by ID or not a valid ObjectId, try to find by name
    if (!product) {
      product = await Product.findOneAndDelete({
        name: { $regex: new RegExp(id, 'i') }
      });
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        searchedFor: id
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

// Route to get all available categories (updated for flat structure)
router.get('/products/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

module.exports = router; 