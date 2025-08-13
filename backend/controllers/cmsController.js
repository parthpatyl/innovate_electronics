const Content = require('../models/Content');
const marked = require('marked');

/**
 * CMS Controller
 * Handles all content management operations with markdown support
 */

// Configure marked for safe markdown parsing
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true,    // GitHub Flavored Markdown
  sanitize: false // Allow HTML (be careful with user input)
});

/**
 * Create new content
 * POST /api/cms/content
 */
const createContent = async (req, res) => {
  try {
    const { title, slug, body, author, status, excerpt, tags, featuredImage, metaTitle, metaDescription } = req.body;

    // Validate required fields
    if (!title || !body || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title, body, and author are required fields'
      });
    }

    // Parse markdown body to HTML for storage (optional - you can store raw markdown)
    const htmlBody = marked(body);

    // Create content object
    const contentData = {
      title,
      slug,
      body: htmlBody, // Store parsed HTML
      rawBody: body,  // Store original markdown
      author,
      status: status || 'draft',
      excerpt,
      tags: tags || [],
      featuredImage,
      metaTitle,
      metaDescription
    };

    const content = new Content(contentData);
    await content.save();

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
    });

  } catch (error) {
    console.error('Error creating content:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Content with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all content with optional filtering
 * GET /api/cms/content
 */
const getAllContent = async (req, res) => {
  try {
    const { status, author, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (author) filter.author = author;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const content = await Content.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-rawBody'); // Exclude raw markdown from list view

    // Get total count for pagination info
    const total = await Content.countDocuments(filter);

    res.json({
      success: true,
      data: content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get single content by slug
 * GET /api/cms/content/:slug
 */
const getContentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const content = await Content.findOne({ slug });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Error fetching content by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update content by slug
 * PUT /api/cms/content/:slug
 */
const updateContent = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    // Find content first
    const content = await Content.findOne({ slug });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // If body is being updated, parse markdown
    if (updateData.body) {
      updateData.body = marked(updateData.body);
      updateData.rawBody = req.body.body; // Store original markdown
    }

    // Update content
    const updatedContent = await Content.findOneAndUpdate(
      { slug },
      updateData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: updatedContent
    });

  } catch (error) {
    console.error('Error updating content:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Content with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete content by slug
 * DELETE /api/cms/content/:slug
 */
const deleteContent = async (req, res) => {
  try {
    const { slug } = req.params;

    const content = await Content.findOneAndDelete({ slug });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully',
      data: { slug: content.slug, title: content.title }
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Publish content (change status to published)
 * PATCH /api/cms/content/:slug/publish
 */
const publishContent = async (req, res) => {
  try {
    const { slug } = req.params;

    const content = await Content.findOne({ slug });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await content.publish();

    res.json({
      success: true,
      message: 'Content published successfully',
      data: content
    });

  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Archive content (change status to archived)
 * PATCH /api/cms/content/:slug/archive
 */
const archiveContent = async (req, res) => {
  try {
    const { slug } = req.params;

    const content = await Content.findOne({ slug });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await content.archive();

    res.json({
      success: true,
      message: 'Content archived successfully',
      data: content
    });

  } catch (error) {
    console.error('Error archiving content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get content statistics
 * GET /api/cms/stats
 */
const getContentStats = async (req, res) => {
  try {
    const stats = await Content.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalContent = await Content.countDocuments();
    const publishedContent = await Content.countDocuments({ status: 'published' });
    const draftContent = await Content.countDocuments({ status: 'draft' });
    const archivedContent = await Content.countDocuments({ status: 'archived' });

    res.json({
      success: true,
      data: {
        total: totalContent,
        published: publishedContent,
        draft: draftContent,
        archived: archivedContent,
        breakdown: stats
      }
    });

  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Slug-based CMS controller methods removed since slugs are no longer used for blogs.
module.exports = {}; 