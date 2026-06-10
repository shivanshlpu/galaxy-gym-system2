const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    cronTime: {
      type: String,
      default: '08:00', // Format: "HH:mm"
    },
    welcomePoster: {
      type: String, // Base64
      default: null,
    },
    expiredPoster: {
      type: String, // Base64
      default: null,
    },
    reminderPosters: {
      type: [String], // Array of Base64 strings
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
