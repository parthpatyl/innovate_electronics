const UnifiedProduct = require('../models/UnifiedProduct');
const mongoose = require('mongoose');

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

/**
 * Fetches products by subcategory within a specific category.
 * This endpoint allows filtering products by their subcategory field.
 *
 * @route GET /api/unifiedproducts/:categoryKey/subcategory/:subcategory
 */
const getProductsBySubcategory = async (req, res) => {
  try {
    const { categoryKey, subcategory } = req.params;

    // Find the category document by normalized key
    const allProducts = await UnifiedProduct.find({}).lean();
    
    const productCategory = allProducts.find(doc => {
      const key = doc.title.toLowerCase().replace(/ & /g, 'and').replace(/\s+/g, '');
      return key === categoryKey;
    });

    if (!productCategory) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Find the specific subcategory item
    const subcategoryItem = productCategory.items.find(item => {
      const itemName = item.name ? item.name.toLowerCase().replace(/\s+/g, '') : '';
      const searchSubcategory = subcategory.toLowerCase().replace(/\s+/g, '');
      return itemName === searchSubcategory;
    });

    if (!subcategoryItem) {
      return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    }

    // Return the products from the subcategory
    const products = subcategoryItem.products || [];
    res.json({ success: true, data: products });
  } catch (error) {
    console.error(`Error fetching products for subcategory "${req.params.subcategory}" in category "${req.params.categoryKey}":`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching products by subcategory.' });
  }
};

/**
 * Fetches a specific product by name across all categories.
 * This endpoint searches for a product by name in all categories and subcategories.
 *
 * @route GET /api/unifiedproducts/product/:productName
 */
const getProductByName = async (req, res) => {
  try {
    const { productName } = req.params;

    // Fetch all documents from the UnifiedProduct collection
    const allProducts = await UnifiedProduct.find({}).lean();
    
    let foundProduct = null;
    let foundCategory = null;
    let foundSubcategory = null;

    // Search through all categories and their items
    for (const category of allProducts) {
      if (category.items) {
        for (const item of category.items) {
          if (item.products) {
            for (const product of item.products) {
              // Normalize both the product name and the search term for comparison
              const normalizedProductName = product.name ? product.name.toLowerCase().replace(/\s+/g, '') : '';
              const normalizedSearchName = productName.toLowerCase().replace(/\s+/g, '');
              
              if (normalizedProductName === normalizedSearchName) {
                foundProduct = product;
                foundCategory = category;
                foundSubcategory = item;
                break;
              }
            }
          }
          if (foundProduct) break;
        }
      }
      if (foundProduct) break;
    }

    if (!foundProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Add category and subcategory information to the product
    const productWithContext = {
      ...foundProduct,
      category: foundCategory.title,
      subcategory: foundSubcategory.name
    };

    res.json({ success: true, data: productWithContext });
  } catch (error) {
    console.error(`Error fetching product by name "${req.params.productName}":`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching product by name.' });
  }
};

/**
 * Creates a new product and adds it to the correct category and subcategory.
 * @route POST /api/unifiedproducts
 */
const createProduct = async (req, res) => {
  try {
    const { name, category, subcategory, image, overview } = req.body;

    if (!name || !category || !subcategory) {
      return res.status(400).json({ success: false, message: 'Name, category, and subcategory are required.' });
    }

    const categoryDoc = await UnifiedProduct.findOne({ title: category });
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: `Category "${category}" not found.` });
    }

    const subcategoryItem = categoryDoc.items.find(item => item.name === subcategory);
    if (!subcategoryItem) {
      return res.status(404).json({ success: false, message: `Subcategory "${subcategory}" not found in "${category}".` });
    }

    // Check for duplicate product name within the same subcategory
    const productExists = subcategoryItem.products.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (productExists) {
      return res.status(409).json({ success: false, message: `Product with name "${name}" already exists in this subcategory.` });
    }

    const newProduct = {
      _id: new mongoose.Types.ObjectId(),
      name,
      image: image || '',
      overview: overview || {},
      tableSpecs: {}, // Default empty object
      specifications: {}, // Default empty object
      library: {} // Default empty object
    };

    subcategoryItem.products.push(newProduct);
    await categoryDoc.save();

    res.status(201).json({ success: true, data: newProduct, message: 'Product created successfully.' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server error while creating product.' });
  }
};

/**
 * Updates an existing product by its ID.
 * @route PUT /api/unifiedproducts/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // This is the product's _id
    const { name, category, subcategory, image, overview } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const categoryDoc = await UnifiedProduct.findOne({ "items.products._id": id });
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let product;
    let subcategoryItem;

    for (const item of categoryDoc.items) {
      product = item.products.id(id);
      if (product) {
        subcategoryItem = item;
        break;
      }
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Update fields
    product.name = name ?? product.name;
    product.image = image ?? product.image;
    product.overview = overview ?? product.overview; // The overview object is passed directly
    // Note: This logic doesn't handle moving a product to a different category/subcategory.
    // That would require a more complex delete-and-create operation.

    await categoryDoc.save();

    res.json({ success: true, data: product, message: 'Product updated successfully.' });
  } catch (error) {
    console.error(`Error updating product with ID "${req.params.id}":`, error);
    res.status(500).json({ success: false, message: 'Server error while updating product.' });
  }
};

/**
 * Deletes a product by its ID.
 * @route DELETE /api/unifiedproducts/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const categoryDoc = await UnifiedProduct.findOne({ "items.products._id": id });
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Mongoose subdocument removal
    categoryDoc.items.forEach(item => {
        const product = item.products.id(id);
        if (product) {
            product.remove();
        }
    });

    await categoryDoc.save();

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting product with ID "${req.params.id}":`, error);
    res.status(500).json({ success: false, message: 'Server error while deleting product.' });
  }
};

module.exports = {
  getUnifiedProducts,
  getUnifiedProductByCategory,
  getProductsBySubcategory,
  getProductByName,
  createProduct,
  updateProduct,
  deleteProduct
};