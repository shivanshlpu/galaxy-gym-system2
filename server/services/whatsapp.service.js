const axios = require('axios');
const Member = require('../models/Member.model');
const WhatsAppLog = require('../models/WhatsAppLog.model');
const { getTemplate } = require('../utils/messageTemplates');

const OPENWA_URL = process.env.OPENWA_URL || 'http://localhost:3001';

// Authenticated axios instance for WhatsApp microservice
const waClient = axios.create({
  baseURL: OPENWA_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.WA_API_KEY || '',
  },
});

const sendMessage = async (phone, message, mediaBase64 = null) => {
  const formattedPhone = phone.replace(/\D/g, '') + '@c.us';
  try {
    const payload = { phone: formattedPhone, message };
    if (mediaBase64) payload.mediaBase64 = mediaBase64;
    const response = await waClient.post('/send', payload);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }
};

const getStatus = async () => {
  try {
    const response = await waClient.get('/status');
    return response.data;
  } catch (error) {
    return { success: false, data: { isReady: false, qr: null } };
  }
};

const disconnect = async () => {
  try {
    const response = await waClient.post('/disconnect');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to disconnect: ${error.message}`);
  }
};

const connect = async () => {
  try {
    const response = await waClient.post('/connect');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to connect: ${error.message}`);
  }
};

const sendReminder = async (member, daysLeft) => {
  const SystemSettings = require('../models/SystemSettings.model');
  const settings = await SystemSettings.findOne();
  let mediaBase64 = null;
  if (settings && settings.reminderPosters && settings.reminderPosters.length > 0) {
    mediaBase64 = settings.reminderPosters[Math.floor(Math.random() * settings.reminderPosters.length)];
  }
  const message = getTemplate('expiry', { member, daysLeft });
  return sendAndLog(member, 'expiry', message, mediaBase64);
};

const sendWelcome = async (member) => {
  const SystemSettings = require('../models/SystemSettings.model');
  const settings = await SystemSettings.findOne();
  const message = getTemplate('welcome', { member });
  return sendAndLog(member, 'welcome', message, settings?.welcomePoster);
};

const sendExpired = async (member) => {
  const MembershipPlan = require('../models/MembershipPlan.model');
  const SystemSettings = require('../models/SystemSettings.model');
  const activePlans = await MembershipPlan.find({ isActive: true });
  const settings = await SystemSettings.findOne();
  const message = getTemplate('expired', { member, activePlans });
  return sendAndLog(member, 'expired', message, settings?.expiredPoster);
};

const sendRenewal = async (member, planName) => {
  const message = getTemplate('renewal', { member, planName });
  // You could also add a renewal poster if needed
  return sendAndLog(member, 'renewal', message);
};


const sendInactive = async (member, absentDays) => {
  const message = getTemplate('inactive', { member, absentDays });
  return sendAndLog(member, 'inactive', message);
};

const sendAndLog = async (member, messageType, messageText, mediaBase64 = null) => {
  const log = await WhatsAppLog.create({
    member: member._id,
    phone: member.phone,
    messageType,
    messageText,
    status: 'pending',
  });

  if (process.env.WHATSAPP_ENABLED !== 'true') {
    await WhatsAppLog.findByIdAndUpdate(log._id, {
      status: 'failed',
      error: 'WhatsApp service is disabled',
    });
    return { success: false, reason: 'disabled' };
  }

  try {
    await sendMessage(member.phone, messageText, mediaBase64);
    await WhatsAppLog.findByIdAndUpdate(log._id, {
      status: 'sent',
      sentAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    await WhatsAppLog.findByIdAndUpdate(log._id, {
      status: 'failed',
      error: error.message,
    });
    return { success: false, reason: error.message };
  }
};

const sendMarketingBulk = async (memberIds, text, mediaBase64) => {
  if (process.env.WHATSAPP_ENABLED !== 'true') throw new Error('WhatsApp disabled');
  
  const results = [];
  for (const id of memberIds) {
    const member = await Member.findById(id);
    if (!member) continue;
    
    try {
      const formattedPhone = member.phone.replace(/\D/g, '') + '@c.us';
      const payload = { phone: formattedPhone, message: text };
      if (mediaBase64) payload.mediaBase64 = mediaBase64;
      
      await waClient.post('/send', payload);
      results.push({ memberId: id, success: true });
    } catch (err) {
      results.push({ memberId: id, success: false, error: err.message });
    }
  }
  return results;
};

const sendByType = async (memberId, type) => {
  const member = await Member.findById(memberId);
  if (!member) throw new Error('Member not found');

  switch (type) {
    case 'welcome':
      return sendWelcome(member);
    case 'expiry':
      return sendReminder(member, 0);
    case 'expired':
      return sendExpired(member);
    case 'inactive':
      return sendInactive(member, 0);
    default:
      throw new Error(`Unknown message type: ${type}`);
  }
};

module.exports = { sendMessage, sendReminder, sendWelcome, sendExpired, sendRenewal, sendInactive, sendByType, sendMarketingBulk, getStatus, disconnect, connect };
