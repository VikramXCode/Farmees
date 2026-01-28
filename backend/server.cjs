'use strict';

// Backend server for Farmees - Vercel deployment ready
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Only load dotenv in non-Vercel environments (Vercel uses dashboard env vars)
if (!process.env.VERCEL) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';
let connectionPromise = null;

// Debug logging for Vercel
if (process.env.VERCEL) {
  console.log('Running on Vercel');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
}

// CORS configuration
const allowedOrigins = [
  'https://farmees.vercel.app',
  'https://farmees-elyt.vercel.app',
  'https://farm-ease.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Add custom frontend URL if specified
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add any Vercel preview URLs
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow any vercel.app subdomain in production
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return callback(null, true);
    }

    // In development, allow all
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Mode', 'X-Requested-With']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple test route - no database or middleware required
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Farmees Backend API',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      hasMongoUri: !!process.env.MONGODB_URI
    }
  });
});

// Demo mode middleware - must come after json parsing
const { demoModeMiddleware } = require('./middleware/demoMode');
app.use(demoModeMiddleware);

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!connectionPromise) {
    console.log('🔄 Connecting to MongoDB...');
    connectionPromise = mongoose.connect(MONGODB_URI)
      .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        return mongoose.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        console.error('❌ MongoDB connection failed:', err.message);
        throw err;
      });
  }
  return connectionPromise;
}

if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    try {
      await connectToDatabase();
      next();
    } catch (err) {
      console.error('Database connection error:', err.message);
      res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  });
}

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    service: 'farmease-backend',
    time: new Date().toISOString(),
    database: dbStatus,
    mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing'
  });
});

// Routes
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'FarmEase API root', endpoints: ['/api/health', '/api/lands', '/api/ai-interactions', '/api/recommendations', '/api/diseases', '/api/pests', '/api/auth', '/api/soil', '/api/crop-recommendations', '/api/weather', '/api/officers', '/api/escalations'] });
});
app.use('/api/lands', require('./routes/lands'));
app.use('/api/ai-interactions', require('./routes/ai-interactions'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/diseases', require('./routes/diseases'));
app.use('/api/pests', require('./routes/pests'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/soil', require('./routes/soil'));
app.use('/api/crop-recommendations', require('./routes/crop-recommendations'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/officers', require('./routes/officers'));
app.use('/api/escalations', require('./routes/escalations'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/market', require('./routes/market'));
app.use('/api/connect', require('./routes/connect'));
app.use('/api/labour', require('./routes/labour'));
app.use('/api/analytics', require('./routes/analytics'));

async function startServer() {
  console.log('🚀 Starting FarmEase Backend Server...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await connectToDatabase();

    const server = app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Server started successfully!');
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the existing server, then retry.`);
        console.error(`Windows quick fix: Get-NetTCPConnection -LocalPort ${PORT} -State Listen | Select OwningProcess | Stop-Process -Id {PID} -Force`);
        process.exit(1);
      }
      console.error('❌ Server listen error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

if (process.env.VERCEL) {
  connectToDatabase().catch((err) => {
    console.error('MongoDB connection failed on Vercel:', err);
  });
} else {
  startServer();
}

module.exports = app;
