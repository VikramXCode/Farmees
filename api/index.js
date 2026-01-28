// Vercel Serverless Function - Single Entry Point
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
import { demoModeMiddleware } from '../middleware/demoMode.js';
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

// Import all routes
import authRoutes from '../routes/auth.js';
import landsRoutes from '../routes/lands.js';
import aiInteractionsRoutes from '../routes/ai-interactions.js';
import recommendationsRoutes from '../routes/recommendations.js';
import diseasesRoutes from '../routes/diseases.js';
import pestsRoutes from '../routes/pests.js';
import soilRoutes from '../routes/soil.js';
import cropRecommendationsRoutes from '../routes/crop-recommendations.js';
import weatherRoutes from '../routes/weather.js';
import aiRoutes from '../routes/ai.js';
import officersRoutes from '../routes/officers.js';
import escalationsRoutes from '../routes/escalations.js';
import alertsRoutes from '../routes/alerts.js';
import marketRoutes from '../routes/market.js';
import connectRoutes from '../routes/connect.js';
import labourRoutes from '../routes/labour.js';
import analyticsRoutes from '../routes/analytics.js';

// Load all routes
app.use('/api/auth', authRoutes);
app.use('/api/lands', landsRoutes);
app.use('/api/ai-interactions', aiInteractionsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/diseases', diseasesRoutes);
app.use('/api/pests', pestsRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/crop-recommendations', cropRecommendationsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/officers', officersRoutes);
app.use('/api/escalations', escalationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/analytics', analyticsRoutes);

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
export default app;

