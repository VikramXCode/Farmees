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
    mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
    dirname: __dirname,
    cwd: process.cwd()
  });
});

// Import routes from backend (using createRequire for CommonJS modules)
const backendPath = path.join(__dirname, '..', 'backend');
const localRoutesPath = path.join(__dirname, 'routes');

// Try to load routes with error handling - prefer local routes, fallback to backend
let routesLoaded = {};
const loadRoute = (name, localPath, backendRoutePath) => {
  // Try local route first (in api folder)
  try {
    const route = require(localPath);
    routesLoaded[name] = 'local';
    return route;
  } catch (localErr) {
    // Try backend route as fallback
    try {
      const route = require(backendRoutePath);
      routesLoaded[name] = 'backend';
      return route;
    } catch (backendErr) {
      console.error(`Failed to load route ${name}:`, backendErr.message);
      routesLoaded[name] = backendErr.message;
      // Return a placeholder router that returns error
      const placeholder = express.Router();
      placeholder.all('*', (req, res) => {
        res.status(500).json({ error: `Route ${name} failed to load`, details: backendErr.message });
      });
      return placeholder;
    }
  }
};

// Auth route - use local version
app.use('/api/auth', loadRoute('auth', path.join(localRoutesPath, 'auth'), path.join(backendPath, 'routes', 'auth')));

// Other routes - try backend first (will fail on Vercel, use placeholder)
app.use('/api/lands', loadRoute('lands', path.join(localRoutesPath, 'lands'), path.join(backendPath, 'routes', 'lands')));
app.use('/api/ai-interactions', loadRoute('ai-interactions', path.join(localRoutesPath, 'ai-interactions'), path.join(backendPath, 'routes', 'ai-interactions')));
app.use('/api/recommendations', loadRoute('recommendations', path.join(localRoutesPath, 'recommendations'), path.join(backendPath, 'routes', 'recommendations')));
app.use('/api/diseases', loadRoute('diseases', path.join(localRoutesPath, 'diseases'), path.join(backendPath, 'routes', 'diseases')));
app.use('/api/pests', loadRoute('pests', path.join(localRoutesPath, 'pests'), path.join(backendPath, 'routes', 'pests')));
app.use('/api/soil', loadRoute('soil', path.join(localRoutesPath, 'soil'), path.join(backendPath, 'routes', 'soil')));
app.use('/api/crop-recommendations', loadRoute('crop-recommendations', path.join(localRoutesPath, 'crop-recommendations'), path.join(backendPath, 'routes', 'crop-recommendations')));
app.use('/api/weather', loadRoute('weather', path.join(localRoutesPath, 'weather'), path.join(backendPath, 'routes', 'weather')));
app.use('/api/ai', loadRoute('ai', path.join(localRoutesPath, 'ai'), path.join(backendPath, 'routes', 'ai')));
app.use('/api/officers', loadRoute('officers', path.join(localRoutesPath, 'officers'), path.join(backendPath, 'routes', 'officers')));
app.use('/api/escalations', loadRoute('escalations', path.join(localRoutesPath, 'escalations'), path.join(backendPath, 'routes', 'escalations')));
app.use('/api/alerts', loadRoute('alerts', path.join(localRoutesPath, 'alerts'), path.join(backendPath, 'routes', 'alerts')));
app.use('/api/market', loadRoute('market', path.join(localRoutesPath, 'market'), path.join(backendPath, 'routes', 'market')));
app.use('/api/connect', loadRoute('connect', path.join(localRoutesPath, 'connect'), path.join(backendPath, 'routes', 'connect')));
app.use('/api/labour', loadRoute('labour', path.join(localRoutesPath, 'labour'), path.join(backendPath, 'routes', 'labour')));
app.use('/api/analytics', loadRoute('analytics', path.join(localRoutesPath, 'analytics'), path.join(backendPath, 'routes', 'analytics')));

// Debug endpoint to check route loading status
app.get('/api/debug/routes', (req, res) => {
  res.json({ 
    routesLoaded, 
    backendPath,
    dirname: __dirname
  });
});

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
