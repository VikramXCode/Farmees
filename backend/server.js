'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';
let connectionPromise = null;

// Middlewares
app.use(cors());
app.use(express.json());

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

if (process.env.VERCEL) {
  app.use(async (_req, _res, next) => {
    try {
      await connectToDatabase();
      next();
    } catch (err) {
      next(err);
    }
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'farmease-backend', time: new Date().toISOString() });
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

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
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
