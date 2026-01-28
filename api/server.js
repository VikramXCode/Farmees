// Vercel Serverless Function Entry Point (ESM)
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const app = express();

// Set Vercel environment flag for child modules
process.env.VERCEL = '1';

// Environment variables (from Vercel dashboard)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';
let connectionPromise = null;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Mode', 'X-Requested-With']
}));

// Body parser with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

// Demo mode middleware
import { demoModeMiddleware } from './middleware/demoMode.js';
app.use(demoModeMiddleware);

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
const backendPath = path.join(__dirname, '..', 'backend');
app.use('/api/lands', require(path.join(backendPath, 'routes', 'lands')));
app.use('/api/ai-interactions', require(path.join(backendPath, 'routes', 'ai-interactions')));
app.use('/api/recommendations', require(path.join(backendPath, 'routes', 'recommendations')));
app.use('/api/diseases', require(path.join(backendPath, 'routes', 'diseases')));
app.use('/api/pests', require(path.join(backendPath, 'routes', 'pests')));
app.use('/api/auth', require(path.join(backendPath, 'routes', 'auth')));
app.use('/api/soil', require(path.join(backendPath, 'routes', 'soil')));
app.use('/api/crop-recommendations', require(path.join(backendPath, 'routes', 'crop-recommendations')));
app.use('/api/weather', require(path.join(backendPath, 'routes', 'weather')));
app.use('/api/ai', require(path.join(backendPath, 'routes', 'ai')));
app.use('/api/officers', require(path.join(backendPath, 'routes', 'officers')));
app.use('/api/escalations', require(path.join(backendPath, 'routes', 'escalations')));
app.use('/api/alerts', require(path.join(backendPath, 'routes', 'alerts')));
app.use('/api/market', require(path.join(backendPath, 'routes', 'market')));
app.use('/api/connect', require(path.join(backendPath, 'routes', 'connect')));
app.use('/api/labour', require(path.join(backendPath, 'routes', 'labour')));
app.use('/api/analytics', require(path.join(backendPath, 'routes', 'analytics')));

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Farmees API', 
    version: '1.0.0',
    environment: 'vercel',
    endpoints: ['/api/health', '/api/auth', '/api/lands', '/api/weather', '/api/market', '/api/analytics']
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Export for Vercel serverless functions
export default app;
