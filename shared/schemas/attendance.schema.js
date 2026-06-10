const { z } = require('zod');

const attendanceSchema = z.object({
  member: z.string().min(1, 'Member is required'),
  date: z.string().or(z.date()),
  status: z.enum(['Present', 'Absent']),
});

const bulkAttendanceSchema = z.object({
  records: z.array(z.object({
    memberId: z.string().min(1),
    status: z.enum(['Present', 'Absent']),
  })).min(1, 'At least one record required'),
  date: z.string().optional(),
});

module.exports = { attendanceSchema, bulkAttendanceSchema };
