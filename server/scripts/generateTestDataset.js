const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Member = require('../models/Member.model');
const MembershipPlan = require('../models/MembershipPlan.model');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { addDays, subDays } = require('../utils/dateUtils');

const generateTestDataset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up previous test runs
    await Member.deleteMany({ phone: { $regex: /^9999/ } });
    console.log('🧹 Cleaned up old test users');

    let defaultPlan = await MembershipPlan.findOne();
    if (!defaultPlan) {
      defaultPlan = await MembershipPlan.create({
        name: 'Monthly',
        durationDays: 30,
        price: 1000,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const testMembers = [
      // Expired members
      { name: 'Test Expired (Past)', daysOffset: -40, expiryOffset: -10, status: 'Expired' },
      { name: 'Test Expired (Today)', daysOffset: -30, expiryOffset: 0, status: 'Expired' },
      
      // About to expire members
      { name: 'Test Expiring (1 Day)', daysOffset: -29, expiryOffset: 1, status: 'Active' },
      { name: 'Test Expiring (2 Days)', daysOffset: -28, expiryOffset: 2, status: 'Active' },
      { name: 'Test Expiring (3 Days)', daysOffset: -27, expiryOffset: 3, status: 'Active' },
      { name: 'Test Expiring (4 Days)', daysOffset: -26, expiryOffset: 4, status: 'Active' },
      { name: 'Test Expiring (5 Days)', daysOffset: -25, expiryOffset: 5, status: 'Active' },
      
      // Inactive members (absent)
      { name: 'Test Inactive (5 Days)', daysOffset: -15, expiryOffset: 15, status: 'Active', lastAttendanceOffset: -5 },
      { name: 'Test Inactive (10 Days)', daysOffset: -20, expiryOffset: 10, status: 'Active', lastAttendanceOffset: -10 },
      { name: 'Test Inactive (15 Days)', daysOffset: -25, expiryOffset: 5, status: 'Active', lastAttendanceOffset: -15 },
    ];

    let phoneCounter = 9999000000;

    const membersToInsert = testMembers.map(d => {
      const phone = (phoneCounter++).toString();
      const memberId = 'GYM-TEST-' + Math.floor(Math.random() * 100000);
      
      const joiningDate = addDays(today, d.daysOffset);
      const membershipExpiryDate = addDays(today, d.expiryOffset);
      const lastAttendance = d.lastAttendanceOffset ? addDays(today, d.lastAttendanceOffset) : addDays(today, -1);

      return {
        memberId,
        fullName: d.name,
        phone,
        email: `test${phone}@gymos.com`,
        gender: 'Male',
        age: 30,
        joiningDate,
        membershipPlan: defaultPlan._id,
        membershipStartDate: joiningDate,
        membershipExpiryDate,
        lastAttendance: d.lastAttendanceOffset ? lastAttendance : undefined,
        paymentStatus: 'Paid',
        status: d.status,
        whatsappOptIn: true
      };
    });

    await Member.insertMany(membersToInsert);
    console.log(`✅ Created ${membersToInsert.length} test members successfully!`);

    // Run the cron jobs to generate notifications immediately
    console.log('🔄 Running background checks to generate notifications...');
    const { checkMembershipExpiry } = require('../services/membershipChecker');
    const { checkInactiveMembers } = require('../services/inactivityChecker');
    
    await checkMembershipExpiry();
    await checkInactiveMembers();
    
    console.log('✅ Background checks complete! Check your System Alerts.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test dataset:', error);
    process.exit(1);
  }
};

generateTestDataset();
