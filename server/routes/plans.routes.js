const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/plans.controller');

router.use(verifyToken);

router.get('/', getPlans);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
