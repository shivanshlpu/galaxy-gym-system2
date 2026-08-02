const mongoose = require('mongoose');
require('dotenv').config();

async function clearSession() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected! Clearing baileysauths collection...');
    const result = await mongoose.connection.db.collection('baileysauths').deleteMany({});
    console.log(`✅ SUCCESS: Deleted ${result.deletedCount} corrupted auth documents from MongoDB Atlas.`);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing auth state:', err);
    process.exit(1);
  }
}

clearSession();
