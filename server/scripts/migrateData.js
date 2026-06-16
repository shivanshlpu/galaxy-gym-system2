const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User.model');
const Member = require('../models/Member.model');
const Payment = require('../models/Payment.model');
const Attendance = require('../models/Attendance.model');
const Notification = require('../models/Notification.model');
const ActivityLog = require('../models/ActivityLog.model');
const MembershipPlan = require('../models/MembershipPlan.model');

dotenv.config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the primary admin (first user created, or any existing user)
    const primaryAdmin = await User.findOne().sort({ createdAt: 1 });
    if (!primaryAdmin) {
      console.log('❌ No admin user found. Please register an account first.');
      process.exit(1);
    }

    console.log(`📌 Found primary admin: ${primaryAdmin.email} (${primaryAdmin._id})`);

    // Assign orphaned documents to the primary admin
    const collections = [
      { model: Member, name: 'Members' },
      { model: Payment, name: 'Payments' },
      { model: Attendance, name: 'Attendance records' },
      { model: Notification, name: 'Notifications' },
      { model: ActivityLog, name: 'ActivityLogs' },
      { model: MembershipPlan, name: 'MembershipPlans' },
    ];

    for (const { model, name } of collections) {
      const result = await model.updateMany(
        { adminId: { $exists: false } },
        { $set: { adminId: primaryAdmin._id } }
      );
      console.log(`✅ Migrated ${result.modifiedCount} ${name}`);
    }

    console.log('🎉 Data migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateData();
