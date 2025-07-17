const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

// Fetch all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Content.find({
      type: 'blog',
      status: 'published'
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blogs', error: error.message });
  }
});

// Get a single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Content.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blog', error: error.message });
  }
});

// Create a new blog
router.post('/', async (req, res) => {
  try {
    const { title, date, body, author, status, excerpt, tags, featuredImage, metaTitle, metaDescription } = req.body;
    if (!title || !body || !author || !date) {
      return res.status(400).json({ success: false, message: 'Title, date, body, and author are required fields' });
    }
    // Ensure 'blog' tag is present
    const blogTags = tags && Array.isArray(tags) ? [...new Set([...tags, 'blog'])] : ['blog'];
    const contentData = {
      title,
      date,
      body,
      author,
      status,
      excerpt,
      tags: blogTags,
      featuredImage,
      metaTitle,
      metaDescription,
      type: 'blog'
    };
    // Remove any slug if present in req.body to ensure auto-generation
    delete contentData.slug;
    const blog = new Content(contentData);
    await blog.save();
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Blog with this slug already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating blog', error: error.message });
  }
});

// Update a blog
router.put('/:id', async (req, res) => {
  try {
    const { title, date, body, author, status, excerpt, tags, featuredImage, metaTitle, metaDescription } = req.body;
    const blog = await Content.findByIdAndUpdate(
      req.params.id,
      { title, date, body, author, status, excerpt, tags, featuredImage, metaTitle, metaDescription },
      { new: true, runValidators: true }
    );
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating blog', error: error.message });
  }
});

// Delete a blog
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Content.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting blog', error: error.message });
  }
});

module.exports = router; 