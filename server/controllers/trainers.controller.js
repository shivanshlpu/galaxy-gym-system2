const Trainer = require('../models/Trainer.model');

// @desc    Get all active trainers
// @route   GET /api/v1/trainers
// @access  Private
exports.getTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ isActive: true }).sort({ name: 1 }).lean();
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
    const trainers = await Trainer.find().sort({ isActive: -1, name: 1 }).lean();
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
    const trainer = await Trainer.create(req.body);
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
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, {
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
    const trainer = await Trainer.findByIdAndDelete(req.params.id);

    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
