const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const membersRoutes = require('./routes/members.routes');
const plansRoutes = require('./routes/plans.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const paymentsRoutes = require('./routes/payments.routes');
const reportsRoutes = require('./routes/reports.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const assistantRoutes = require('./routes/assistant.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['X-New-Token'], // For JWT auto-refresh
  })
);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', membersRoutes);
app.use('/api/v1/plans', plansRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'GymOS API is running', timestamp: new Date() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
