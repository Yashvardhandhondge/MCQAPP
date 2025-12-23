// Vercel serverless function entry point
const { connectDB } = require('../config/db');

// Connect to database when module loads (connection is cached in db.js)
// This ensures the database is ready before any requests are handled
connectDB().catch(err => {
  console.error('Initial database connection error:', err);
  // Don't throw - let it retry on first request via middleware
});

// Import and export the Express app
const app = require('../Server');

module.exports = app;





