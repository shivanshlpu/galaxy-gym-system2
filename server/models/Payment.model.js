const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    planCost: {
      type: Number,
      default: 0,
    },
    trainerCost: {
      type: Number,
      default: 0,
    },
    dietCost: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Online', 'UPI', 'Card'],
      required: [true, 'Payment method is required'],
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
    },
    renewalDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    receiptNumber: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
paymentSchema.index({ member: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ adminId: 1 });

// Auto-generate receipt number
paymentSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.receiptNumber = `RCP-${dateStr}-${randomHex}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
