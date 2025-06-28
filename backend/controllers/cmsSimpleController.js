const ContentInMemory = require('../models/ContentInMemory');
const marked = require('marked');

/**
 * Simple CMS Controller for Educational Purposes
 * 
 * This controller demonstrates basic CRUD operations with in-memory storage.
 * It's designed to be easy to understand for junior developers learning
 * RESTful API development and content management systems.
 * 
 * Features:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Markdown support using the 'marked' library
 * - In-memory storage for easy prototyping
 * - Comprehensive error handling
 * - Clear, educational code comments
 */

// Configure marked for safe markdown parsing
marked.setOptions({
  breaks: true,    // Convert line breaks to <br>
  gfm: true,       // GitHub Flavored Markdown
  sanitize: false  // Allow HTML (be careful with user input)
});

/**
 * CREATE - POST /api/cms/content
 * Creates a new content item
 * 
 * Expected request body:
 * {
 *   "title": "Article Title",
 *   "body": "# Markdown content\n\nThis supports **bold** and *italic*",
 *   "author": "John Doe",
 *   "status": "draft" (optional, defaults to "draft")
 * }
 */
const createContent = async (req, res) => {
  try {
    const { title, body, author, status = 'draft', slug } = req.body;

    // Step 1: Validate required fields
    if (!title || !body || !author) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, body, and author are required',
        required: ['title', 'body', 'author'],
        received: { title: !!title, body: !!body, author: !!author }
      });
    }

    // Step 2: Validate status enum
    const validStatuses = ['draft', 'published', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        received: status
      });
    }

    // Step 3: Parse markdown body to HTML
    const htmlBody = marked(body);

    // Step 4: Prepare content data
    const contentData = {
      title: title.trim(),
      body: htmlBody,        // Store parsed HTML
      rawBody: body,         // Store original markdown
      author: author.trim(),
      status: status,
      slug: slug             // Will be auto-generated if not provided
    };

    // Step 5: Create and save content
    const newContent = await ContentInMemory.create(contentData);

    // Step 6: Return success response
    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: {
        id: newContent._id,
        title: newContent.title,
        slug: newContent.slug,
        author: newContent.author,
        status: newContent.status,
        createdAt: newContent.createdAt,
        body: newContent.body,      // HTML version
        rawBody: newContent.rawBody // Original markdown
      }
    });

  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating content',
      error: error.message
    });
  }
};

/**
 * READ ALL - GET /api/cms/content
 * Retrieves all content with optional filtering and pagination
 * 
 * Query parameters:
 * - status: Filter by status (draft, published, archived)
 * - author: Filter by author name
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 */
const getAllContent = async (req, res) => {
  try {
    const { status, author, page = 1, limit = 10 } = req.query;

    // Step 1: Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (author) filter.author = author;

    // Step 2: Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Cap at 100 items
    const skip = (pageNum - 1) * limitNum;

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive numbers'
      });
    }

    // Step 3: Execute query with pagination
    const content = await ContentInMemory.find(filter, {
      sort: '-createdAt', // Sort by newest first
      skip: skip,
      limit: limitNum
    });

    // Step 4: Get total count for pagination info
    const total = await ContentInMemory.countDocuments(filter);

    // Step 5: Return paginated results
    res.json({
      success: true,
      data: content.map(item => ({
        id: item._id,
        title: item.title,
        slug: item.slug,
        author: item.author,
        status: item.status,
        excerpt: item.excerpt,
        tags: item.tags,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      filters: {
        status: status || 'all',
        author: author || 'all'
      }
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching content',
      error: error.message
    });
  }
};

/**
 * READ ONE - GET /api/cms/content/:slug
 * Retrieves a single content item by its slug
 * 
 * URL parameters:
 * - slug: The unique identifier for the content
 */
const getContentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Step 1: Find content by slug
    const content = await ContentInMemory.findOne({ slug });
    
    // Step 2: Handle not found case
    if (!content) {
      return res.status(404).json({
        success: false,
        message: `Content with slug "${slug}" not found`,
        slug: slug
      });
    }

    // Step 3: Return content data
    res.json({
      success: true,
      data: {
        id: content._id,
        title: content.title,
        slug: content.slug,
        body: content.body,        // HTML version
        rawBody: content.rawBody,  // Original markdown
        author: content.author,
        status: content.status,
        excerpt: content.excerpt,
        tags: content.tags,
        featuredImage: content.featuredImage,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching content by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching content',
      error: error.message
    });
  }
};

