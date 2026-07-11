const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const hbs = require('hbs');

// Load environment variables
dotenv.config();

const connectDB = require('./db');
const { DB_URI } = connectDB;

// Import routes
const productRoutes = require('./routes/Product.routes');
const notesRoutes = require('./routes/notesRoutes.routes');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Security & Monitoring Middleware ────────────────────────────────────────

// HTTP security headers with relaxed CSP for CDN resources in views
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://code.jquery.com',
        'https://cdn.datatables.net',
      ],
      'script-src-attr': ["'unsafe-inline'"],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://cdn.datatables.net',
        'https://cdnjs.cloudflare.com',
        'https://fonts.googleapis.com',
      ],
      'font-src': [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com',
        'https://fonts.gstatic.com',
      ],
      'img-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
    },
  },
}));

// CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Body Parsing ───────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ───────────────────────────────────────────────────────────

const staticOptions = {
  // Disable caching during development to prevent stale CSS/JS
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  },
};
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

// ─── View Engine (Handlebars) ───────────────────────────────────────────────

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// ─── Routes ─────────────────────────────────────────────────────────────────

// View routes
app.use('/', notesRoutes);

// API routes
app.use('/api/products', productRoutes);

// Database status endpoint
app.get('/api/status', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({
    status: 'success',
    message: `Server is running`,
    data: {
      database: states[dbState] || 'unknown',
      uptime: process.uptime(),
    },
  });
});

// Atlas API configuration
const ATLAS_BASE_URL = 'https://cloud.mongodb.com/api/atlas/v2';
const ATLAS_PROJECT_ID = process.env.ATLAS_PROJECT_ID;
const ATLAS_CLUSTER_NAME = process.env.ATLAS_CLUSTER_NAME;
const ATLAS_PUBLIC_KEY = process.env.ATLAS_PUBLIC_KEY;
const ATLAS_PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY;

/**
 * Validate that all required Atlas environment variables are set
 */
const validateAtlasConfig = (res) => {
  const missing = [];
  if (!ATLAS_PROJECT_ID) missing.push('ATLAS_PROJECT_ID');
  if (!ATLAS_CLUSTER_NAME) missing.push('ATLAS_CLUSTER_NAME');
  if (!ATLAS_PUBLIC_KEY) missing.push('ATLAS_PUBLIC_KEY');
  if (!ATLAS_PRIVATE_KEY) missing.push('ATLAS_PRIVATE_KEY');

  if (missing.length > 0) {
    res.status(500).json({
      status: 'error',
      message: `Missing Atlas configuration: ${missing.join(', ')}`,
    });
    return false;
  }
  return true;
};

// ─── API Documentation ────────────────────────────────────────────────────────

app.get('/api/docs', (_req, res) => {
  res.json({
    status: 'success',
    message: 'ProductAPI Documentation',
    data: {
      baseUrl: '/api/products',
      methods: {
        GET: {
          description: 'List all products with filtering, sorting, and pagination',
          queryParameters: {
            featured: 'Filter by featured status (true/false)',
            company: 'Filter by company name (apple, samsung, dell, mi, asus)',
            search: 'Search products by name (case-insensitive regex)',
            'price[gt]': 'Price greater than (e.g. price[gt]=100)',
            'price[gte]': 'Price greater than or equal',
            'price[lt]': 'Price less than',
            'price[lte]': 'Price less than or equal',
            'rating[gte]': 'Rating greater than or equal (e.g. rating[gte]=4)',
            sort: 'Sort by field(s), comma-separated, prefix with - for DESC (e.g. sort=-price,name)',
            fields: 'Select specific fields, comma-separated (e.g. fields=name,price)',
            page: 'Page number (default: 1)',
            limit: 'Results per page (default: 10)',
          },
          example: '/api/products?company=apple&price[gte]=500&sort=-price&page=1&limit=5',
        },
        'GET /:id': {
          description: 'Get a single product by its MongoDB ID',
        },
        POST: {
          description: 'Create a new product',
          body: {
            name: 'String (required)',
            price: 'Number (required)',
            company: 'String: apple, samsung, dell, mi, asus (required)',
            rating: 'Number: 0-5 (optional, default: 4.9)',
            featured: 'Boolean (optional, default: false)',
          },
        },
        'PUT /:id': {
          description: 'Update an existing product (partial updates allowed)',
          body: 'Any subset of: name, price, company, rating, featured',
        },
        'DELETE /:id': {
          description: 'Delete a product',
        },
      },
      statusEndpoint: '/api/status',
    },
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────

app.all('*', (req, res) => {
  // Return HTML for browser requests, JSON for API requests
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) {
    res.status(404).render('error404', { url: req.originalUrl });
  } else {
    res.status(404).json({
      status: 'error',
      message: `Route ${req.originalUrl} not found`,
    });
  }
});

// ─── Global Error Handler ───────────────────────────────────────────────────

app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  });
}

module.exports = app;
