const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cronTime: {
      type: String,
      default: '08:00', // Format: "HH:mm"
    },
    dietPrice: {
      type: Number,
      default: 0,
    },
    welcomePoster: {
      type: String, // Base64
      default: null,
    },
    expiredPoster: {
      type: String, // Base64
      default: null,
    },
    activationPoster: {
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

systemSettingsSchema.index({ adminId: 1 });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
