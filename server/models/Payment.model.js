const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
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
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
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

// Auto-generate receipt number
paymentSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.receiptNumber = `RCP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
