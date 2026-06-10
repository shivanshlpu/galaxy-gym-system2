const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: 0,
    },
    price: {
      type: Number,
      required: [true, 'Trainer charge is required'],
      min: 0,
    },
    dietCharge: {
      type: Number,
      required: [true, 'Diet charge is required'],
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trainer', trainerSchema);
