const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

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

// Security & Performance middleware
app.use(helmet());
app.use(compression());

// Global rate limiting — prevents DoS and abuse
app.use(apiLimiter);

// CORS — restrict origins in production
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.) in dev only
      if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    exposedHeaders: ['X-New-Token'], // For JWT auto-refresh
  })
);

// Body parsing — 1MB default to prevent memory exhaustion DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

// 404 handler — does NOT reveal the attempted URL to prevent route enumeration
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found.',
    code: 'NOT_FOUND',
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
