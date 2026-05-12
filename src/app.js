const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const flowRoutes = require('./routes/flowRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const depositRoutes = require('./routes/depositRoutes');

const app = express();

// =============================================
// Middleware
// =============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Request logging
app.use((req, res, next) => {
  logger.info('Request', `${req.method} ${req.url}`);
  next();
});

// =============================================
// Routes
// =============================================
app.get('/api/health', (req, res) => {
  logger.info('Health', 'Health check OK');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/deposits', depositRoutes);

// =============================================
// 404 Handler
// =============================================
app.use((req, res) => {
  logger.warn('Router', `Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// =============================================
// Global Error Handler
// =============================================
app.use((err, req, res, next) => {
  logger.error('Server', 'Unhandled error', err.message);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
