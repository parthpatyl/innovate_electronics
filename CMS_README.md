# Custom Content Management System (CMS)

A comprehensive, educational CMS built with Express.js, featuring both MongoDB and in-memory storage options. Perfect for learning RESTful API development and content management systems.

## 🚀 Features

### Core Features
- **Full CRUD Operations** - Create, Read, Update, Delete content
- **Markdown Support** - Write content in Markdown, automatically converted to HTML
- **RESTful API** - Clean, predictable endpoints following REST conventions
- **Content Status Management** - Draft, Published, Archived states
- **Slug-based URLs** - SEO-friendly URLs for content
- **Pagination & Filtering** - Efficient content browsing
- **Statistics & Analytics** - Content metrics and insights

### Storage Options
- **MongoDB Version** (`/api/cms`) - Full-featured with persistent storage
- **In-Memory Version** (`/api/cms-simple`) - Perfect for prototyping and learning

### Educational Features
- **Comprehensive Comments** - Every function is thoroughly documented
- **Step-by-step Logic** - Clear progression through each operation
- **Error Handling** - Detailed error messages for learning
- **Testing Guide** - Complete curl and Postman examples

## 📋 Content Schema

```javascript
{
  title: String,           // Required: Content title
  slug: String,            // Auto-generated: URL-friendly identifier
  body: String,            // Required: Content body (Markdown)
  author: String,          // Required: Content author
  status: String,          // Enum: 'draft', 'published', 'archived'
  excerpt: String,         // Optional: Content summary
  tags: [String],          // Optional: Content tags
  featuredImage: String,   // Optional: Featured image URL
  metaTitle: String,       // Optional: SEO meta title
  metaDescription: String, // Optional: SEO meta description
  createdAt: Date,         // Auto-generated: Creation timestamp
  updatedAt: Date          // Auto-generated: Last update timestamp
}
```

## 🛠️ API Endpoints

### Content Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cms-simple/content` | Create new content |
| `GET` | `/api/cms-simple/content` | Get all content (with filtering/pagination) |
| `GET` | `/api/cms-simple/content/:slug` | Get single content by slug |
| `PUT` | `/api/cms-simple/content/:slug` | Update content by slug |
| `DELETE` | `/api/cms-simple/content/:slug` | Delete content by slug |

### Content Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/api/cms-simple/content/:slug/publish` | Publish content |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cms-simple/stats` | Get content statistics |

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will run on `http://localhost:5000`

### 3. Test the API
```bash
# Create your first article
curl -X POST http://localhost:5000/api/cms-simple/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello World",
    "body": "# My First Article\n\nWelcome to our CMS!",
    "author": "Your Name"
  }'

# Get all content
curl http://localhost:5000/api/cms-simple/content
```

## 📚 Learning Path

### For Junior Developers

1. **Start with the Simple Version**
   - Use `/api/cms-simple/*` endpoints
   - No database setup required
   - Perfect for understanding the flow

2. **Study the Code Structure**
   ```
   backend/
   ├── models/
   │   ├── Content.js              # MongoDB schema
   │   └── ContentInMemory.js      # In-memory storage
   ├── controllers/
   │   ├── cmsController.js        # Full MongoDB controller
   │   └── cmsSimpleController.js  # Simple in-memory controller
   ├── routes/
   │   ├── cmsRoutes.js            # Full CMS routes
   │   └── cmsSimpleRoutes.js      # Simple CMS routes
   └── middleware/
       └── cmsMiddleware.js        # Validation and error handling
   ```

3. **Follow the Data Flow**
   - Request → Route → Controller → Model → Response
   - Each step is clearly commented and documented

4. **Practice with the Testing Guide**
   - Use the provided curl commands
   - Import the Postman collection
   - Experiment with different scenarios

### Key Concepts to Learn

#### 1. RESTful API Design
- **Resource-based URLs**: `/content`, `/content/:slug`
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- **Status Codes**: 200, 201, 400, 404, 500
- **Consistent Response Format**: `{ success, message, data }`

#### 2. Content Management Patterns
- **CRUD Operations**: Create, Read, Update, Delete
- **Status Workflow**: Draft → Published → Archived
- **Slug Generation**: Auto-create URL-friendly identifiers
- **Validation**: Required fields, data types, business rules

#### 3. Markdown Processing
- **Input**: Raw Markdown text
- **Processing**: Convert to HTML using `marked` library
- **Storage**: Both HTML and raw Markdown versions
- **Output**: Rendered HTML for display

#### 4. Error Handling
- **Validation Errors**: Missing fields, invalid data
- **Business Logic Errors**: Duplicate slugs, not found
- **System Errors**: Database issues, parsing errors
- **User-friendly Messages**: Clear, actionable error responses

## 🔧 Architecture Overview

