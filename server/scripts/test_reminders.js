require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('../models/Member.model');
const { checkMembershipExpiry } = require('../services/membershipChecker');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Clean existing members for a clean test
    await Member.deleteMany({});
    
    // Member 1: Suraj (Expires in exactly 5 days)
    const surajExpiry = new Date();
    surajExpiry.setDate(surajExpiry.getDate() + 5);
    
    // Member 2: Shivansh (Already expired yesterday)
    const shivanshExpiry = new Date();
    shivanshExpiry.setDate(shivanshExpiry.getDate() - 1);

    // === TEST 1: Suraj (5 days left) ===
    console.log('\n--- TEST 1: SURAJ ---');
    await Member.create({
      fullName: 'Suraj',
      phone: '8345953490',
      status: 'Active',
      membershipExpiryDate: surajExpiry,
      joiningDate: new Date(),
      whatsappOptIn: true,
    });
    console.log(`- Suraj created (Expires: ${surajExpiry.toLocaleDateString()})`);
    
    console.log('Running checkMembershipExpiry()...');
    await checkMembershipExpiry();
    
    // Clean up Suraj
    await Member.deleteMany({});
    
    // === TEST 2: Shivansh (Expired) ===
    console.log('\n--- TEST 2: SHIVANSH ---');
    await Member.create({
      fullName: 'Shivansh',
      phone: '8345953490',
      status: 'Active',
      membershipExpiryDate: shivanshExpiry,
      joiningDate: new Date(),
      whatsappOptIn: true,
    });
    console.log(`- Shivansh created (Expires: ${shivanshExpiry.toLocaleDateString()})`);
    
    console.log('Running checkMembershipExpiry()...');
    await checkMembershipExpiry();
    console.log('Check complete! Check your WhatsApp.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

runTest();
