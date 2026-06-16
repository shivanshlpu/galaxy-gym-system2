const SystemSettings = require('../models/SystemSettings.model');
const { scheduleCronJob } = require('../jobs/dailyCron');
const { pickFields } = require('../utils/sanitize');

const SETTINGS_FIELDS = ['cronTime', 'dietPrice', 'welcomePoster', 'expiredPoster', 'activationPoster', 'reminderPosters'];

// GET /api/v1/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne({ adminId: req.user.id });
    if (!settings) {
      settings = await SystemSettings.create({ adminId: req.user.id });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/settings
const updateSettings = async (req, res, next) => {
  try {
    const safeData = pickFields(req.body, SETTINGS_FIELDS);

    let settings = await SystemSettings.findOne({ adminId: req.user.id });
    if (!settings) {
      settings = new SystemSettings({ ...safeData, adminId: req.user.id });
    } else {
      Object.assign(settings, safeData);
    }
    
    await settings.save();
    
    // Reschedule cron job if time changed
    if (safeData.cronTime) {
      await scheduleCronJob();
    }
    
    res.json({ success: true, data: settings, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
