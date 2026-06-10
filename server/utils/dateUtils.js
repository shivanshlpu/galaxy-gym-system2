const {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  subDays,
  differenceInDays,
  format,
  parseISO,
  isValid,
} = require('date-fns');

const getStartOfDay = (date = new Date()) => startOfDay(date);
const getEndOfDay = (date = new Date()) => endOfDay(date);
const getStartOfWeek = (date = new Date()) => startOfWeek(date, { weekStartsOn: 1 });
const getEndOfWeek = (date = new Date()) => endOfWeek(date, { weekStartsOn: 1 });
const getStartOfMonth = (date = new Date()) => startOfMonth(date);
const getEndOfMonth = (date = new Date()) => endOfMonth(date);
const getStartOfYear = (date = new Date()) => startOfYear(date);
const getEndOfYear = (date = new Date()) => endOfYear(date);

const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), startOfDay(new Date()));
};

const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  if (!date) return null;
  return format(new Date(date), formatStr);
};

const parseDateString = (dateStr) => {
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
};

module.exports = {
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  differenceInDays,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  getDaysRemaining,
  formatDate,
  parseDateString,
  format,
  parseISO,
  isValid,
};
