const Member = require('../models/Member.model');
const { getStartOfDay, subDays } = require('../utils/dateUtils');
const { createOrUpdateNotification } = require('./notifications.service');

const checkInactiveMembers = async () => {
  const today = getStartOfDay();
  let totalProcessed = 0;

  const members = await Member.find({ status: 'Active' });

  for (const member of members) {
    // If we don't have lastAttendance, use joiningDate
    const refDate = member.lastAttendance || member.joiningDate;
    if (!refDate) continue;

    const diffTime = today.getTime() - getStartOfDay(refDate).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    // If they have been absent for 5, 10, 15, 20... days
    if (diffDays >= 5 && diffDays % 5 === 0) {
      const type = `absent_${diffDays}d`;
      await createOrUpdateNotification(member, type);
      totalProcessed++;

      if (member.whatsappOptIn && process.env.WHATSAPP_ENABLED === 'true') {
        const whatsappService = require('./whatsapp.service');
        await whatsappService.sendInactive(member, diffDays);
      }
    }
  }

  console.log(`📋 Inactivity check: processed ${totalProcessed} notifications`);
};

module.exports = { checkInactiveMembers };
