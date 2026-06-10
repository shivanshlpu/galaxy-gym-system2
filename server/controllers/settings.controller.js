const SystemSettings = require('../models/SystemSettings.model');
const { scheduleCronJob } = require('../jobs/dailyCron');

// GET /api/v1/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    
    await settings.save();
    
    // Reschedule cron job if time changed
    if (req.body.cronTime) {
      await scheduleCronJob();
    }
    
    res.json({ success: true, data: settings, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
