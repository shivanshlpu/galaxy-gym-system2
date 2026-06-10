require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Member = require('../models/Member.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const { addDays, subDays } = require('../utils/dateUtils');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Member.deleteMany({}),
      MembershipPlan.deleteMany({}),
      Attendance.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // 1. Create admin user
    const admin = await User.create({
      email: 'admin@gymos.com',
      username: 'admin',
      password: 'Admin@123',
      role: 'admin',
      gymName: 'GymOS Fitness Center',
    });
    console.log('👤 Admin created: admin@gymos.com / Admin@123');

    // 2. Create membership plans
    const plans = await MembershipPlan.create([
      { name: 'Monthly', durationDays: 30, price: 800, description: '1 month membership' },
      { name: 'Quarterly', durationDays: 90, price: 2200, description: '3 month membership' },
      { name: 'Half-Year', durationDays: 180, price: 4000, description: '6 month membership' },
      { name: 'Annual', durationDays: 365, price: 7000, description: '1 year membership' },
    ]);
    console.log('📋 Created 4 membership plans');

    const [monthly, quarterly, halfYear, annual] = plans;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Create 10 sample members
    const membersData = [
      { fullName: 'Rahul Sharma', phone: '9876543210', gender: 'Male', age: 28, plan: monthly, daysOffset: -20, payment: 'Paid' },
      { fullName: 'Priya Patel', phone: '9876543211', gender: 'Female', age: 25, plan: quarterly, daysOffset: -60, payment: 'Paid' },
      { fullName: 'Amit Kumar', phone: '9876543212', gender: 'Male', age: 32, plan: halfYear, daysOffset: -100, payment: 'Paid' },
      { fullName: 'Sneha Gupta', phone: '9876543213', gender: 'Female', age: 22, plan: monthly, daysOffset: -27, payment: 'Paid' }, // expiring in 3 days
      { fullName: 'Vikram Singh', phone: '9876543214', gender: 'Male', age: 35, plan: monthly, daysOffset: -29, payment: 'Paid' }, // expiring tomorrow
      { fullName: 'Anjali Mishra', phone: '9876543215', gender: 'Female', age: 29, plan: quarterly, daysOffset: -85, payment: 'Paid' }, // expiring in 5 days
      { fullName: 'Deepak Joshi', phone: '9876543216', gender: 'Male', age: 40, plan: monthly, daysOffset: -35, payment: 'Overdue' }, // expired
      { fullName: 'Neha Verma', phone: '9876543217', gender: 'Female', age: 27, plan: annual, daysOffset: -200, payment: 'Paid' },
      { fullName: 'Rajesh Tiwari', phone: '9876543218', gender: 'Male', age: 30, plan: halfYear, daysOffset: -10, payment: 'Pending' },
      { fullName: 'Kavita Reddy', phone: '9876543219', gender: 'Female', age: 24, plan: monthly, daysOffset: -5, payment: 'Paid' },
    ];

    const members = [];
    for (let i = 0; i < membersData.length; i++) {
      const d = membersData[i];
      const startDate = addDays(today, d.daysOffset);
      const expiryDate = addDays(startDate, d.plan.durationDays);
      const isExpired = expiryDate < today;

      const member = await Member.create({
        fullName: d.fullName,
        phone: d.phone,
        gender: d.gender,
        age: d.age,
        joiningDate: startDate,
        membershipPlan: d.plan._id,
        membershipStartDate: startDate,
        membershipExpiryDate: expiryDate,
        paymentStatus: d.payment,
        status: isExpired ? 'Expired' : 'Active',
        whatsappOptIn: true,
        address: 'Sample Address, City',
      });
      members.push(member);
    }
    console.log('👥 Created 10 sample members');

    // 4. Create attendance records (last 7 days)
    const attendanceRecords = [];
    for (let day = 0; day < 7; day++) {
      const date = subDays(today, day);
      date.setHours(0, 0, 0, 0);

      // Random attendance for active members
      for (const member of members.filter((m) => m.status === 'Active')) {
        const isPresent = Math.random() > 0.3; // 70% attendance rate
        attendanceRecords.push({
          member: member._id,
          date,
          status: isPresent ? 'Present' : 'Absent',
          markedBy: admin._id,
        });

        // Update lastAttendance for present members
        if (isPresent && day === 0) {
          await Member.findByIdAndUpdate(member._id, { lastAttendance: date });
        }
      }
    }
    await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // 5. Create payment records
    const paymentRecords = [
      { member: members[0]._id, amount: 800, method: 'UPI', plan: monthly._id, daysAgo: 20 },
      { member: members[1]._id, amount: 2200, method: 'Cash', plan: quarterly._id, daysAgo: 60 },
      { member: members[2]._id, amount: 4000, method: 'Card', plan: halfYear._id, daysAgo: 100 },
      { member: members[7]._id, amount: 7000, method: 'UPI', plan: annual._id, daysAgo: 200 },
      { member: members[9]._id, amount: 800, method: 'Cash', plan: monthly._id, daysAgo: 5 },
    ];

    for (const pr of paymentRecords) {
      await Payment.create({
        member: pr.member,
        amount: pr.amount,
        paymentDate: subDays(today, pr.daysAgo),
        paymentMethod: pr.method,
        plan: pr.plan,
        renewalDate: addDays(subDays(today, pr.daysAgo), plans.find((p) => p._id.equals(pr.plan)).durationDays),
      });
    }
    console.log('💰 Created 5 payment records');

    console.log('\n✅ Seed complete!');
    console.log('📧 Login: admin@gymos.com / Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
