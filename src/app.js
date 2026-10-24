
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const aiRoutes = require('./routes/aiRoutes');

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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/tasks', commentRoutes);
app.use('/api/v1/tasks', attachmentRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/attachments', attachmentRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON request body',
        });
    }

    console.error('Request error:', error.message);

    return res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
});

module.exports = app;
