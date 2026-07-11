# ProductAPI

A modern REST API for product management with CRUD operations, advanced filtering, pagination, and a full-featured dashboard UI. Built with Node.js, Express, MongoDB, and Handlebars.

## Features

### API
- **Full CRUD** — Create, Read, Update, and Delete products
- **Advanced Filtering** — Filter by `featured`, `company`, `search` (regex name match), and numeric operators (`price[gt]`, `price[gte]`, `price[lt]`, `price[lte]`, `rating[gte]`)
- **Sorting** — Sort by any field(s), comma-separated, prefix with `-` for descending
- **Field Selection** — Request only the fields you need
- **Pagination** — Built-in pagination with page and limit parameters
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **Security Headers** — Helmet.js with strict CSP
- **Consistent Responses** — Unified `{ status, message, data }` response format

### Dashboard (Web UI)
- **Product Explorer** — Search, filter, and browse products visually
- **Add Product** — Form with real-time validation
- **Manage Products** — DataTable with inline edit via modal and delete with confirmation
- **Dark Mode** — Full dark mode support with system preference detection
- **Cluster Management** — Live MongoDB connection status indicator with Take Down / Bring Up controls
- **Responsive Design** — Works on desktop and mobile

### Developer Tools
- **Database Status** — Health check at `/api/status`
- **Docker Support** — Multi-stage Dockerfile with non-root user

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Framework | Express 4.21 |
| Database | MongoDB with Mongoose 8 |
| View Engine | Handlebars (hbs) |
| UI | Bootstrap 5.3, Font Awesome 6, DataTables |
| Security | Helmet 7, CORS, express-rate-limit |
| Testing | Jest + Supertest |
| Deployment | Docker (multi-stage Alpine) |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd restAPI
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   DB=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   PORT=3000
   NODE_ENV=development
   ```

4. Start the server
   ```bash
   npm start        # Production mode
   npm run dev      # Development mode with auto-reload
   ```

5. Open http://localhost:3000 in your browser

## API Reference

Base URL: `http://localhost:3000/api/products`

### List Products

```http
GET /api/products
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `featured` | boolean | Filter by featured status (`true` / `false`) |
| `company` | string | Filter by company (`apple`, `samsung`, `dell`, `mi`, `asus`) |
| `search` | string | Case-insensitive name search (regex) |
| `price[gt]` | number | Price greater than |
| `price[gte]` | number | Price greater than or equal |
| `price[lt]` | number | Price less than |
| `price[lte]` | number | Price less than or equal |
| `rating[gt]` / `rating[gte]` / `rating[lt]` / `rating[lte]` | number | Rating comparison operators |
| `sort` | string | Sort fields, comma-separated. Prefix with `-` for DESC |
| `fields` | string | Select specific fields, comma-separated |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |

**Example:**
```bash
curl "http://localhost:3000/api/products?company=apple&price[gte]=500&sort=-price&page=1&limit=5"
```

### Get Single Product

```http
GET /api/products/:id
```

### Create Product

```http
POST /api/products
Content-Type: application/json

{
  "name": "iPhone 14",
  "price": 999,
  "company": "apple",
  "rating": 4.8,
  "featured": true
}
```

### Update Product

```http
PUT /api/products/:id
Content-Type: application/json

{
  "name": "iPhone 15",
  "price": 1099
}
```

> Partial updates are supported — send only the fields you want to change.

### Delete Product

```http
DELETE /api/products/:id
```

### Response Format

All API responses follow a consistent structure:

```json
{
  "status": "success",
  "message": "Products retrieved successfully",
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  }
}
```

### Cluster Management (Development Only)

These endpoints are **disabled in production** and are useful for testing error handling.

```http
GET /api/status
```
Returns current server status including database connection state and uptime.

## Project Structure

```
├── controllers/
│   ├── Product.controller.js    # Product CRUD logic
│   └── notes.controller.js      # Page view rendering
├── middleware/
│   ├── errorHandler.js          # Global error handler + asyncHandler
│   └── validate.js              # Request validation middleware
├── models/
│   └── Product.model.js         # Mongoose product schema
├── public/
│   └── css/
│       └── style.css            # Global styles (with dark mode)
├── routes/
│   ├── Product.routes.js        # Product API routes
│   └── notesRoutes.routes.js    # Page view routes
├── tests/
│   └── product.test.js          # Test suite (10 tests)
├── utils/
│   └── response.js              # Unified API response helpers
├── views/
│   ├── index.hbs                # Dashboard
│   ├── createForm.hbs           # Add Product form
│   ├── updateProduct.hbs        # Manage Products table
│   ├── error404.hbs             # 404 page
│   └── partials/
│       ├── _head.hbs            # HTML head partial
│       ├── _navbar.hbs          # Navigation bar (with dark mode toggle)
│       └── _footer.hbs          # Footer + scripts
├── db.js                        # MongoDB connection
├── server.js                    # Express app entry point
├── Dockerfile                   # Multi-stage Docker build
└── package.json
```

## Testing

```bash
npm test
```

The test suite covers:
- Product creation, retrieval, update, and deletion
- Error handling (missing fields, unsupported companies, non-existent IDs)
- Pagination and filtering

## Docker

```bash
# Build the image
docker build -t productapi .

# Run the container
docker run -p 3000:3000 --env-file .env productapi
```

The Dockerfile uses:
- Multi-stage build for smaller images
- `node:20-alpine` base for minimal footprint
- Non-root user for security
- `npm ci` for deterministic installs

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB` | Yes | — | MongoDB connection string |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
