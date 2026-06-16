const Notification = require('../models/Notification.model');

const createNotification = async (member, type, customMessage = null) => {
  const messages = {
    expiry_7d: `${member.fullName}'s membership expires in 7 days`,
    expiry_5d: `${member.fullName}'s membership expires in 5 days`,
    expiry_3d: `${member.fullName}'s membership expires in 3 days`,
    expiry_tomorrow: `${member.fullName}'s membership expires tomorrow!`,
    expired: `${member.fullName}'s membership has expired`,
    absent_3d: `${member.fullName} has been absent for 3 days`,
    absent_5d: `${member.fullName} has been absent for 5 days`,
    absent_10d: `${member.fullName} has been absent for 10 days`,
    payment_pending: `${member.fullName} has a pending payment`,
  };

  const message = customMessage || messages[type] || `Notification for ${member.fullName}`;

  return Notification.create({
    adminId: member.adminId,
    type,
    member: member._id,
    message,
  });
};

const createOrUpdateNotification = async (member, type) => {
  const existing = await Notification.findOne({
    adminId: member.adminId,
    type,
    member: member._id,
    isRead: false,
  });

  if (existing) {
    // Don't duplicate
    return existing;
  }

  return createNotification(member, type);
};

module.exports = { createNotification, createOrUpdateNotification };
