const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getDailyReport, getWeeklyReport, getMonthlyReport, getYearlyReport, getRevenueReport, getAttendanceReport } = require('../controllers/reports.controller');

router.use(verifyToken);

router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);
router.get('/revenue', getRevenueReport);
router.get('/attendance', getAttendanceReport);

module.exports = router;
