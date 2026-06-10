require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Member = require('../models/Member.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const Trainer = require('../models/Trainer.model');

const clear = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Promise.all([
      Member.deleteMany({}),
      MembershipPlan.deleteMany({}),
      Attendance.deleteMany({}),
      Payment.deleteMany({}),
      Trainer.deleteMany({})
    ]);
    console.log('🗑️  Cleared all member, plan, trainer, attendance, and payment data.');
    console.log('✅ Admin user was kept intact so you can still log in.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Clear error:', error);
    process.exit(1);
  }
};

clear();
