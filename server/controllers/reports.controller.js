const Member = require('../models/Member.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const { getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear, subDays } = require('../utils/dateUtils');

const mongoose = require('mongoose');

// GET /api/v1/reports/daily
const getDailyReport = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = getStartOfDay(date);
    const end = getEndOfDay(date);

    const [newMembers, attendance, payments, expired] = await Promise.all([
      Member.find({ joiningDate: { $gte: start, $lte: end }, status: { $ne: 'Deleted' }, adminId: req.user.id }),
      Attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Member.countDocuments({ membershipExpiryDate: { $gte: start, $lte: end }, adminId: req.user.id }),
    ]);

    const attendanceMap = {};
    attendance.forEach((a) => (attendanceMap[a._id] = a.count));
    const totalRevenue = payments.reduce((sum, p) => sum + p.total, 0);
    const totalCount = payments.reduce((sum, p) => sum + p.count, 0);

    res.json({
      success: true,
      data: {
        date: start,
        newMembers: { count: newMembers.length, list: newMembers },
        renewals: { count: totalCount, revenue: totalRevenue },
        attendance: { present: attendanceMap.Present || 0, absent: attendanceMap.Absent || 0 },
        revenue: { total: totalRevenue, byMethod: payments },
        expiredMembers: expired,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/reports/weekly
const getWeeklyReport = async (req, res, next) => {
  try {
    const date = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const start = getStartOfWeek(date);
    const end = getEndOfWeek(date);

    const [newMembers, attendanceStats, payments, inactiveCount, expiredCount] = await Promise.all([
      Member.countDocuments({ joiningDate: { $gte: start, $lte: end }, status: { $ne: 'Deleted' }, adminId: req.user.id }),
      Attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Member.countDocuments({
        status: 'Active',
        adminId: req.user.id,
        $or: [{ lastAttendance: { $lt: subDays(new Date(), 5) } }, { lastAttendance: null }],
      }),
      Member.countDocuments({ membershipExpiryDate: { $gte: start, $lte: end }, adminId: req.user.id }),
    ]);

    const attendanceMap = {};
    attendanceStats.forEach((a) => (attendanceMap[a._id] = a.count));
    const totalPresent = attendanceMap.Present || 0;
    const totalAbsent = attendanceMap.Absent || 0;
    const totalRevenue = payments.reduce((sum, p) => sum + p.total, 0);
    const totalCount = payments.reduce((sum, p) => sum + p.count, 0);

    res.json({
      success: true,
      data: {
        period: { start, end },
        newMembers,
        renewals: { count: totalCount, revenue: totalRevenue },
        attendance: {
          present: totalPresent,
          absent: totalAbsent,
          rate: totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0,
        },
        revenue: { total: totalRevenue, byMethod: payments },
        inactiveMembers: inactiveCount,
        expiredMembers: expiredCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/reports/monthly
const getMonthlyReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const date = new Date(year, month - 1, 1);
    const start = getStartOfMonth(date);
    const end = getEndOfMonth(date);

    const [newMembers, attendanceStats, payments, expiredCount, activeCount] = await Promise.all([
      Member.countDocuments({ joiningDate: { $gte: start, $lte: end }, status: { $ne: 'Deleted' }, adminId: req.user.id }),
      Attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Member.countDocuments({ membershipExpiryDate: { $gte: start, $lte: end }, adminId: req.user.id }),
      Member.countDocuments({ status: 'Active', adminId: req.user.id }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.total, 0);
    const renewalCount = payments.reduce((sum, p) => sum + p.count, 0);

    res.json({
      success: true,
      data: {
        period: { year, month, start, end },
        newMembers,
        renewals: { count: renewalCount, revenue: totalRevenue },
        attendanceDaily: attendanceStats,
        revenue: { total: totalRevenue, byMethod: payments },
        expiredMembers: expiredCount,
        activeMembers: activeCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/reports/yearly
const getYearlyReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = getStartOfYear(new Date(year, 0, 1));
    const end = getEndOfYear(new Date(year, 0, 1));

    const [memberGrowth, revenueByMonth, attendanceByMonth, expiredCount] = await Promise.all([
      Member.aggregate([
        { $match: { joiningDate: { $gte: start, $lte: end }, status: { $ne: 'Deleted' }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: { $month: '$joiningDate' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $group: {
            _id: { $month: '$paymentDate' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $group: {
            _id: { $month: '$date' },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Member.countDocuments({ membershipExpiryDate: { $gte: start, $lte: end }, adminId: req.user.id }),
    ]);

    const totalRevenue = revenueByMonth.reduce((sum, r) => sum + r.total, 0);
    const totalCount = revenueByMonth.reduce((sum, r) => sum + r.count, 0);

    res.json({
      success: true,
      data: {
        year,
        renewals: { count: totalCount, revenue: totalRevenue },
        memberGrowth: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          newMembers: memberGrowth.find((m) => m._id === i + 1)?.count || 0,
        })),
        revenueByMonth: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total: revenueByMonth.find((r) => r._id === i + 1)?.total || 0,
          count: revenueByMonth.find((r) => r._id === i + 1)?.count || 0,
        })),
        attendanceByMonth: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          present: attendanceByMonth.find((a) => a._id === i + 1)?.present || 0,
          absent: attendanceByMonth.find((a) => a._id === i + 1)?.absent || 0,
        })),
        expiredMembers: expiredCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/reports/revenue
const getRevenueReport = async (req, res, next) => {
  try {
    const { period = 'month', value } = req.query;
    let start, end;

    if (period === 'month') {
      const [year, month] = (value || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`).split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      start = getStartOfMonth(date);
      end = getEndOfMonth(date);
    } else {
      const year = parseInt(value) || new Date().getFullYear();
      start = getStartOfYear(new Date(year, 0, 1));
      end = getEndOfYear(new Date(year, 0, 1));
    }

    const revenue = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const total = revenue.reduce((sum, r) => sum + r.total, 0);

    res.json({
      success: true,
      data: { period, start, end, total, byMethod: revenue },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/reports/attendance
const getAttendanceReport = async (req, res, next) => {
  try {
    const { period = 'month', value } = req.query;
    let start, end;

    if (period === 'month') {
      const [year, month] = (value || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`).split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      start = getStartOfMonth(date);
      end = getEndOfMonth(date);
    } else {
      const year = parseInt(value) || new Date().getFullYear();
      start = getStartOfYear(new Date(year, 0, 1));
      end = getEndOfYear(new Date(year, 0, 1));
    }

    const stats = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lte: end }, adminId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDailyReport, getWeeklyReport, getMonthlyReport, getYearlyReport, getRevenueReport, getAttendanceReport };
