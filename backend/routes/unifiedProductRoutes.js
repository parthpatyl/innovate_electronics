const express = require('express');
const router = express.Router();
const unifiedProductsController = require('../controllers/unifiedProductsController');
const upload = require('../middleware/uploadMiddleware');

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

/**
 * @route   POST /api/unifiedproducts
 * @desc    Create a new product within a category/subcategory
 * @access  Private (CMS)
 */
router.post('/', upload.single('productImage'), unifiedProductsController.createProduct);

/**
 * @route   PUT /api/unifiedproducts/:id
 * @desc    Update a product by its ID
 * @access  Private (CMS)
 */
router.put('/:id', upload.single('productImage'), unifiedProductsController.updateProduct);

/**
 * @route   DELETE /api/unifiedproducts/:id
 * @desc    Delete a product by its ID
 * @access  Private (CMS)
 */
router.delete('/:id', unifiedProductsController.deleteProduct);

module.exports = router;