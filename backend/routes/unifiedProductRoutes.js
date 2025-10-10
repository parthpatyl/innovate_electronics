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


module.exports = router;