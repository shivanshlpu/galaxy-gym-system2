const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Placeholder WhatsApp controller (module is modular, controlled by WHATSAPP_ENABLED flag)
router.use(verifyToken);

// GET /api/v1/whatsapp/status
router.get('/status', (req, res) => {
  const enabled = process.env.WHATSAPP_ENABLED === 'true';
  res.json({
    success: true,
    data: {
      enabled,
      connected: enabled,
      message: enabled ? 'WhatsApp service is active and connected.' : 'WhatsApp service is disabled',
    },
  });
});

// POST /api/v1/whatsapp/send
router.post('/send', async (req, res) => {
  if (process.env.WHATSAPP_ENABLED !== 'true') {
    return res.json({ success: false, error: 'WhatsApp service is disabled.', code: 'WHATSAPP_DISABLED' });
  }
  // Forward to WhatsApp service
  const whatsappService = require('../services/whatsapp.service');
  try {
    const { memberId, type } = req.body;
    const result = await whatsappService.sendByType(memberId, type);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/whatsapp/send-bulk
router.post('/send-bulk', async (req, res) => {
  if (process.env.WHATSAPP_ENABLED !== 'true') {
    return res.json({ success: false, error: 'WhatsApp service is disabled.', code: 'WHATSAPP_DISABLED' });
  }
  const whatsappService = require('../services/whatsapp.service');
  try {
    const { memberIds, type } = req.body;
    const results = [];
    for (const memberId of memberIds) {
      try {
        const result = await whatsappService.sendByType(memberId, type);
        results.push({ memberId, success: true, ...result });
      } catch (err) {
        results.push({ memberId, success: false, error: err.message });
      }
    }
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/whatsapp/send-marketing
router.post('/send-marketing', async (req, res) => {
  if (process.env.WHATSAPP_ENABLED !== 'true') {
    return res.json({ success: false, error: 'WhatsApp service is disabled.', code: 'WHATSAPP_DISABLED' });
  }
  const whatsappService = require('../services/whatsapp.service');
  const MembershipPlan = require('../models/MembershipPlan.model');
  
  try {
    const { memberIds, messageText, planId } = req.body;
    let posterBase64 = null;
    
    if (planId) {
      const plan = await MembershipPlan.findById(planId);
      if (plan && plan.posterImage) {
        posterBase64 = plan.posterImage;
      }
    }
    
    const results = await whatsappService.sendMarketingBulk(memberIds, messageText, posterBase64);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/whatsapp/logs
router.get('/logs', async (req, res, next) => {
  try {
    const WhatsAppLog = require('../models/WhatsAppLog.model');
    const { memberId, status } = req.query;
    const query = {};
    if (memberId) query.member = memberId;
    if (status) query.status = status;

    const logs = await WhatsAppLog.find(query)
      .populate('member', 'fullName phone')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/whatsapp/qr
router.get('/qr', (req, res) => {
  res.json({
    success: true,
    data: { qrCode: null, message: 'QR code generation requires OpenWA service to be running.' },
  });
});

module.exports = router;
