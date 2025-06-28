# CMS Testing Guide

This guide provides comprehensive testing examples for the CMS API endpoints. The CMS is available in two versions:

1. **Full CMS** (`/api/cms`) - Uses MongoDB with full features
2. **Simple CMS** (`/api/cms-simple`) - Uses in-memory storage for prototyping

## Quick Start

Start the server:
```bash
cd backend
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints Overview

### Content Management
- `POST /api/cms-simple/content` - Create new content
- `GET /api/cms-simple/content` - Get all content (with filtering/pagination)
- `GET /api/cms-simple/content/:slug` - Get single content by slug
- `PUT /api/cms-simple/content/:slug` - Update content by slug
- `DELETE /api/cms-simple/content/:slug` - Delete content by slug

### Content Status
- `PATCH /api/cms-simple/content/:slug/publish` - Publish content

### Analytics
- `GET /api/cms-simple/stats` - Get content statistics

---

## 1. CREATE Content (POST)

### cURL Example
```bash
curl -X POST http://localhost:5000/api/cms-simple/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Article",
    "body": "# Welcome to My Blog\n\nThis is my **first article** written in *Markdown*.\n\n## Features\n- Markdown support\n- RESTful API\n- Easy to use\n\n```javascript\nconsole.log(\"Hello, World!\");\n```",
    "author": "John Doe",
    "status": "draft"
  }'
```

### Postman Setup
- **Method**: POST
- **URL**: `http://localhost:5000/api/cms-simple/content`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "title": "My First Article",
  "body": "# Welcome to My Blog\n\nThis is my **first article** written in *Markdown*.\n\n## Features\n- Markdown support\n- RESTful API\n- Easy to use\n\n```javascript\nconsole.log(\"Hello, World!\");\n```",
  "author": "John Doe",
  "status": "draft"
}
```

### Expected Response
```json
{
  "success": true,
  "message": "Content created successfully",
  "data": {
    "id": 3,
    "title": "My First Article",
    "slug": "my-first-article",
    "author": "John Doe",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "body": "<h1>Welcome to My Blog</h1>\n<p>This is my <strong>first article</strong> written in <em>Markdown</em>.</p>\n<h2>Features</h2>\n<ul>\n<li>Markdown support</li>\n<li>RESTful API</li>\n<li>Easy to use</li>\n</ul>\n<pre><code class=\"language-javascript\">console.log(\"Hello, World!\");\n</code></pre>",
    "rawBody": "# Welcome to My Blog\n\nThis is my **first article** written in *Markdown*.\n\n## Features\n- Markdown support\n- RESTful API\n- Easy to use\n\n```javascript\nconsole.log(\"Hello, World!\");\n```"
  }
}
```

---

## 2. READ All Content (GET)

### cURL Examples

**Get all content:**
```bash
curl -X GET "http://localhost:5000/api/cms-simple/content"
```

**Get published content only:**
```bash
curl -X GET "http://localhost:5000/api/cms-simple/content?status=published"
```

**Get content by specific author:**
```bash
curl -X GET "http://localhost:5000/api/cms-simple/content?author=John%20Doe"
```

**Get content with pagination:**
```bash
curl -X GET "http://localhost:5000/api/cms-simple/content?page=1&limit=5"
```

### Postman Setup
- **Method**: GET
- **URL**: `http://localhost:5000/api/cms-simple/content`
- **Query Params** (optional):
  - `status`: `published`, `draft`, or `archived`
  - `author`: Author name
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 100)

### Expected Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Welcome to Our CMS",
      "slug": "welcome-to-our-cms",
      "author": "System Admin",
      "status": "published",
      "excerpt": "A welcome message introducing our CMS features",
      "tags": ["welcome", "cms", "introduction"],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "status": "all",
    "author": "all"
  }
}
```

---

## 3. READ Single Content (GET)

### cURL Example
```bash
curl -X GET "http://localhost:5000/api/cms-simple/content/welcome-to-our-cms"
```

### Postman Setup
- **Method**: GET
- **URL**: `http://localhost:5000/api/cms-simple/content/welcome-to-our-cms`

### Expected Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Welcome to Our CMS",
    "slug": "welcome-to-our-cms",
    "body": "<h1>Welcome!</h1>\n<p>This is a <strong>sample article</strong> created with our CMS.</p>\n<h2>Features</h2>\n<ul>\n<li>Markdown support</li>\n<li>RESTful API</li>\n<li>In-memory storage</li>\n</ul>\n<p><em>Enjoy exploring!</em></p>",
    "rawBody": "# Welcome!\n\nThis is a **sample article** created with our CMS.\n\n## Features\n- Markdown support\n- RESTful API\n- In-memory storage\n\n*Enjoy exploring!*",
    "author": "System Admin",
    "status": "published",
    "excerpt": "A welcome message introducing our CMS features",
    "tags": ["welcome", "cms", "introduction"],
    "featuredImage": null,
    "metaTitle": null,
    "metaDescription": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

