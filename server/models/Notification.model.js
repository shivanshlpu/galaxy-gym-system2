const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    whatsappSent: {
      type: Boolean,
      default: false,
    },
    whatsappSentAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 }, { expireAfterSeconds: 86400 }); // Auto-delete after 24 hours
notificationSchema.index({ type: 1 });
notificationSchema.index({ member: 1 });
notificationSchema.index({ adminId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
