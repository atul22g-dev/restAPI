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

// Import routes
const productRoutes = require('./routes/Product.routes');
const notesRoutes = require('./routes/notesRoutes.routes');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');
const { cronAuth } = require('./middleware/auth.middleware');

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

/**
 * Wait for a connecting connection to resolve to either connected or disconnected.
 * Returns false if disconnected/timed out, true if connected.
 */
function waitForConnection(timeoutMs = 8000) {
  const readyState = mongoose.connection.readyState;
  // Already connected
  if (readyState === 1) return Promise.resolve(true);
  // Not in a connecting state — won't become connected
  if (readyState !== 2) return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(mongoose.connection.readyState === 1);
      }
    }, timeoutMs);

    const onConnected = () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(true);
      }
    };
    const onDisconnected = () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(false);
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      mongoose.connection.removeListener('connected', onConnected);
      mongoose.connection.removeListener('disconnected', onDisconnected);
    };

    mongoose.connection.once('connected', onConnected);
    mongoose.connection.once('disconnected', onDisconnected);
  });
}

// Database status endpoint
app.get('/api/status', async (_req, res, next) => {
  try {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    let dbState = mongoose.connection.readyState;

    // If connecting, wait to see if it becomes connected or disconnected
    if (dbState === 2) {
      const becameConnected = await waitForConnection();
      // Re-check state after wait
      dbState = becameConnected ? 1 : mongoose.connection.readyState;
    }

    // If still not connected after waiting (or was disconnected/disconnecting), return 503
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'error',
        message: 'Database is not connected',
        data: {
          database: states[dbState] || 'unknown',
          uptime: process.uptime(),
          uptime_hours: (process.uptime() / 3600).toFixed(2),
        },
      });
    }

    // Ping is lightweight and fast — replaces expensive serverStatus()
    const pingResult = await mongoose.connection.db
      .admin()
      .ping();

    const dbName = mongoose.connection.db.databaseName;

    // Stats with a 3-second timeout using Promise.race
    const statsPromise = mongoose.connection.db.stats();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('stats timed out')), 3000)
    );
    const stats = await Promise.race([statsPromise, timeoutPromise]).catch(
      () => null
    );

    res.json({
      status: 'success',
      message: 'Server is running',
      data: {
        database: states[dbState],
        db_Name: dbName,
        ping: pingResult.ok === 1 ? 'ok' : 'fail',
        uptime: process.uptime(),
        uptime_hours: (process.uptime() / 3600).toFixed(2),
        collections: stats?.collections ?? null,
        documents: stats?.objects ?? null,
        indexes: stats?.indexes ?? null,
        data_size: stats?.dataSize
          ? (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB'
          : null,
        storage_size: stats?.storageSize
          ? (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB'
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── MongoDB Connection CronJob ─────────────────────────────────────────────────────

app.get("/api/db-heartbeat", cronAuth, async (req, res) => {
  try {
    await connectDB()
    await mongoose.connection.db
      .collection("heartbeat")
      .updateOne(
        { _id: "heartbeat" },
        { $set: { lastRun: new Date() } },
        { upsert: true }
      );

    res.json({
      success: true,
      message: "Heartbeat updated"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
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
