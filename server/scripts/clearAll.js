const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const collectionsToClear = [
      require('../models/Member.model'),
      require('../models/Payment.model'),
      require('../models/Attendance.model'),
      require('../models/Notification.model'),
      require('../models/ActivityLog.model'),
      require('../models/WhatsAppLog.model')
    ];

    for (const Model of collectionsToClear) {
      const res = await Model.deleteMany({});
      console.log('Cleared ' + Model.modelName + ': ' + res.deletedCount);
    }

    await mongoose.disconnect();
    console.log('All operational data cleared successfully.');
  } catch(e) {
    console.error(e);
  }
})();
