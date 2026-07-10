const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hbs = require('hbs');

// Load environment variables
dotenv.config();

// Import connectDB
const connectDB = require('./db');

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

// ─── 404 Handler ────────────────────────────────────────────────────────────

app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
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
