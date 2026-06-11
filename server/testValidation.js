require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('./models/Member.model');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const member = new Member({
      fullName: 'Test User',
      phone: '9999999999',
      joiningDate: new Date(),
      paymentMethod: 'Online'
    });
    
    await member.save();
    console.log('Member saved successfully with Online payment method!');
    await Member.deleteOne({ phone: '9999999999' });
  } catch (err) {
    console.error('Validation error:', err.message);
  } finally {
    process.exit(0);
  }
}
test();
