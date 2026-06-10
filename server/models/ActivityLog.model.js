const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g., 'member_added', 'attendance_marked', 'payment_recorded',
      // 'member_updated', 'member_deleted', 'plan_created'
    },
    entityType: {
      type: String,
      required: true,
      // e.g., 'Member', 'Attendance', 'Payment', 'MembershipPlan'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // JSON snapshot of the action
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
