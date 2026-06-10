require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');

// Validate environment variables
validateEnv();

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    // Start cron jobs only after DB is connected
    const { scheduleCronJob } = require('./jobs/dailyCron');
    await scheduleCronJob();

    app.listen(PORT, () => {
      console.log(`🚀 GymOS Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
