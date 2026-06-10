const express = require('express');
const router = express.Router();
const {
  getTrainers,
  getAllTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} = require('../controllers/trainers.controller');

const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.route('/').get(getTrainers).post(createTrainer);
router.route('/all').get(getAllTrainers);
router.route('/:id').put(updateTrainer).delete(deleteTrainer);

module.exports = router;
