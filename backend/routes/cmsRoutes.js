const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const {
  validateContent,
  validatePagination,
  validateSlug,
  logCMSOperation,
  handleCMSError,
  rateLimit,
  cmsCORS
} = require('../middleware/cmsMiddleware');

/**
 * CMS Routes
 * RESTful API endpoints for content management
 */

// Apply middleware to all CMS routes
router.use(logCMSOperation);
router.use(rateLimit);
router.use(cmsCORS);

// Create new content
// POST /api/cms/content
router.post('/content', validateContent, cmsController.createContent);

// Get all content with optional filtering
// GET /api/cms/content?status=published&author=John&page=1&limit=10
router.get('/content', validatePagination, cmsController.getAllContent);

// Get single content by slug
// GET /api/cms/content/:slug
router.get('/content/:slug', validateSlug, cmsController.getContentBySlug);

// Update content by slug
// PUT /api/cms/content/:slug
router.put('/content/:slug', validateSlug, validateContent, cmsController.updateContent);

// Delete content by slug
// DELETE /api/cms/content/:slug
router.delete('/content/:slug', validateSlug, cmsController.deleteContent);

// Publish content (change status to published)
// PATCH /api/cms/content/:slug/publish
router.patch('/content/:slug/publish', validateSlug, cmsController.publishContent);

// Archive content (change status to archived)
// PATCH /api/cms/content/:slug/archive
router.patch('/content/:slug/archive', validateSlug, cmsController.archiveContent);

// Get content statistics
// GET /api/cms/stats
router.get('/stats', cmsController.getContentStats);

// Error handling middleware (must be last)
router.use(handleCMSError);

module.exports = router; 