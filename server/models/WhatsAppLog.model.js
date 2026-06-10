const mongoose = require('mongoose');

const whatsAppLogSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    phone: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      // e.g., 'welcome', 'expiry', 'expired', 'inactive'
    },
    messageText: {
      type: String,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    error: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

whatsAppLogSchema.index({ member: 1 });
whatsAppLogSchema.index({ status: 1 });

module.exports = mongoose.model('WhatsAppLog', whatsAppLogSchema);
