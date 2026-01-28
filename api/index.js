// Vercel serverless function entry point
// This wraps the Express app to work with Vercel's serverless platform

const path = require('path');

// Set working directory for backend
process.chdir(path.join(__dirname, '..'));

let app;

try {
  app = require('../backend/server');
  console.log('✅ Backend server loaded successfully');
} catch (error) {
  console.error('❌ Error loading backend server:', error);
  throw error;
}

module.exports = app;
