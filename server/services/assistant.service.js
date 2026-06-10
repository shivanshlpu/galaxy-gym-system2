const Member = require('../models/Member.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, addDays, subDays } = require('../utils/dateUtils');

const intents = [
  {
    id: 'new_members_today',
    patterns: [/new member.*(today|this day)/i, /how many.*joined.*today/i, /today.*new/i],
    handler: async () => {
      const today = getStartOfDay();
      const end = getEndOfDay();
      const members = await Member.find({ joiningDate: { $gte: today, $lte: end }, status: { $ne: 'Deleted' } });
      return {
        answer: `Today ${members.length} new member${members.length !== 1 ? 's' : ''} joined${members.length > 0 ? ':\n' + members.map((m) => `• ${m.fullName}`).join('\n') : '.'}`,
        data: members,
      };
    },
  },
  {
    id: 'absent_today',
    patterns: [/who.*absent.*today/i, /absent.*today/i, /not.*attend.*today/i],
    handler: async () => {
      const today = getStartOfDay();
      const end = getEndOfDay();
      const activeMembers = await Member.find({ status: 'Active' }).lean();
      const todayPresent = await Attendance.find({ date: { $gte: today, $lte: end }, status: 'Present' }).lean();
      const presentIds = new Set(todayPresent.map((r) => r.member.toString()));
      const absent = activeMembers.filter((m) => !presentIds.has(m._id.toString()));
      return {
        answer: `${absent.length} member${absent.length !== 1 ? 's are' : ' is'} absent today${absent.length > 0 ? ':\n' + absent.map((m) => `• ${m.fullName} (${m.phone})`).join('\n') : '.'}`,
        data: absent,
      };
    },
  },
  {
    id: 'expiring_this_week',
    patterns: [/expir.*(this week|7 days|week)/i, /membership.*expir.*/i, /who.*expiring/i],
    handler: async () => {
      const today = getStartOfDay();
      const weekLater = addDays(today, 7);
      const members = await Member.find({
        status: 'Active',
        membershipExpiryDate: { $gte: today, $lte: weekLater },
      }).populate('membershipPlan', 'name');
      return {
        answer: `${members.length} membership${members.length !== 1 ? 's' : ''} expiring this week${members.length > 0 ? ':\n' + members.map((m) => `• ${m.fullName} — expires ${new Date(m.membershipExpiryDate).toLocaleDateString()}`).join('\n') : '.'}`,
        data: members,
      };
    },
  },
  {
    id: 'active_members',
    patterns: [/how many.*active/i, /active member.*/i, /total active/i],
    handler: async () => {
      const count = await Member.countDocuments({ status: 'Active' });
      return { answer: `There are currently ${count} active member${count !== 1 ? 's' : ''}.`, data: { count } };
    },
  },
  {
    id: 'revenue_this_month',
    patterns: [/revenue.*(this month|month)/i, /how much.*collect/i, /monthly.*income/i, /earnings/i],
    handler: async () => {
      const start = getStartOfMonth();
      const end = getEndOfMonth();
      const result = await Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]);
      const total = result[0]?.total || 0;
      const count = result[0]?.count || 0;
      return { answer: `This month's revenue: ₹${total.toLocaleString()} from ${count} payment${count !== 1 ? 's' : ''}.`, data: { total, count } };
    },
  },
  {
    id: 'inactive_members',
    patterns: [/inactive/i, /not attend.*(5|five) days/i, /absent.*days/i, /not coming/i],
    handler: async () => {
      const cutoff = subDays(getStartOfDay(), 5);
      const members = await Member.find({
        status: 'Active',
        $or: [{ lastAttendance: { $lt: cutoff } }, { lastAttendance: null }],
      });
      return {
        answer: `${members.length} member${members.length !== 1 ? 's have' : ' has'} been inactive for 5+ days${members.length > 0 ? ':\n' + members.map((m) => `• ${m.fullName}`).join('\n') : '.'}`,
        data: members,
      };
    },
  },
  {
    id: 'today_attendance',
    patterns: [/attendance.*today/i, /today.*attendance/i, /how many.*present/i],
    handler: async () => {
      const today = getStartOfDay();
      const end = getEndOfDay();
      const present = await Attendance.countDocuments({ date: { $gte: today, $lte: end }, status: 'Present' });
      const activeCount = await Member.countDocuments({ status: 'Active' });
      const absent = activeCount - present;
      const rate = activeCount > 0 ? Math.round((present / activeCount) * 100) : 0;
      return {
        answer: `Today's attendance: ${present} present, ${absent} absent out of ${activeCount} active members (${rate}% attendance rate).`,
        data: { present, absent, total: activeCount, rate },
      };
    },
  },
  {
    id: 'pending_payments',
    patterns: [/pending payment/i, /who.*not paid/i, /payment.*due/i, /unpaid/i],
    handler: async () => {
      const members = await Member.find({ paymentStatus: { $in: ['Pending', 'Overdue'] }, status: { $ne: 'Deleted' } });
      return {
        answer: `${members.length} member${members.length !== 1 ? 's have' : ' has'} pending payments${members.length > 0 ? ':\n' + members.map((m) => `• ${m.fullName} (${m.paymentStatus})`).join('\n') : '.'}`,
        data: members,
      };
    },
  },
  {
    id: 'total_members',
    patterns: [/total member/i, /how many member/i, /member count/i],
    handler: async () => {
      const total = await Member.countDocuments({ status: { $ne: 'Deleted' } });
      const active = await Member.countDocuments({ status: 'Active' });
      const expired = await Member.countDocuments({ status: 'Expired' });
      return {
        answer: `Total members: ${total} (${active} active, ${expired} expired).`,
        data: { total, active, expired },
      };
    },
  },
  {
    id: 'new_members_month',
    patterns: [/new member.*(this month|month)/i, /joined.*(this month|month)/i],
    handler: async () => {
      const start = getStartOfMonth();
      const end = getEndOfMonth();
      const members = await Member.find({ joiningDate: { $gte: start, $lte: end }, status: { $ne: 'Deleted' } });
      return {
        answer: `${members.length} new member${members.length !== 1 ? 's' : ''} joined this month${members.length > 0 ? ':\n' + members.map((m) => `• ${m.fullName}`).join('\n') : '.'}`,
        data: members,
      };
    },
  },
];

const fallbackResponse = {
  answer:
    "I didn't understand that query. Try asking:\n• Who is absent today?\n• How many active members?\n• Which memberships expire this week?\n• What is this month's revenue?\n• Who has not attended for 5 days?\n• How many members joined today?\n• List pending payments\n• What is today's attendance count?",
  data: null,
};

const processQuery = async (query) => {
  if (!query || typeof query !== 'string') return fallbackResponse;

  const normalizedQuery = query.toLowerCase().trim();

  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (pattern.test(normalizedQuery)) {
        try {
          return await intent.handler();
        } catch (error) {
          return { answer: `Sorry, I encountered an error: ${error.message}`, data: null };
        }
      }
    }
  }

  return fallbackResponse;
};

const getSuggestions = () => [
  'Who is absent today?',
  'How many members are active?',
  'Which memberships expire this week?',
  "What is this month's revenue?",
  'Who has not attended for 5 days?',
  'How many members joined today?',
  'List pending payments',
  "What is today's attendance count?",
];

module.exports = { processQuery, getSuggestions };