### In-Memory Storage (`ContentInMemory.js`)
```javascript
class ContentInMemory {
  constructor() {
    this.content = [];        // Simple array storage
    this.counter = 1;         // Auto-incrementing ID
  }
  
  async create(data) { /* ... */ }
  async find(filter, options) { /* ... */ }
  async findOne(filter) { /* ... */ }
  async findOneAndUpdate(filter, data) { /* ... */ }
  async deleteOne(filter) { /* ... */ }
}
```

**Benefits:**
- No database setup required
- Instant prototyping
- Easy to understand data flow
- Perfect for learning

### MongoDB Storage (`Content.js`)
```javascript
const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  body: { type: String, required: true },
  // ... more fields
});
```

**Benefits:**
- Persistent storage
- Advanced querying
- Data validation
- Production-ready

## 📖 Code Examples

### Creating Content
```javascript
// Controller logic
const createContent = async (req, res) => {
  try {
    // Step 1: Validate required fields
    const { title, body, author } = req.body;
    if (!title || !body || !author) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Step 2: Parse markdown to HTML
    const htmlBody = marked(body);

    // Step 3: Create content
    const contentData = {
      title: title.trim(),
      body: htmlBody,
      rawBody: body,
      author: author.trim(),
      status: 'draft'
    };

    const newContent = await ContentInMemory.create(contentData);

    // Step 4: Return response
    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: newContent
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
```

### Reading Content with Filtering
```javascript
const getAllContent = async (req, res) => {
  try {
    const { status, author, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (author) filter.author = author;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const content = await ContentInMemory.find(filter, {
      sort: '-createdAt',
      skip: skip,
      limit: limitNum
    });

    const total = await ContentInMemory.countDocuments(filter);

    res.json({
      success: true,
      data: content,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
```

## 🧪 Testing

### Using cURL
```bash
# Create content
curl -X POST http://localhost:5000/api/cms-simple/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "body": "# Test\n\nThis is a test article.",
    "author": "Test Author"
  }'

# Get all content
curl http://localhost:5000/api/cms-simple/content

# Get specific content
curl http://localhost:5000/api/cms-simple/content/test-article

# Update content
curl -X PUT http://localhost:5000/api/cms-simple/content/test-article \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Article",
    "status": "published"
  }'

# Delete content
curl -X DELETE http://localhost:5000/api/cms-simple/content/test-article
```

### Using Postman
1. Import the provided collection
2. Set the base URL to `http://localhost:5000`
3. Use the pre-configured requests
4. Modify the request bodies as needed

## 🔄 Migration Path

### From In-Memory to MongoDB
1. **Start Simple**: Use in-memory version for learning
2. **Understand Patterns**: Learn the API structure and flow
3. **Switch Storage**: Change from `ContentInMemory` to `Content` model
4. **Add Features**: Leverage MongoDB's advanced capabilities

### Code Changes Required
```javascript
// In-memory version
const ContentInMemory = require('../models/ContentInMemory');
const content = await ContentInMemory.create(data);

// MongoDB version
const Content = require('../models/Content');
const content = await Content.create(data);
```

## 🎯 Best Practices Demonstrated

### 1. Error Handling
- **Consistent Format**: All errors follow the same structure
- **Meaningful Messages**: Clear, actionable error descriptions
- **Proper Status Codes**: HTTP status codes match the error type
- **Logging**: Errors are logged for debugging

### 2. Input Validation
- **Required Fields**: Check for missing required data
- **Data Types**: Validate data types and formats
- **Business Rules**: Enforce domain-specific constraints
- **Sanitization**: Clean and normalize input data

### 3. Response Format
- **Consistent Structure**: All responses follow the same pattern
- **Success Indicator**: Boolean flag for easy client-side handling
- **Meaningful Messages**: Human-readable success/error messages
- **Data Wrapping**: Consistent data packaging

### 4. Code Organization
- **Separation of Concerns**: Routes, controllers, models, middleware
- **Single Responsibility**: Each function has one clear purpose
- **Reusability**: Common functionality extracted to middleware
- **Maintainability**: Clear structure and documentation

## 🚀 Next Steps

### For Learning
1. **Study the Code**: Read through each file and understand the flow
2. **Run the Examples**: Use the testing guide to experiment
3. **Modify and Extend**: Add new features or modify existing ones
4. **Switch to MongoDB**: Try the full version with persistent storage

### For Production
1. **Add Authentication**: Implement user authentication and authorization
2. **Add File Uploads**: Support for images and file attachments
3. **Add Search**: Implement full-text search capabilities
4. **Add Caching**: Implement Redis or similar for performance
5. **Add Rate Limiting**: Protect against abuse
6. **Add Logging**: Comprehensive logging and monitoring

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Markdown Guide](https://www.markdownguide.org/)
- [REST API Design](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)

## 🤝 Contributing

This CMS is designed for educational purposes. Feel free to:
- Fork the repository
- Add new features
- Improve documentation
- Fix bugs
- Share your learning experience

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Learning! 🎓**

This CMS is designed to help you understand the fundamentals of building content management systems. Start with the simple version, experiment with the code, and gradually explore more advanced features as you become comfortable with the concepts. 