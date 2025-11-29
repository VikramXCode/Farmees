// Vercel Serverless Function Entry Point (ESM)
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const app = express();

// Environment variables (from Vercel dashboard)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';
let connectionPromise = null;

// Middlewares
app.use(cors());
app.use(express.json());

// Database connection
async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
}

// Database middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok', 
    service: 'farmease-api', 
    time: new Date().toISOString(),
    database: dbStatus,
    mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing'
  });
});

// Import routes from backend (using createRequire for CommonJS modules)
app.use('/api/lands', require('../backend/routes/lands'));
app.use('/api/ai-interactions', require('../backend/routes/ai-interactions'));
app.use('/api/recommendations', require('../backend/routes/recommendations'));
app.use('/api/diseases', require('../backend/routes/diseases'));
app.use('/api/pests', require('../backend/routes/pests'));
app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/soil', require('../backend/routes/soil'));
app.use('/api/crop-recommendations', require('../backend/routes/crop-recommendations'));
app.use('/api/weather', require('../backend/routes/weather'));
app.use('/api/ai', require('../backend/routes/ai'));
app.use('/api/officers', require('../backend/routes/officers'));
app.use('/api/escalations', require('../backend/routes/escalations'));
app.use('/api/alerts', require('../backend/routes/alerts'));
app.use('/api/market', require('../backend/routes/market'));
app.use('/api/connect', require('../backend/routes/connect'));

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FarmEase API', 
    endpoints: ['/api/health', '/api/auth', '/api/lands', '/api/weather', '/api/market']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
