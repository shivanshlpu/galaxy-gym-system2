const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Member = require('../models/Member.model');
    const Payment = require('../models/Payment.model');
    const Notification = require('../models/Notification.model');
    const ActivityLog = require('../models/ActivityLog.model');
    const Attendance = require('../models/Attendance.model');

    const testMembers = await Member.find({ fullName: { $regex: /^Test /i } });
    const memberIds = testMembers.map(m => m._id);

    console.log('Found ' + memberIds.length + ' test members.');

    const pRes = await Payment.deleteMany({ member: { $in: memberIds } });
    console.log('Deleted ' + pRes.deletedCount + ' payments.');

    const nRes = await Notification.deleteMany({ member: { $in: memberIds } });
    console.log('Deleted ' + nRes.deletedCount + ' notifications.');

    const aRes = await ActivityLog.deleteMany({ 'details.memberName': { $regex: /^Test /i } });
    console.log('Deleted ' + aRes.deletedCount + ' activity logs.');

    const attRes = await Attendance.deleteMany({ member: { $in: memberIds } });
    console.log('Deleted ' + attRes.deletedCount + ' attendances.');

    const mRes = await Member.deleteMany({ _id: { $in: memberIds } });
    console.log('Deleted ' + mRes.deletedCount + ' members.');

    await mongoose.disconnect();
    console.log('Cleanup complete.');
  } catch(e) {
    console.error(e);
  }
})();
