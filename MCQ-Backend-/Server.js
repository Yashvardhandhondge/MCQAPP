require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const mcqRoutes = require('./routes/mcq.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(
  cors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200 // For legacy browser support
  })
);
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Middleware to ensure database connection before API requests (for serverless)
app.use('/api', async (req, res, next) => {
  // Check if already connected (readyState: 1 = connected, 2 = connecting)
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  
  // Ensure database is connected (connection is cached in db.js)
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Add middleware to disable caching for API responses
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': false
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add debugging middleware to see what routes are registered
app.use('/api/auth', (req, res, next) => {
  console.log(`Auth Route accessed: ${req.method} ${req.originalUrl}`);
  console.log('Request body:', req.body);
  next();
});

app.use('/api/mcq', (req, res, next) => {
  console.log(`MCQ Route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/mcq', mcqRoutes);

app.use(notFound);
app.use(errorHandler);

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  const PORT = process.env.PORT || 8000;

  connectDB()
    .then(() => {
      // Listen on all network interfaces (0.0.0.0) to allow access from other devices
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Server accessible at http://localhost:${PORT}`);
        console.log(`Server accessible at http://0.0.0.0:${PORT}`);
        console.log(`MCQ routes registered at /api/mcq`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

// Export app for Vercel serverless functions
module.exports = app;

