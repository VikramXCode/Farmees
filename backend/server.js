'use strict';

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

// Middlewares
app.use(cors());
app.use(express.json());

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
