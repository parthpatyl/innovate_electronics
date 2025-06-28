const express = require('express');
const router = express.Router();
const cmsSimpleController = require('../controllers/cmsSimpleController');

/**
 * Simple CMS Routes for Educational Purposes
 * 
 * This file demonstrates basic RESTful routing patterns for a CMS.
 * Each route is clearly documented with its purpose and expected behavior.
 * 
 * Route Structure:
 * - POST   /content     - Create new content
 * - GET    /content     - Get all content (with filtering/pagination)
 * - GET    /content/:slug - Get single content by slug
 * - PUT    /content/:slug - Update content by slug
 * - DELETE /content/:slug - Delete content by slug
 * - PATCH  /content/:slug/publish - Publish content
 * - GET    /stats       - Get content statistics
 */

// ============================================================================
// CONTENT CRUD OPERATIONS
// ============================================================================

/**
 * CREATE - POST /api/cms/content
 * Creates a new content item
 * 
 * Request Body:
 * {
 *   "title": "Article Title",
 *   "body": "# Markdown content\n\nThis supports **bold** and *italic*",
 *   "author": "John Doe",
 *   "status": "draft" (optional)
 * }
 * 
 * Response: 201 Created with the created content
 */
router.post('/content', cmsSimpleController.createContent);

/**
 * READ ALL - GET /api/cms/content
 * Retrieves all content with optional filtering and pagination
 * 
 * Query Parameters:
 * - status: Filter by status (draft, published, archived)
 * - author: Filter by author name
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * 
 * Examples:
 * GET /api/cms/content
 * GET /api/cms/content?status=published
 * GET /api/cms/content?author=John&page=2&limit=5
 * 
 * Response: 200 OK with paginated content list
 */
router.get('/content', cmsSimpleController.getAllContent);

/**
 * READ ONE - GET /api/cms/content/:slug
 * Retrieves a single content item by its slug
 * 
 * URL Parameters:
 * - slug: The unique identifier for the content
 * 
 * Examples:
 * GET /api/cms/content/welcome-to-our-cms
 * GET /api/cms/content/getting-started-with-markdown
 * 
 * Response: 200 OK with content data, or 404 Not Found
 */
router.get('/content/:slug', cmsSimpleController.getContentBySlug);

/**
 * UPDATE - PUT /api/cms/content/:slug
 * Updates an existing content item by its slug
 * 
 * URL Parameters:
 * - slug: The unique identifier for the content
 * 
 * Request Body: Any fields to update
 * {
 *   "title": "Updated Title",
 *   "body": "Updated markdown content",
 *   "status": "published"
 * }
 * 
 * Examples:
 * PUT /api/cms/content/welcome-to-our-cms
 * 
 * Response: 200 OK with updated content, or 404 Not Found
 */
router.put('/content/:slug', cmsSimpleController.updateContent);

/**
 * DELETE - DELETE /api/cms/content/:slug
 * Deletes a content item by its slug
 * 
 * URL Parameters:
 * - slug: The unique identifier for the content
 * 
 * Examples:
 * DELETE /api/cms/content/welcome-to-our-cms
 * 
 * Response: 200 OK with deletion confirmation, or 404 Not Found
 */
router.delete('/content/:slug', cmsSimpleController.deleteContent);

// ============================================================================
// CONTENT STATUS OPERATIONS
// ============================================================================

/**
 * PUBLISH - PATCH /api/cms/content/:slug/publish
 * Changes content status to 'published'
 * 
 * URL Parameters:
 * - slug: The unique identifier for the content
 * 
 * Examples:
 * PATCH /api/cms/content/welcome-to-our-cms/publish
 * 
 * Response: 200 OK with updated content status, or 404 Not Found
 */
router.patch('/content/:slug/publish', cmsSimpleController.publishContent);

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

/**
 * STATISTICS - GET /api/cms/stats
 * Returns content statistics
 * 
 * Examples:
 * GET /api/cms/stats
 * 
 * Response: 200 OK with statistics data
 * {
 *   "success": true,
 *   "data": {
 *     "total": 5,
 *     "published": 3,
 *     "draft": 2,
 *     "archived": 0,
 *     "publishedPercentage": 60
 *   }
 * }
 */
router.get('/stats', cmsSimpleController.getContentStats);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 Handler for undefined routes
 * This middleware catches any requests to undefined routes
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'POST   /api/cms/content',
      'GET    /api/cms/content',
      'GET    /api/cms/content/:slug',
      'PUT    /api/cms/content/:slug',
      'DELETE /api/cms/content/:slug',
      'PATCH  /api/cms/content/:slug/publish',
      'GET    /api/cms/stats'
    ]
  });
});

module.exports = router; 