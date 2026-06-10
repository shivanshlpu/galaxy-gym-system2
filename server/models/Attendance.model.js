const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: [true, 'Status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index: one attendance record per member per day
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
