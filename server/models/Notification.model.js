const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'expiry_7d',
        'expiry_5d',
        'expiry_3d',
        'expiry_tomorrow',
        'expired',
        'absent_3d',
        'absent_5d',
        'absent_10d',
        'payment_pending',
      ],
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

notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ member: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
