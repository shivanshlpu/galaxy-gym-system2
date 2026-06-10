const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getPayments,
  createPayment,
  getPayment,
  updatePayment,
  deletePayment,
  getMemberPayments,
  getMonthlyRevenue,
  getRevenueSummary,
} = require('../controllers/payments.controller');

router.use(verifyToken);

router.get('/revenue/monthly', getMonthlyRevenue);
router.get('/revenue/summary', getRevenueSummary);
router.get('/member/:id', getMemberPayments);
router.get('/', getPayments);
router.post('/', createPayment);
router.get('/:id', getPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

module.exports = router;
