const cron = require('node-cron');
const { checkMembershipExpiry } = require('../services/membershipChecker');
const { checkInactiveMembers } = require('../services/inactivityChecker');
const Notification = require('../models/Notification.model');
const SystemSettings = require('../models/SystemSettings.model');

let currentJob = null;

const runDailyTasks = async () => {
  console.log('⏰ Running daily cron job...');
  try {
    await checkMembershipExpiry();
    await checkInactiveMembers();

    // Clean old notifications (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deleted = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true,
    });

    console.log(`✅ Daily cron complete. Cleaned ${deleted.deletedCount} old notifications.`);
  } catch (error) {
    console.error('❌ Daily cron error:', error.message);
  }
};

const scheduleCronJob = async () => {
  try {
    const settings = await SystemSettings.findOne();
    const cronTime = settings?.cronTime || '08:00';
    const [hour, minute] = cronTime.split(':');

    if (currentJob) {
      currentJob.stop();
    }

    // Schedule new job
    currentJob = cron.schedule(`${minute} ${hour} * * *`, runDailyTasks, {
      timezone: 'Asia/Kolkata'
    });
    console.log(`⏰ Daily cron job scheduled for ${cronTime} (IST)`);
  } catch (err) {
    console.error('❌ Failed to schedule cron job:', err.message);
  }
};

module.exports = { scheduleCronJob, runDailyTasks };
