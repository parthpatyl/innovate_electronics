const express = require('express');
const router = express.Router();
const unifiedProductsController = require('../controllers/unifiedProductsController');

/**
 * @route   GET /api/unifiedproducts
 * @desc    Get all categories and their products in a unified structure
 * @access  Public
 */
router.get('/', unifiedProductsController.getUnifiedProducts);

/**
 * @route   GET /api/unifiedproducts/:categoryKey
 * @desc    Get a single category and its products by a normalized key
 * @access  Public
 */
router.get('/:categoryKey', unifiedProductsController.getUnifiedProductByCategory);

/**
 * @route   GET /api/unifiedproducts/:categoryKey/subcategory/:subcategory
 * @desc    Get products by subcategory within a specific category
 * @access  Public
 */
router.get('/:categoryKey/subcategory/:subcategory', unifiedProductsController.getProductsBySubcategory);

/**
 * @route   GET /api/unifiedproducts/product/:productName
 * @desc    Get a specific product by name across all categories
 * @access  Public
 */
router.get('/product/:productName', unifiedProductsController.getProductByName);


module.exports = router;