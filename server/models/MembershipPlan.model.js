const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration in days is required'],
      min: 1,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

membershipPlanSchema.index({ adminId: 1 });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
