const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const upload = require('../middleware/uploadMiddleware');

// Fetch all blogs
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.query.status === 'all') {
      filter = {};
    } else if (req.query.status) {
      filter.status = req.query.status;
    } else {
      filter.status = 'published';
    }
    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blogs', error: error.message });
  }
});

// Get a single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blog', error: error.message });
  }
});

// Create a new blog
router.post('/', upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, date, body, author, status, excerpt, tags, metaTitle, metaDescription } = req.body;
    if (!title || !body || !author || !date) {
      return res.status(400).json({ success: false, message: 'Title, date, body, and author are required fields' });
    }

    const allowedStatuses = ['draft', 'published', 'archived'];
    const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : undefined;
    if (normalizedStatus && !allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined);

    // Construct the image URL from the uploaded file
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const contentData = {
      title,
      date,
      body,
      author,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      excerpt,
      ...(normalizedTags ? { tags: normalizedTags } : {}),
      featuredImage: imageUrl,
      metaTitle,
      metaDescription
    };
    const blog = new Blog(contentData);
    await blog.save();
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating blog', error: error.message });
  }
});

// Update a blog
router.put('/:id', upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, date, body, author, status, excerpt, tags, metaTitle, metaDescription } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const allowedStatuses = ['draft', 'published', 'archived'];
    const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : undefined;
    if (normalizedStatus && !allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined);

    // Update image URL if a new file was uploaded
    if (req.file) {
      blog.featuredImage = `/uploads/images/${req.file.filename}`;
    }

    blog.title = title ?? blog.title;
    blog.date = date ?? blog.date;
    blog.body = body ?? blog.body;
    blog.author = author ?? blog.author;
    blog.status = (normalizedStatus !== undefined ? normalizedStatus : blog.status);
    blog.excerpt = excerpt ?? blog.excerpt;
    blog.tags = (normalizedTags !== undefined ? normalizedTags : blog.tags);
    blog.metaTitle = metaTitle ?? blog.metaTitle;
    blog.metaDescription = metaDescription ?? blog.metaDescription;

    // Normalize any legacy/invalid stored status before save
    if (!allowedStatuses.includes(blog.status)) {
      const fixed = typeof blog.status === 'string' ? blog.status.trim().toLowerCase() : 'draft';
      blog.status = allowedStatuses.includes(fixed) ? fixed : 'draft';
    }

    await blog.save();
    res.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating blog', error: error.message });
  }
});

// Delete a blog
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting blog', error: error.message });
  }
});

module.exports = router; 