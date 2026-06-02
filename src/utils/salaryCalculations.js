// Salary Calculation Utilities
import { STATUTORY_LIMITS } from '../constants/config';
import payrollDataStore from '../services/payrollDataStore';

export const calculateEarnings = (staff, attendance, workingDays) => {
  if (!staff || !staff.salary) return null;

  const { salary } = staff;
  const presentDays = attendance?.present || 0;
  const halfDays = attendance?.halfDay || 0;
  const overtimeHours = attendance?.overtimeHours || 0;

  // Calculate effective days (half day = 0.5)
  const effectiveDays = presentDays + (halfDays * 0.5);

  // Division-by-zero protection
  const safeDivisor = workingDays > 0 ? workingDays : 1;

  // Per-day rates
  const perDayBasic = salary.basic / safeDivisor;
  const perDayHRA = (salary.hra || 0) / safeDivisor;
  const perDayConveyance = (salary.conveyance || 0) / safeDivisor;

  // Calculate earnings based on attendance
  const basicPay = Math.round(perDayBasic * effectiveDays);
  const hra = Math.round(perDayHRA * effectiveDays);
  const conveyance = Math.round(perDayConveyance * effectiveDays);

  // Fixed allowances (usually full month)
  const medical = salary.medical || 0;
  // Support both field names: specialAllowance and otherAllowances
  const specialAllowance = salary.specialAllowance || salary.otherAllowances || 0;

  // Overtime calculation
  const hourlyRate = salary.basic / (safeDivisor * 8); // 8 hours per day
  const overtimeRate = staff.payroll?.attendance?.overtimeRate || 1.5;
  const overtimePay = Math.round(overtimeHours * hourlyRate * overtimeRate);

  // Calculate bonus and incentive using month/year from attendance context
  const month = attendance?.month;
  const year = attendance?.year;
  const bonus = (month && year) ? (payrollDataStore.calculateBonusAmount(staff.id, month, year) || 0) : 0;

  // Calculate incentive based on attendance metrics
  const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
  const metrics = {
    attendancePercentage,
    presentDays,
    workingDays,
    totalSales: 0,
    performanceScore: 0
  };
  const incentive = (month && year) ? (payrollDataStore.calculateIncentiveAmount(staff.id, month, year, metrics) || 0) : 0;

  // Total earnings
  const totalEarnings = basicPay + hra + conveyance + medical + specialAllowance + overtimePay + bonus + incentive;

  return {
    basicPay,
    hra,
    conveyance,
    medical,
    specialAllowance,
    overtimePay,
    bonus,
    incentive,
    totalEarnings: Math.round(totalEarnings)
  };
};

