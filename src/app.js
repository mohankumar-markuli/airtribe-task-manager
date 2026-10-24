
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

app.disable('x-powered-by');

app.use(helmet());

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    }),
);

app.use(express.json({ limit: '10kb' }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});

app.use('/api', apiLimiter);

app.get('/api/v1/health', (req, res) => {
    const isDatabaseConnected = mongoose.connection.readyState === 1;

    res.status(200).json({
        success: true,
        message: 'Task Manager API is running',
        data: {
            status: 'healthy',
            service: 'airtribe-task-manager',
            database: isDatabaseConnected ? 'connected' : 'disconnected',
        },
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

module.exports = app;
