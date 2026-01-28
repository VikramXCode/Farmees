// Vercel Serverless Function - Single Entry Point
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';
let connectionPromise = null;

// Middlewares
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Mode', 'X-Requested-With']
}));

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
const { demoModeMiddleware } = require('../middleware/demoMode');
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
        service: 'farmees-api',
        time: new Date().toISOString(),
        database: dbStatus,
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing'
    });
});

// Routes path (relative to project root)
const routesPath = path.join(__dirname, '..', 'routes');

// Load routes with error handling
let routesLoaded = {};
const loadRoute = (name) => {
    try {
        const route = require(path.join(routesPath, name));
        routesLoaded[name] = 'loaded';
        return route;
    } catch (err) {
        console.error(`Failed to load route ${name}:`, err.message);
        routesLoaded[name] = `error: ${err.message}`;
        const placeholder = express.Router();
        placeholder.all('*', (req, res) => {
            res.status(500).json({ error: `Route ${name} failed to load`, details: err.message });
        });
        return placeholder;
    }
};

// Load all routes
app.use('/api/auth', loadRoute('auth'));
app.use('/api/lands', loadRoute('lands'));
app.use('/api/ai-interactions', loadRoute('ai-interactions'));
app.use('/api/recommendations', loadRoute('recommendations'));
app.use('/api/diseases', loadRoute('diseases'));
app.use('/api/pests', loadRoute('pests'));
app.use('/api/soil', loadRoute('soil'));
app.use('/api/crop-recommendations', loadRoute('crop-recommendations'));
app.use('/api/weather', loadRoute('weather'));
app.use('/api/ai', loadRoute('ai'));
app.use('/api/officers', loadRoute('officers'));
app.use('/api/escalations', loadRoute('escalations'));
app.use('/api/alerts', loadRoute('alerts'));
app.use('/api/market', loadRoute('market'));
app.use('/api/connect', loadRoute('connect'));
app.use('/api/labour', loadRoute('labour'));
app.use('/api/analytics', loadRoute('analytics'));

// Debug endpoint
app.get('/api/debug/routes', (req, res) => {
    res.json({ routesLoaded, routesPath });
});

// Root API endpoint
app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Farmees API',
        version: '1.0.0',
        endpoints: ['/api/health', '/api/auth', '/api/lands', '/api/weather', '/api/market', '/api/analytics']
    });
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Export for Vercel
module.exports = app;
