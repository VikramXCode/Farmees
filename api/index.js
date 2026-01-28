// Vercel serverless function entry point
// This wraps the Express app to work with Vercel's serverless platform

const app = require('../backend/server');

module.exports = app;