/**
 * UPDATE - PUT /api/cms/content/:slug
 * Updates an existing content item by its slug
 * 
 * URL parameters:
 * - slug: The unique identifier for the content
 * 
 * Request body: Any fields to update (title, body, author, status, etc.)
 */
const updateContent = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    // Step 1: Check if content exists
    const existingContent = await ContentInMemory.findOne({ slug });
    
    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: `Content with slug "${slug}" not found`,
        slug: slug
      });
    }

    // Step 2: Validate status if provided
    if (updateData.status) {
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          received: updateData.status
        });
      }
    }

    // Step 3: Parse markdown if body is being updated
    if (updateData.body) {
      updateData.body = marked(updateData.body);
      updateData.rawBody = req.body.body; // Store original markdown
    }

    // Step 4: Update content
    const updatedContent = await ContentInMemory.findOneAndUpdate(
      { slug },
      updateData,
      { new: true }
    );

    // Step 5: Return updated content
    res.json({
      success: true,
      message: 'Content updated successfully',
      data: {
        id: updatedContent._id,
        title: updatedContent.title,
        slug: updatedContent.slug,
        body: updatedContent.body,
        rawBody: updatedContent.rawBody,
        author: updatedContent.author,
        status: updatedContent.status,
        excerpt: updatedContent.excerpt,
        tags: updatedContent.tags,
        featuredImage: updatedContent.featuredImage,
        metaTitle: updatedContent.metaTitle,
        metaDescription: updatedContent.metaDescription,
        createdAt: updatedContent.createdAt,
        updatedAt: updatedContent.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating content',
      error: error.message
    });
  }
};

/**
 * DELETE - DELETE /api/cms/content/:slug
 * Deletes a content item by its slug
 * 
 * URL parameters:
 * - slug: The unique identifier for the content
 */
const deleteContent = async (req, res) => {
  try {
    const { slug } = req.params;

    // Step 1: Check if content exists
    const existingContent = await ContentInMemory.findOne({ slug });
    
    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: `Content with slug "${slug}" not found`,
        slug: slug
      });
    }

    // Step 2: Delete content
    const deleted = await ContentInMemory.deleteOne({ slug });

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete content'
      });
    }

    // Step 3: Return success response
    res.json({
      success: true,
      message: 'Content deleted successfully',
      deletedContent: {
        id: existingContent._id,
        title: existingContent.title,
        slug: existingContent.slug
      }
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting content',
      error: error.message
    });
  }
};

/**
 * PUBLISH - PATCH /api/cms/content/:slug/publish
 * Changes content status to 'published'
 * 
 * URL parameters:
 * - slug: The unique identifier for the content
 */
const publishContent = async (req, res) => {
  try {
    const { slug } = req.params;

    // Step 1: Check if content exists
    const existingContent = await ContentInMemory.findOne({ slug });
    
    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: `Content with slug "${slug}" not found`,
        slug: slug
      });
    }

    // Step 2: Update status to published
    const updatedContent = await ContentInMemory.findOneAndUpdate(
      { slug },
      { status: 'published' },
      { new: true }
    );

    // Step 3: Return success response
    res.json({
      success: true,
      message: 'Content published successfully',
      data: {
        id: updatedContent._id,
        title: updatedContent.title,
        slug: updatedContent.slug,
        status: updatedContent.status,
        updatedAt: updatedContent.updatedAt
      }
    });

  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while publishing content',
      error: error.message
    });
  }
};

/**
 * GET STATISTICS - GET /api/cms/stats
 * Returns content statistics
 */
const getContentStats = async (req, res) => {
  try {
    const stats = await ContentInMemory.getStats();

    res.json({
      success: true,
      data: {
        total: stats.total,
        published: stats.published,
        draft: stats.draft,
        archived: stats.archived,
        publishedPercentage: stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching statistics',
      error: error.message
    });
  }
};

module.exports = {
  createContent,
  getAllContent,
  getContentBySlug,
  updateContent,
  deleteContent,
  publishContent,
  getContentStats
}; 