const express = require('express');
const router = express.Router();
const unifiedProductsController = require('../controllers/unifiedProductsController');
const upload = require('../middleware/uploadMiddleware');
const uploadPDF = require('../middleware/pdfUploadMiddleware');

// Create a combined upload middleware for products
const multer = require('multer');
const productUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, 'public/uploads/images/');
            } else if (file.mimetype === 'application/pdf') {
                cb(null, 'public/uploads/pdfs/');
            } else {
                cb(new Error('Invalid file type'));
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const path = require('path');
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const path = require('path');
        if (file.mimetype.startsWith('image/')) {
            const allowedTypes = /jpeg|jpg|png|gif|webp/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            if (extname) {
                return cb(null, true);
            }
        } else if (file.mimetype === 'application/pdf') {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, gif, webp) and PDF files are allowed'));
    }
});

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
 * @files   productImage (single image), catalogue[], drawings[], testReports[], executionFiles[] (PDFs)
 */
router.post('/', productUpload.fields([
    { name: 'productImage', maxCount: 1 },
    { name: 'catalogue', maxCount: 10 },
    { name: 'drawings', maxCount: 10 },
    { name: 'testReports', maxCount: 10 },
    { name: 'executionFiles', maxCount: 10 }
]), unifiedProductsController.createProduct);

/**
 * @route   PUT /api/unifiedproducts/:id
 * @desc    Update a product by its ID
 * @access  Private (CMS)
 * @files   productImage (single image), catalogue[], drawings[], testReports[], executionFiles[] (PDFs)
 */
router.put('/:id', productUpload.fields([
    { name: 'productImage', maxCount: 1 },
    { name: 'catalogue', maxCount: 10 },
    { name: 'drawings', maxCount: 10 },
    { name: 'testReports', maxCount: 10 },
    { name: 'executionFiles', maxCount: 10 }
]), unifiedProductsController.updateProduct);

/**
 * @route   DELETE /api/unifiedproducts/:id
 * @desc    Delete a product by its ID
 * @access  Private (CMS)
 */
router.delete('/:id', unifiedProductsController.deleteProduct);

module.exports = router;