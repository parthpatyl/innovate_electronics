const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Route to get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ title: 1 });
    const categoriesData = {};
    categories.forEach(category => {
      const key = category.title.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
      categoriesData[key] = {
        title: category.title,
        headerImage: category.headerImage,
        items: category.items
      };
    });
    res.json({
      success: true,
      data: categoriesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Route to get a specific category by key
router.get('/:categoryKey', async (req, res) => {
  try {
    const { categoryKey } = req.params;
    if (!categoryKey || typeof categoryKey !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing categoryKey parameter.'
      });
    }
    const category = await Category.findOne({
      title: { $regex: new RegExp(categoryKey.replace(/([A-Z])/g, ' $1').trim(), 'i') }
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: {
        title: category.title,
        headerImage: category.headerImage,
        items: category.items
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// Route to create a new category
router.post('/', async (req, res) => {
  try {
    const { title, headerImage, items } = req.body;
    const category = new Category({
      title,
      headerImage,
      items
    });
    await category.save();
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// Route to update a category
router.put('/:id', async (req, res) => {
  try {
    const { title, headerImage, items } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { title, headerImage, items },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// Route to delete a category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

module.exports = router;
