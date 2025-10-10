const UnifiedProduct = require('../models/UnifiedProduct');

/**
 * Fetches all unified product data.
 * The data is already structured by category in the UnifiedProduct model.
 * This controller fetches all documents and formats them into an object
 * keyed by a normalized category title, which matches the format expected
 * by the frontend.
 *
 * @route GET /api/unifiedproducts
 */
const getUnifiedProducts = async (req, res) => {
  try {
    // Fetch all documents from the UnifiedProduct collection.
    // .lean() is used for performance as we only need to read the data.
    const unifiedProducts = await UnifiedProduct.find({}).lean();

    const unifiedData = {};

    // Transform the array of category documents into an object keyed by a
    // normalized version of the category title for easy frontend lookup.
    unifiedProducts.forEach(doc => {
      const categoryKey = doc.title.toLowerCase().replace(/ & /g, 'and').replace(/\s+/g, '');
      unifiedData[categoryKey] = doc;
    });

    res.json({ success: true, data: unifiedData });
  } catch (error) {
    console.error('Error fetching unified products:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching unified products data.' });
  }
};

/**
 * Fetches a single unified product document by its category key.
 * The category key is a normalized version of the category title
 * (e.g., "RF and Microwave" becomes "rfandmicrowave").
 *
 * @route GET /api/unifiedproducts/:categoryKey
 */
const getUnifiedProductByCategory = async (req, res) => {
  try {
    const { categoryKey } = req.params;

    // Fetch all documents and find the one that matches the normalized key.
    // This is less efficient than a direct DB query if we stored the key,
    // but it's a simple approach without schema changes.
    const allProducts = await UnifiedProduct.find({}).lean();

    const productCategory = allProducts.find(doc => {
      const key = doc.title.toLowerCase().replace(/ & /g, 'and').replace(/\s+/g, '');
      return key === categoryKey;
    });

    if (!productCategory) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, data: productCategory });
  } catch (error) {
    console.error(`Error fetching unified product for category key "${req.params.categoryKey}":`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching unified product data.' });
  }
};

module.exports = {
  getUnifiedProducts,
  getUnifiedProductByCategory
};