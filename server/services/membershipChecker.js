const Member = require('../models/Member.model');
const { getStartOfDay, addDays, subDays, endOfDay } = require('../utils/dateUtils');
const { createOrUpdateNotification } = require('./notifications.service');
const whatsappService = require('./whatsapp.service');

const checkMembershipExpiry = async () => {
  const today = getStartOfDay();
  const thresholds = [
    { days: 1, type: 'expiry_tomorrow' },
    { days: 2, type: 'expiry_2d' },
    { days: 3, type: 'expiry_3d' },
    { days: 4, type: 'expiry_4d' },
    { days: 5, type: 'expiry_5d' },
  ];

  for (const { days, type } of thresholds) {
    const targetDate = addDays(today, days);
    const members = await Member.find({
      membershipExpiryDate: {
        $gte: getStartOfDay(targetDate),
        $lt: endOfDay(targetDate),
      },
      status: 'Active',
    });

    for (const member of members) {
      await createOrUpdateNotification(member, type);
      if (member.whatsappOptIn && process.env.WHATSAPP_ENABLED === 'true') {
        await whatsappService.sendReminder(member, days);
      }
    }
  }

  // Check already expired
  const expired = await Member.find({
    membershipExpiryDate: { $lt: today },
    status: 'Active',
  });
  for (const member of expired) {
    await Member.findByIdAndUpdate(member._id, { status: 'Expired' });
    await createOrUpdateNotification(member, 'expired');
    if (member.whatsappOptIn && process.env.WHATSAPP_ENABLED === 'true') {
      await whatsappService.sendExpired(member);
    }
  }

  console.log(`📋 Expiry check: processed ${thresholds.length} thresholds, ${expired.length} expired`);
};

module.exports = { checkMembershipExpiry };
