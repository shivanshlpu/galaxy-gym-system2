const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Member = require('../models/Member.model');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Check if member already exists
    let member = await Member.findOne({ phone: '9009149694' });
    
    // Set dates
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (member) {
      console.log('Member exists. Updating to Active and Inactive for 5 days.');
      member.status = 'Active';
      member.membershipStartDate = new Date();
      member.membershipExpiryDate = nextMonth;
      member.lastAttendance = fiveDaysAgo;
      await member.save();
      console.log('Member updated.');
    } else {
      console.log('Creating new member.');
      member = new Member({
        memberId: 'GYM-TEST-' + Math.floor(Math.random() * 10000),
        fullName: 'Test User',
        phone: '9009149694',
        email: 'test@example.com',
        gender: 'Male',
        age: 30,
        joiningDate: new Date('2024-01-01'),
        membershipStartDate: new Date(),
        membershipExpiryDate: nextMonth,
        lastAttendance: fiveDaysAgo,
        status: 'Active',
        whatsappOptIn: true
      });
      await member.save();
      console.log('Member created.');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
    mongoose.connection.close();
  });
