const Trainer = require('../models/Trainer.model');
const { pickFields } = require('../utils/sanitize');

const TRAINER_FIELDS = ['name', 'experienceYears', 'price', 'dietCharge', 'isActive'];

// @desc    Get all active trainers
// @route   GET /api/v1/trainers
// @access  Private
exports.getTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ isActive: true, adminId: req.user.id }).sort({ name: 1 }).lean();
    res.json({ success: true, count: trainers.length, data: trainers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trainers (including inactive)
// @route   GET /api/v1/trainers/all
// @access  Private/Admin
exports.getAllTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ adminId: req.user.id }).sort({ isActive: -1, name: 1 }).lean();
    res.json({ success: true, count: trainers.length, data: trainers });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new trainer
// @route   POST /api/v1/trainers
// @access  Private/Admin
exports.createTrainer = async (req, res, next) => {
  try {
    const safeData = pickFields(req.body, TRAINER_FIELDS);
    const trainer = await Trainer.create({ ...safeData, adminId: req.user.id });
    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a trainer
// @route   PUT /api/v1/trainers/:id
// @access  Private/Admin
exports.updateTrainer = async (req, res, next) => {
  try {
    const safeData = pickFields(req.body, TRAINER_FIELDS);
    const trainer = await Trainer.findOneAndUpdate({ _id: req.params.id, adminId: req.user.id }, safeData, {
      new: true,
      runValidators: true,
    });

    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }

    res.json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a trainer
// @route   DELETE /api/v1/trainers/:id
// @access  Private/Admin
exports.deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });

    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