## 4. UPDATE Content (PUT)

### cURL Example
```bash
curl -X PUT http://localhost:5000/api/cms-simple/content/my-first-article \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Updated Article",
    "body": "# Updated Article\n\nThis article has been **updated** with new content.\n\n## New Features\n- Better formatting\n- More examples\n- Enhanced readability",
    "status": "published"
  }'
```

### Postman Setup
- **Method**: PUT
- **URL**: `http://localhost:5000/api/cms-simple/content/my-first-article`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "title": "My Updated Article",
  "body": "# Updated Article\n\nThis article has been **updated** with new content.\n\n## New Features\n- Better formatting\n- More examples\n- Enhanced readability",
  "status": "published"
}
```

### Expected Response
```json
{
  "success": true,
  "message": "Content updated successfully",
  "data": {
    "id": 3,
    "title": "My Updated Article",
    "slug": "my-first-article",
    "body": "<h1>Updated Article</h1>\n<p>This article has been <strong>updated</strong> with new content.</p>\n<h2>New Features</h2>\n<ul>\n<li>Better formatting</li>\n<li>More examples</li>\n<li>Enhanced readability</li>\n</ul>",
    "rawBody": "# Updated Article\n\nThis article has been **updated** with new content.\n\n## New Features\n- Better formatting\n- More examples\n- Enhanced readability",
    "author": "John Doe",
    "status": "published",
    "excerpt": null,
    "tags": null,
    "featuredImage": null,
    "metaTitle": null,
    "metaDescription": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 5. PUBLISH Content (PATCH)

### cURL Example
```bash
curl -X PATCH http://localhost:5000/api/cms-simple/content/my-first-article/publish
```

### Postman Setup
- **Method**: PATCH
- **URL**: `http://localhost:5000/api/cms-simple/content/my-first-article/publish`

### Expected Response
```json
{
  "success": true,
  "message": "Content published successfully",
  "data": {
    "id": 3,
    "title": "My Updated Article",
    "slug": "my-first-article",
    "status": "published",
    "updatedAt": "2024-01-15T11:15:00.000Z"
  }
}
```

---

## 6. DELETE Content (DELETE)

### cURL Example
```bash
curl -X DELETE http://localhost:5000/api/cms-simple/content/my-first-article
```

### Postman Setup
- **Method**: DELETE
- **URL**: `http://localhost:5000/api/cms-simple/content/my-first-article`

### Expected Response
```json
{
  "success": true,
  "message": "Content deleted successfully",
  "deletedContent": {
    "id": 3,
    "title": "My Updated Article",
    "slug": "my-first-article"
  }
}
```

---

## 7. GET Statistics (GET)

### cURL Example
```bash
curl -X GET "http://localhost:5000/api/cms-simple/stats"
```

### Postman Setup
- **Method**: GET
- **URL**: `http://localhost:5000/api/cms-simple/stats`

### Expected Response
```json
{
  "success": true,
  "data": {
    "total": 2,
    "published": 2,
    "draft": 0,
    "archived": 0,
    "publishedPercentage": 100
  }
}
```

---

## Error Handling Examples

### 1. Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/cms-simple/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Incomplete Article"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Missing required fields: title, body, and author are required",
  "required": ["title", "body", "author"],
  "received": {
    "title": true,
    "body": false,
    "author": false
  }
}
```

### 2. Content Not Found
```bash
curl -X GET "http://localhost:5000/api/cms-simple/content/non-existent-slug"
```

**Response:**
```json
{
  "success": false,
  "message": "Content with slug \"non-existent-slug\" not found",
  "slug": "non-existent-slug"
}
```

### 3. Invalid Status
```bash
curl -X POST http://localhost:5000/api/cms-simple/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "body": "Test content",
    "author": "Test Author",
    "status": "invalid-status"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: draft, published, archived",
  "received": "invalid-status"
}
```

---

## Testing Workflow

1. **Create content** - POST to `/content`
2. **List all content** - GET `/content`
3. **Get specific content** - GET `/content/:slug`
4. **Update content** - PUT `/content/:slug`
5. **Publish content** - PATCH `/content/:slug/publish`
6. **Check statistics** - GET `/stats`
7. **Delete content** - DELETE `/content/:slug`

## Markdown Examples

The CMS supports full Markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
`inline code`

```javascript
// Code block
console.log("Hello, World!");
```

- Unordered list
- Another item
  - Nested item

1. Ordered list
2. Second item

[Link text](https://example.com)

![Alt text](image-url.jpg)

> Blockquote
> Multiple lines
```

---

## Switching Between CMS Versions

- **Simple CMS (In-Memory)**: Use `/api/cms-simple/*` endpoints
- **Full CMS (MongoDB)**: Use `/api/cms/*` endpoints

Both versions have the same API structure, but the simple version is perfect for:
- Learning and prototyping
- Testing without database setup
- Educational purposes
- Quick development iterations 