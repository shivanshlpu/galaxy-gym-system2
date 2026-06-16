const MembershipPlan = require('../models/MembershipPlan.model');
const ActivityLog = require('../models/ActivityLog.model');
const { pickFields } = require('../utils/sanitize');

// GET /api/v1/plans
const getPlans = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true, adminId: req.user.id }).sort({ price: 1 }).lean();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/plans
const createPlan = async (req, res, next) => {
  try {
    const { name, durationDays, price, description } = req.body;
    const plan = await MembershipPlan.create({ adminId: req.user.id, name, durationDays, price, description });

    await ActivityLog.create({
      adminId: req.user.id,
      action: 'plan_created',
      entityType: 'MembershipPlan',
      entityId: plan._id,
      performedBy: req.user.id,
      details: { name, price },
    });

    res.status(201).json({ success: true, data: plan, message: 'Plan created successfully.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/plans/:id
const updatePlan = async (req, res, next) => {
  try {
    const PLAN_FIELDS = ['name', 'durationDays', 'price', 'description', 'posterImage', 'isActive'];
    const safeData = pickFields(req.body, PLAN_FIELDS);

    const plan = await MembershipPlan.findOneAndUpdate({ _id: req.params.id, adminId: req.user.id }, safeData, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found.', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: plan, message: 'Plan updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/plans/:id (soft deactivate)
const deletePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found.', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'Plan deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
