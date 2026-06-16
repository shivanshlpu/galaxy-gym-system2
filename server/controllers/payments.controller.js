const Payment = require('../models/Payment.model');
const Member = require('../models/Member.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const ActivityLog = require('../models/ActivityLog.model');
const { addDays, getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } = require('../utils/dateUtils');
const { safePaginationLimit, safePage, pickFields } = require('../utils/sanitize');
const whatsappService = require('../services/whatsapp.service');

const mongoose = require('mongoose');

// GET /api/v1/payments
const getPayments = async (req, res, next) => {
  try {
    const { memberId, startDate, endDate, method, page, limit } = req.query;
    const safeLim = safePaginationLimit(limit);
    const safePg = safePage(page);
    const query = { adminId: req.user.id };

    if (memberId) query.member = memberId;
    if (method) query.paymentMethod = method;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = getStartOfDay(new Date(startDate));
      if (endDate) query.paymentDate.$lte = getEndOfDay(new Date(endDate));
    }

    const skip = (safePg - 1) * safeLim;
    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate('member', 'fullName memberId phone')
      .populate('plan', 'name durationDays price')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(safeLim)
      .lean();

    res.json({
      success: true,
      data: payments,
      pagination: { total, page: safePg, limit: safeLim, pages: Math.ceil(total / safeLim) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/payments
const createPayment = async (req, res, next) => {
  try {
    const { member: memberId, amount, paymentDate, paymentMethod, plan: planId, notes } = req.body;

    // Calculate renewal date
    let renewalDate = null;
    if (planId) {
      const plan = await MembershipPlan.findById(planId);
      if (plan) {
        const startDate = new Date(paymentDate);
        renewalDate = addDays(startDate, plan.durationDays);
      }
    }
    // Fetch existing member to check previous status
    const existingMember = await Member.findOne({ _id: memberId, adminId: req.user.id });
    const wasPending = existingMember && existingMember.paymentStatus === 'Pending';

    const payment = await Payment.create({
      adminId: req.user.id,
      member: memberId,
      amount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      plan: planId,
      renewalDate,
      notes,
    });

    // Update member's payment status and expiry
    const updateData = { paymentStatus: 'Paid' };
    if (renewalDate) {
      updateData.membershipExpiryDate = renewalDate;
      updateData.membershipStartDate = new Date(paymentDate);
      updateData.status = 'Active';
    }
    if (planId) updateData.membershipPlan = planId;

    await Member.findOneAndUpdate({ _id: memberId, adminId: req.user.id }, updateData);

    await payment.populate('member', 'fullName memberId phone whatsappOptIn adminId');
    await payment.populate('plan', 'name');

    await ActivityLog.create({
      adminId: req.user.id,
      action: 'payment_recorded',
      entityType: 'Payment',
      entityId: payment._id,
      performedBy: req.user.id,
      details: { amount, method: paymentMethod, memberName: payment.member.fullName },
    });

    if (planId && payment.member && payment.member.whatsappOptIn) {
      try {
        if (wasPending) {
          const { format } = require('date-fns');
          const endDateStr = renewalDate ? format(renewalDate, 'dd MMM yyyy') : 'N/A';
          await whatsappService.sendPaymentCleared(payment.member, amount, endDateStr);
        } else {
          await whatsappService.sendRenewal(payment.member, payment.plan.name);
        }
      } catch (whatsappErr) {
        console.error('Failed to send WhatsApp message:', whatsappErr);
      }
    }

    res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/payments/:id
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, adminId: req.user.id })
      .populate('member', 'fullName memberId phone')
      .populate('plan', 'name price');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/payments/:id
const updatePayment = async (req, res, next) => {
  try {
    const PAYMENT_UPDATE_FIELDS = ['amount', 'paymentMethod', 'paymentDate', 'notes'];
    const safeData = pickFields(req.body, PAYMENT_UPDATE_FIELDS);

    const payment = await Payment.findOneAndUpdate({ _id: req.params.id, adminId: req.user.id }, safeData, {
      new: true,
      runValidators: true,
    }).populate('member', 'fullName memberId');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: payment, message: 'Payment updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/payments/:id
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'Payment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/payments/member/:id
const getMemberPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ member: req.params.id, adminId: req.user.id })
      .populate('plan', 'name price')
      .sort({ paymentDate: -1 })
      .lean();

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/payments/revenue/monthly
const getMonthlyRevenue = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const revenue = await Payment.aggregate([
      {
        $match: {
          adminId: new mongoose.Types.ObjectId(req.user.id),
          paymentDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill all 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const found = revenue.find((r) => r._id === i + 1);
      return {
        month: i + 1,
        total: found?.total || 0,
        count: found?.count || 0,
      };
    });

    res.json({ success: true, data: months });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/payments/revenue/summary
const getRevenueSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = getStartOfMonth(now);
    const monthEnd = getEndOfMonth(now);

    const [totalAll, totalThisMonth, pendingCount] = await Promise.all([
      Payment.aggregate([
        { $match: { adminId: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { adminId: new mongoose.Types.ObjectId(req.user.id), paymentDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Member.countDocuments({ adminId: req.user.id, paymentStatus: { $in: ['Pending', 'Overdue'] }, status: { $ne: 'Deleted' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalCollected: totalAll[0]?.total || 0,
        thisMonth: totalThisMonth[0]?.total || 0,
        pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  createPayment,
  getPayment,
  updatePayment,
  deletePayment,
  getMemberPayments,
  getMonthlyRevenue,
  getRevenueSummary,
};