// Calculate deductions WITHOUT side effects.
// Advances/loans are previewed only. Actual deduction happens in finalizeSalaryDeductions().
export const calculateDeductions = (staff, attendance, grossSalary) => {
  if (!staff || !staff.salary) return null;

  const { salary } = staff;

  // PF Calculation (12% of basic, max on 15000)
  const pfBase = Math.min(salary.basic, STATUTORY_LIMITS.PF_BASIC_LIMIT);
  const pf = salary.pfApplicable ? Math.round(pfBase * STATUTORY_LIMITS.PF_RATE) : 0;

  // ESI Calculation (0.75% of gross if gross <= 21000)
  const esi = (salary.esiApplicable && grossSalary <= STATUTORY_LIMITS.ESI_WAGE_LIMIT)
    ? Math.round(grossSalary * STATUTORY_LIMITS.ESI_EMPLOYEE_RATE)
    : 0;

  // Professional Tax (Maharashtra) - single source of truth from config
  let pt = 0;
  if (grossSalary >= 10000) {
    pt = 200;
  } else if (grossSalary >= 7500) {
    pt = 175;
  }

  // TDS (if applicable)
  const tds = salary.tds || 0;

  // Late mark penalty
  const lateMarks = attendance?.lateMarks || 0;
  const lateMarkPenalty = lateMarks * (staff.payroll?.attendance?.lateMarkPenalty || 100);

  // Preview advance/loan recovery amounts WITHOUT mutating data
  let advance = 0;
  let advanceDetails = [];
  let loan = 0;
  let loanDetails = [];

  // Preview pending advances (read-only)
  const pendingAdvances = payrollDataStore.getPendingAdvances(staff.id);
  const maxAdvanceDeduction = Math.round(grossSalary * 0.5);
  let remainingAdvance = maxAdvanceDeduction;
  for (const adv of pendingAdvances) {
    if (remainingAdvance <= 0) break;
    const deductAmount = Math.min(adv.balance, remainingAdvance);
    advance += deductAmount;
    advanceDetails.push({ advanceId: adv.id, amount: deductAmount });
    remainingAdvance -= deductAmount;
  }

  // Preview loan EMIs (read-only)
  const activeLoans = payrollDataStore.getActiveLoans(staff.id);
  for (const ln of activeLoans) {
    const emiAmount = ln.monthlyEMI;
    loan += emiAmount;
    loanDetails.push({ loanId: ln.id, emi: emiAmount });
  }

  // Calculate arrears (to be added to earnings, not deductions)
  const arrears = payrollDataStore.calculateArrearsAmount(staff.id) || 0;

  // Total deductions
  const totalDeductions = pf + esi + pt + tds + lateMarkPenalty + advance + loan;

  return {
    pf,
    esi,
    pt,
    tds,
    lateMarkPenalty,
    advance,
    loan,
    arrears,
    advanceDetails,
    loanDetails,
    other: 0,
    totalDeductions: Math.round(totalDeductions)
  };
};

// Actually deduct advances and loans from data store - call ONLY when salary is finalized
export const finalizeSalaryDeductions = (staffId, advanceDetails, loanDetails) => {
  // Deduct advances
  if (advanceDetails && advanceDetails.length > 0) {
    const maxDeduction = advanceDetails.reduce((sum, d) => sum + d.amount, 0);
    payrollDataStore.deductAdvanceFromSalary(staffId, maxDeduction);
  }

  // Deduct loan EMIs
  if (loanDetails && loanDetails.length > 0) {
    payrollDataStore.deductLoanEMI(staffId);
  }
};

export const calculateNetSalary = (earnings, deductions) => {
  if (!earnings || !deductions) return 0;

  const grossSalary = earnings.totalEarnings;
  const arrears = deductions.arrears || 0;
  const netSalary = grossSalary + arrears - deductions.totalDeductions;

  return {
    grossSalary,
    arrears,
    totalDeductions: deductions.totalDeductions,
    netSalary: Math.max(0, Math.round(netSalary)) // Ensure non-negative
  };
};

export const calculateAttendanceSummary = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return {
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      weekOff: 0,
      holiday: 0,
      lateMarks: 0,
      overtimeHours: 0
    };
  }

  const summary = {
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    weekOff: 0,
    holiday: 0,
    lateMarks: 0,
    overtimeHours: 0
  };

  attendanceRecords.forEach(record => {
    switch (record.status) {
      case 'present':
        summary.present++;
        break;
      case 'absent':
        summary.absent++;
        break;
      case 'half-day':
      case 'halfDay': // Support both formats
        summary.halfDay++;
        break;
      case 'leave':
        summary.leave++;
        break;
      case 'week-off':
        summary.weekOff++;
        break;
      case 'holiday':
        summary.holiday++;
        break;
    }

    if (record.isLate) {
      summary.lateMarks++;
    }

    if (record.actual?.overtimeHours) {
      summary.overtimeHours += record.actual.overtimeHours;
    }
  });

  return summary;
};

export const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

export const getWorkingDaysInMonth = (month, year, weeklyOffs = ['Sunday']) => {
  const totalDays = getDaysInMonth(month, year);
  let workingDays = 0;

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    if (!weeklyOffs.includes(dayName)) {
      workingDays++;
    }
  }

  return workingDays;
};

export const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default {
  calculateEarnings,
  calculateDeductions,
  finalizeSalaryDeductions,
  calculateNetSalary,
  calculateAttendanceSummary,
  getDaysInMonth,
  getWorkingDaysInMonth,
  formatCurrency
};
