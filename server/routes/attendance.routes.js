const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getAttendance,
  bulkMarkAttendance,
  updateAttendance,
  getTodayAttendance,
  getMemberAttendance,
  getAbsentToday,
  getAttendanceStats,
} = require('../controllers/attendance.controller');

router.use(verifyToken);

router.get('/today', getTodayAttendance);
router.get('/absent', getAbsentToday);
router.get('/stats', getAttendanceStats);
router.get('/member/:id', getMemberAttendance);
router.get('/', getAttendance);
router.post('/bulk', bulkMarkAttendance);
router.put('/:id', updateAttendance);

module.exports = router;
