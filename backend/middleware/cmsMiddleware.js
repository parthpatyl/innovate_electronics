/**
 * CMS Middleware
 * Provides validation, error handling, and logging for CMS operations
 */

/**
 * Validate content creation/update requests
 */
const validateContent = (req, res, next) => {
  const { title, body, author } = req.body;

  // Check required fields
  if (!title || !body || !author) {
    return res.status(400).json({
      success: false,
      message: 'Title, body, and author are required fields'
    });
  }

  // Validate title length
  if (title.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Title cannot exceed 200 characters'
    });
  }

  // Validate body length (reasonable limit)
  if (body.length > 50000) {
    return res.status(400).json({
      success: false,
      message: 'Content body is too long (max 50,000 characters)'
    });
  }

  // Validate author length
  if (author.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Author name cannot exceed 100 characters'
    });
  }

  // Validate status if provided
  if (req.body.status && !['draft', 'published', 'archived'].includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be one of: draft, published, archived'
    });
  }

  // Validate excerpt length if provided
  if (req.body.excerpt && req.body.excerpt.length > 300) {
    return res.status(400).json({
      success: false,
      message: 'Excerpt cannot exceed 300 characters'
    });
  }

  // Validate meta title length if provided
  if (req.body.metaTitle && req.body.metaTitle.length > 60) {
    return res.status(400).json({
      success: false,
      message: 'Meta title cannot exceed 60 characters'
    });
  }

  // Validate meta description length if provided
  if (req.body.metaDescription && req.body.metaDescription.length > 160) {
    return res.status(400).json({
      success: false,
      message: 'Meta description cannot exceed 160 characters'
    });
  }

  // Sanitize slug if provided
  if (req.body.slug) {
    req.body.slug = req.body.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  // Validate page number
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive number'
    });
  }

  // Validate limit
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }

  // Set defaults
  req.query.page = page ? parseInt(page) : 1;
  req.query.limit = limit ? parseInt(limit) : 10;

  next();
};

/**
 * Validate slug parameter
 */
const validateSlug = (req, res, next) => {
  const { slug } = req.params;

  if (!slug || slug.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Slug is required'
    });
  }

  // Basic slug validation
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid slug format'
    });
  }

  next();
};

/**
 * Log CMS operations
 */
const logCMSOperation = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[CMS] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[CMS] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

/**
 * Error handling middleware for CMS routes
 */
const handleCMSError = (error, req, res, next) => {
  console.error('[CMS Error]', error);

  // MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Content with this slug already exists'
    });
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages
    });
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid content identifier'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimit = (req, res, next) => {
  // Simple in-memory rate limiting
  // In production, use Redis or a proper rate limiting library
  
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // requests per window

  // Initialize rate limit store if not exists
  if (!req.app.locals.rateLimitStore) {
    req.app.locals.rateLimitStore = new Map();
  }

  const store = req.app.locals.rateLimitStore;
  const key = `cms:${clientIP}`;
  
  if (!store.has(key)) {
    store.set(key, { count: 1, resetTime: now + windowMs });
  } else {
    const record = store.get(key);
    
    if (now > record.resetTime) {
      // Reset window
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
      
      if (record.count > maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.'
        });
      }
    }
  }

  next();
};

/**
 * CORS middleware for CMS routes
 */
const cmsCORS = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = {
  validateContent,
  validatePagination,
  validateSlug,
  logCMSOperation,
  handleCMSError,
  rateLimit,
  cmsCORS
}; 