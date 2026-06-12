const Payment = require('../models/Payment.model');
const Member = require('../models/Member.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const ActivityLog = require('../models/ActivityLog.model');
const { addDays, getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } = require('../utils/dateUtils');

// GET /api/v1/payments
const getPayments = async (req, res, next) => {
  try {
    const { memberId, startDate, endDate, method, page = 1, limit = 20 } = req.query;
    const query = {};

    if (memberId) query.member = memberId;
    if (method) query.paymentMethod = method;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = getStartOfDay(new Date(startDate));
      if (endDate) query.paymentDate.$lte = getEndOfDay(new Date(endDate));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate('member', 'fullName memberId phone')
      .populate('plan', 'name durationDays price')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: payments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
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

    const payment = await Payment.create({
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

    await Member.findByIdAndUpdate(memberId, updateData);

    await payment.populate('member', 'fullName memberId');
    await payment.populate('plan', 'name');

    await ActivityLog.create({
      action: 'payment_recorded',
      entityType: 'Payment',
      entityId: payment._id,
      performedBy: req.user.id,
      details: { amount, method: paymentMethod, memberName: payment.member.fullName },
    });

    res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/payments/:id
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
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
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
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
    const payment = await Payment.findByIdAndDelete(req.params.id);
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
    const payments = await Payment.find({ member: req.params.id })
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
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Member.countDocuments({ paymentStatus: { $in: ['Pending', 'Overdue'] }, status: { $ne: 'Deleted' } }),
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
