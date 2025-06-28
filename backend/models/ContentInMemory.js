/**
 * In-Memory Content Model for CMS Prototyping
 * Provides the same interface as MongoDB Content model but uses JavaScript arrays
 * Perfect for educational purposes and rapid prototyping
 */

class ContentInMemory {
  constructor() {
    // In-memory storage using array
    this.content = [];
    this.counter = 1; // Simple ID counter
  }

  /**
   * Create new content
   * @param {Object} contentData - Content data
   * @returns {Object} Created content
   */
  async create(contentData) {
    const newContent = {
      _id: this.counter++,
      ...contentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Auto-generate slug if not provided
    if (!newContent.slug) {
      newContent.slug = this.generateSlug(newContent.title);
    }

    // Ensure slug uniqueness
    newContent.slug = await this.ensureUniqueSlug(newContent.slug, newContent._id);

    this.content.push(newContent);
    return newContent;
  }

  /**
   * Find all content with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options (sort, skip, limit)
   * @returns {Array} Array of content
   */
  async find(filter = {}, options = {}) {
    let results = [...this.content];

    // Apply filters
    if (filter.status) {
      results = results.filter(item => item.status === filter.status);
    }
    if (filter.author) {
      results = results.filter(item => item.author === filter.author);
    }

    // Apply sorting
    if (options.sort) {
      const [field, order] = options.sort.startsWith('-') 
        ? [options.sort.slice(1), 'desc'] 
        : [options.sort, 'asc'];
      
      results.sort((a, b) => {
        if (order === 'desc') {
          return new Date(b[field]) - new Date(a[field]);
        }
        return new Date(a[field]) - new Date(b[field]);
      });
    }

    // Apply pagination
    if (options.skip) {
      results = results.slice(options.skip);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Find content by slug
   * @param {Object} filter - Filter object with slug
   * @returns {Object|null} Content or null
   */
  async findOne(filter) {
    if (filter.slug) {
      return this.content.find(item => item.slug === filter.slug) || null;
    }
    return null;
  }

  /**
   * Find and update content
   * @param {Object} filter - Filter criteria
   * @param {Object} updateData - Data to update
   * @param {Object} options - Update options
   * @returns {Object|null} Updated content
   */
  async findOneAndUpdate(filter, updateData, options = {}) {
    const index = this.content.findIndex(item => item.slug === filter.slug);
    
    if (index === -1) {
      return null;
    }

    // Update the content
    this.content[index] = {
      ...this.content[index],
      ...updateData,
      updatedAt: new Date()
    };

    return this.content[index];
  }

  /**
   * Delete content by slug
   * @param {Object} filter - Filter criteria
   * @returns {boolean} Success status
   */
  async deleteOne(filter) {
    const index = this.content.findIndex(item => item.slug === filter.slug);
    
    if (index === -1) {
      return false;
    }

    this.content.splice(index, 1);
    return true;
  }

  /**
   * Count documents
   * @param {Object} filter - Filter criteria
   * @returns {number} Count of documents
   */
  async countDocuments(filter = {}) {
    let results = [...this.content];

    if (filter.status) {
      results = results.filter(item => item.status === filter.status);
    }
    if (filter.author) {
      results = results.filter(item => item.author === filter.author);
    }

    return results.length;
  }

  /**
   * Generate slug from title
   * @param {string} title - Title to convert to slug
   * @returns {string} Generated slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Ensure slug uniqueness
   * @param {string} slug - Original slug
   * @param {number} excludeId - ID to exclude from uniqueness check
   * @returns {string} Unique slug
   */
  async ensureUniqueSlug(slug, excludeId = null) {
    let uniqueSlug = slug;
    let counter = 1;

    while (this.content.some(item => 
      item.slug === uniqueSlug && item._id !== excludeId
    )) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  /**
   * Get content statistics
   * @returns {Object} Statistics object
   */
  async getStats() {
    const total = this.content.length;
    const published = this.content.filter(item => item.status === 'published').length;
    const draft = this.content.filter(item => item.status === 'draft').length;
    const archived = this.content.filter(item => item.status === 'archived').length;

    return {
      total,
      published,
      draft,
      archived
    };
  }

  /**
   * Clear all content (useful for testing)
   */
  clear() {
    this.content = [];
    this.counter = 1;
  }

  /**
   * Get all content (for debugging)
   * @returns {Array} All content
   */
  getAll() {
    return [...this.content];
  }
}

// Create singleton instance
const contentInMemory = new ContentInMemory();

// Add some sample data for testing
contentInMemory.create({
  title: 'Welcome to Our CMS',
  body: '# Welcome!\n\nThis is a **sample article** created with our CMS.\n\n## Features\n- Markdown support\n- RESTful API\n- In-memory storage\n\n*Enjoy exploring!*',
  author: 'System Admin',
  status: 'published',
  excerpt: 'A welcome message introducing our CMS features',
  tags: ['welcome', 'cms', 'introduction']
});

contentInMemory.create({
  title: 'Getting Started with Markdown',
  body: '## Markdown Basics\n\nYou can use **bold**, *italic*, and `code`.\n\n```javascript\nconsole.log("Hello, CMS!");\n```\n\n- Lists work too\n- Like this one',
  author: 'Content Editor',
  status: 'published',
  excerpt: 'Learn the basics of Markdown formatting',
  tags: ['markdown', 'tutorial', 'formatting']
});

module.exports = contentInMemory; 