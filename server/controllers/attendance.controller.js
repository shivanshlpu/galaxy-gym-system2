const Attendance = require('../models/Attendance.model');
const Member = require('../models/Member.model');
const ActivityLog = require('../models/ActivityLog.model');
const { getStartOfDay, getEndOfDay, subDays } = require('../utils/dateUtils');

// GET /api/v1/attendance
const getAttendance = async (req, res, next) => {
  try {
    const { date, memberId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (date) {
      const d = new Date(date);
      query.date = { $gte: getStartOfDay(d), $lte: getEndOfDay(d) };
    }
    if (memberId) query.member = memberId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate('member', 'fullName phone memberId photo membershipPlan')
      .populate('markedBy', 'username')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: records,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/attendance/bulk
const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { records, date } = req.body;
    // records: [{ memberId: string, status: 'Present' | 'Absent' }]

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No attendance records provided.', code: 'NO_RECORDS' });
    }

    const attendanceDate = date ? getStartOfDay(new Date(date)) : getStartOfDay();
    const results = [];

    for (const record of records) {
      try {
        const attendance = await Attendance.findOneAndUpdate(
          { member: record.memberId, date: attendanceDate },
          {
            member: record.memberId,
            date: attendanceDate,
            status: record.status,
            markedBy: req.user.id,
          },
          { upsert: true, new: true, runValidators: true }
        );

        // Update member's lastAttendance if present
        if (record.status === 'Present') {
          await Member.findByIdAndUpdate(record.memberId, { lastAttendance: attendanceDate });
        }

        results.push({ memberId: record.memberId, status: record.status, success: true });
      } catch (err) {
        results.push({ memberId: record.memberId, success: false, error: err.message });
      }
    }

    await ActivityLog.create({
      action: 'attendance_marked',
      entityType: 'Attendance',
      performedBy: req.user.id,
      details: { date: attendanceDate, count: records.length },
    });

    res.json({ success: true, data: results, message: `Attendance marked for ${results.filter((r) => r.success).length} members.` });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/attendance/:id
const updateAttendance = async (req, res, next) => {
  try {
    const { status } = req.body;
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, markedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('member', 'fullName memberId');

    if (!attendance) {
      return res.status(404).json({ success: false, error: 'Record not found.', code: 'NOT_FOUND' });
    }

    // Update lastAttendance if changed to Present
    if (status === 'Present') {
      await Member.findByIdAndUpdate(attendance.member._id, { lastAttendance: attendance.date });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/today
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = getStartOfDay();
    const endToday = getEndOfDay();

    // Get all active members
    const activeMembers = await Member.find({ status: 'Active' })
      .populate('membershipPlan', 'name')
      .sort({ fullName: 1 })
      .lean();

    // Get today's attendance records
    const todayRecords = await Attendance.find({
      date: { $gte: today, $lte: endToday },
    }).lean();

    const attendanceMap = {};
    todayRecords.forEach((r) => {
      attendanceMap[r.member.toString()] = r;
    });

    // Get last 7 days attendance for streak display
    const sevenDaysAgo = subDays(today, 7);
    const weekRecords = await Attendance.find({
      date: { $gte: sevenDaysAgo, $lte: endToday },
    }).lean();

    const streakMap = {};
    weekRecords.forEach((r) => {
      const memberId = r.member.toString();
      if (!streakMap[memberId]) streakMap[memberId] = [];
      streakMap[memberId].push({
        date: r.date,
        status: r.status,
      });
    });

    // Merge members with attendance
    const data = activeMembers.map((member) => ({
      ...member,
      todayStatus: attendanceMap[member._id.toString()]?.status || null,
      todayRecordId: attendanceMap[member._id.toString()]?._id || null,
      weekStreak: streakMap[member._id.toString()] || [],
    }));

    const presentCount = todayRecords.filter((r) => r.status === 'Present').length;
    const absentCount = activeMembers.length - presentCount;

    res.json({
      success: true,
      data,
      stats: {
        total: activeMembers.length,
        present: presentCount,
        absent: absentCount,
        rate: activeMembers.length > 0 ? Math.round((presentCount / activeMembers.length) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/member/:id
const getMemberAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { member: req.params.id };

    if (startDate && endDate) {
      query.date = {
        $gte: getStartOfDay(new Date(startDate)),
        $lte: getEndOfDay(new Date(endDate)),
      };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/absent
const getAbsentToday = async (req, res, next) => {
  try {
    const today = getStartOfDay();
    const endToday = getEndOfDay();

    const activeMembers = await Member.find({ status: 'Active' }).lean();
    const todayPresent = await Attendance.find({
      date: { $gte: today, $lte: endToday },
      status: 'Present',
    }).lean();

    const presentIds = new Set(todayPresent.map((r) => r.member.toString()));
    const absentMembers = activeMembers.filter((m) => !presentIds.has(m._id.toString()));

    res.json({ success: true, data: absentMembers });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/stats
const getAttendanceStats = async (req, res, next) => {
  try {
    const { period = 30 } = req.query;
    const startDate = subDays(getStartOfDay(), parseInt(period));

    const stats = await Attendance.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  bulkMarkAttendance,
  updateAttendance,
  getTodayAttendance,
  getMemberAttendance,
  getAbsentToday,
  getAttendanceStats,
};
