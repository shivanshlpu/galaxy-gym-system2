const Member = require('../models/Member.model');
const { createOrUpdateNotification } = require('./notifications.service');
const whatsappService = require('./whatsapp.service');

const checkPendingPayments = async () => {
  let totalProcessed = 0;

  try {
    const pendingMembers = await Member.find({ 
      paymentStatus: 'Pending', 
      status: { $ne: 'Deleted' } 
    });

    for (const member of pendingMembers) {
      await createOrUpdateNotification(member, 'payment_pending');
      totalProcessed++;

      if (member.whatsappOptIn && process.env.WHATSAPP_ENABLED === 'true') {
        try {
          const { getTemplate } = require('../utils/messageTemplates');
          const message = getTemplate('payment_reminder', { member });
          
          const WhatsAppLog = require('../models/WhatsAppLog.model');
          const log = await WhatsAppLog.create({
            adminId: member.adminId,
            member: member._id,
            phone: member.phone,
            messageType: 'payment_reminder',
            messageText: message,
            status: 'pending',
          });

          await whatsappService.sendMessage(member.phone, message);
          
          await WhatsAppLog.findByIdAndUpdate(log._id, {
            status: 'sent',
            sentAt: new Date(),
          });
        } catch (err) {
          console.error(`Failed to send WhatsApp payment reminder to ${member.fullName}:`, err);
        }
      }
    }

    console.log(`📋 Pending payments check: processed ${totalProcessed} reminders`);
  } catch (error) {
    console.error('❌ Error checking pending payments:', error);
  }
};

module.exports = { checkPendingPayments };
