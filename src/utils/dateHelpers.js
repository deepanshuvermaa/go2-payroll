// Date utility functions
import { format, parse, isValid, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, formatStr);
};

export const formatDateTime = (date) => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatDisplayDate = (date) => {
  return formatDate(date, 'dd MMM yyyy');
};

export const formatTime = (time) => {
  if (!time) return '';
  return format(new Date(`2000-01-01T${time}`), 'hh:mm a');
};

export const getCurrentMonth = () => {
  return new Date().getMonth() + 1;
};

export const getCurrentYear = () => {
  return new Date().getFullYear();
};

export const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
};

export const getMonthOptions = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1)
  }));
};

export const getYearOptions = (yearsBack = 5, yearsForward = 1) => {
  const currentYear = getCurrentYear();
  const years = [];

  for (let i = currentYear - yearsBack; i <= currentYear + yearsForward; i++) {
    years.push({ value: i, label: i.toString() });
  }

  return years;
};

export const getMonthDates = (month, year) => {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end });
};

export const getDayName = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEEE');
};

export const isWeekend = (date, weeklyOffs = ['Sunday']) => {
  const dayName = getDayName(date);
  return weeklyOffs.includes(dayName);
};

export const calculateWorkingHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return 0;

  const inTime = new Date(`2000-01-01T${clockIn}`);
  const outTime = new Date(`2000-01-01T${clockOut}`);

  const diffMs = outTime - inTime;
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.max(0, parseFloat(diffHours.toFixed(2)));
};

export const calculateLateMinutes = (scheduledTime, actualTime) => {
  if (!scheduledTime || !actualTime) return 0;

  const scheduled = new Date(`2000-01-01T${scheduledTime}`);
  const actual = new Date(`2000-01-01T${actualTime}`);

  const diffMs = actual - scheduled;
  const diffMinutes = diffMs / (1000 * 60);

  return Math.max(0, Math.round(diffMinutes));
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export const isToday = (date) => {
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : date;

  return formatDate(today) === formatDate(checkDate);
};

export const isPastDate = (date) => {
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : date;

  return checkDate < today;
};

export const isFutureDate = (date) => {
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : date;

  return checkDate > today;
};

// Currency formatting
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Get current month and year
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

// Get previous month and year
export const getPreviousMonthYear = () => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return {
    month: prevMonth,
    year: prevYear
  };
};

// Get working days in month
export const getWorkingDaysInMonth = (month, year, weeklyOffs = ['Sunday']) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayName = format(date, 'EEEE');
    if (!weeklyOffs.includes(dayName)) {
      workingDays++;
    }
  }

  return workingDays;
};

// Get days in month
export const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

export default {
  formatDate,
  formatDateTime,
  formatDisplayDate,
  formatTime,
  getCurrentMonth,
  getCurrentYear,
  getMonthName,
  getMonthOptions,
  getYearOptions,
  getMonthDates,
  getDayName,
  isWeekend,
  calculateWorkingHours,
  calculateLateMinutes,
  addDays,
  subtractDays,
  isToday,
  isPastDate,
  isFutureDate
};
