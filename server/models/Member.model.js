const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    age: {
      type: Number,
      min: 10,
      max: 100,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
    },
    membershipStartDate: {
      type: Date,
    },
    membershipExpiryDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Online', 'Card'],
      default: 'Cash',
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Inactive', 'Deleted'],
      default: 'Active',
    },
    photo: {
      type: String, // Cloudinary URL
    },
    trainerNeeded: {
      type: Boolean,
      default: false,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
    },
    invoiceAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    whatsappOptIn: {
      type: Boolean,
      default: true,
    },
    lastAttendance: {
      type: Date, // Denormalized for fast queries
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
memberSchema.index({ membershipExpiryDate: 1 });
memberSchema.index({ status: 1 });
memberSchema.index({ phone: 1 }, { unique: true });
memberSchema.index({ fullName: 'text' });

// Auto-generate memberId before saving
memberSchema.pre('save', async function (next) {
  if (!this.memberId) {
    const count = await mongoose.model('Member').countDocuments();
    this.memberId = `GYM-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);
