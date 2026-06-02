// Central Data Store for Go2-Payroll
// Stores all payroll data in localStorage (like Go2-Desktop's centralDataStore)

class PayrollDataStore {
  constructor() {
    this.STORAGE_KEYS = {
      // Master Data
      STAFF: 'payroll_staff',
      DEPARTMENTS: 'payroll_departments',
      DESIGNATIONS: 'payroll_designations',

      // Attendance
      ATTENDANCE: 'payroll_attendance',
      HOLIDAYS: 'payroll_holidays',

      // Salary
      SALARY_RECORDS: 'payroll_salaries',
      SALARY_TEMPLATES: 'payroll_salary_templates',

      // Leave
      LEAVE_APPLICATIONS: 'payroll_leaves',
      LEAVE_TYPES: 'payroll_leave_types',

      // Advances & Loans
      ADVANCES: 'payroll_advances',
      LOANS: 'payroll_loans',

      // Settings
      COMPANY_SETTINGS: 'payroll_company_settings',
      PAYROLL_SETTINGS: 'payroll_settings',

      // Counters
      LAST_STAFF_ID: 'payroll_last_staff_id',
      LAST_SALARY_SLIP: 'payroll_last_salary_slip',
      LAST_LEAVE_NUMBER: 'payroll_last_leave_number',

      // Additional Features (Phase 2+)
      BONUSES: 'payroll_bonuses',
      INCENTIVES: 'payroll_incentives',
      SHIFTS: 'payroll_shifts',
      ROSTERS: 'payroll_rosters',
      LEAVE_ACCRUALS: 'payroll_leave_accruals',
      COMP_OFFS: 'payroll_comp_offs',
      ATTENDANCE_SETTINGS: 'payroll_attendance_settings',
      BREAK_RECORDS: 'payroll_break_records',
      AUTO_ABSENT_SETTINGS: 'payroll_auto_absent_settings',
      AUTO_ABSENT_LOG: 'payroll_auto_absent_log',
      LEAVE_CARRY_FORWARD: 'payroll_leave_carry_forward',
      LEAVE_CARRY_FORWARD_SETTINGS: 'payroll_leave_carry_forward_settings',
      LEAVE_ENCASHMENT: 'payroll_leave_encashment',
      LEAVE_ENCASHMENT_SETTINGS: 'payroll_leave_encashment_settings',
      RESTRICTED_HOLIDAYS: 'payroll_restricted_holidays',
      RESTRICTED_HOLIDAYS_SETTINGS: 'payroll_restricted_holidays_settings',
      RESTRICTED_HOLIDAYS_REQUESTS: 'payroll_restricted_holidays_requests',
      CURRENCY_SETTINGS: 'payroll_currency_settings',
      EXCHANGE_RATES: 'payroll_exchange_rates',
      ATTENDANCE_REGULARIZATION: 'payroll_attendance_regularization',
      ATTENDANCE_REGULARIZATION_SETTINGS: 'payroll_attendance_regularization_settings',
      TAX_DECLARATIONS: 'payroll_tax_declarations',
      FORM16_DATA: 'payroll_form16_data',
      TAX_COMPUTATION: 'payroll_tax_computation',
      STATUTORY_REPORTS: 'payroll_statutory_reports',
      AUTO_SALARY_SETTINGS: 'payroll_auto_salary_settings',
      AUTO_SALARY_LOG: 'payroll_auto_salary_log',
      SALARY_ADVANCES: 'payroll_salary_advances',
      LOAN_EMI: 'payroll_loan_emi',
      ARREARS: 'payroll_arrears',
      BONUS_RULES: 'payroll_bonus_rules',
      AUDIT_TRAIL: 'payroll_audit_trail',
      COMPLIANCE_CALENDAR: 'payroll_compliance_calendar',
      CUSTOM_REPORTS: 'payroll_custom_reports',
      SCHEDULED_REPORTS: 'payroll_scheduled_reports',
      EXPORT_HISTORY: 'payroll_export_history',
      BANK_ACCOUNTS: 'payroll_bank_accounts',
      PAYMENT_BATCHES: 'payroll_payment_batches',
      PAYMENT_TRANSACTIONS: 'payroll_payment_transactions',
      BANK_RECONCILIATION: 'payroll_bank_reconciliation',
      ROLES: 'payroll_roles',
      PERMISSIONS: 'payroll_permissions',
      USER_ROLES: 'payroll_user_roles',
      ACCESS_LOG: 'payroll_access_log',

      // WorkLog Feature
      WORKLOGS: 'payroll_worklogs',
      WORKLOG_PRAISE: 'payroll_worklog_praise',
      WORKLOG_REVIEW_CYCLES: 'payroll_worklog_review_cycles',
      WORKLOG_SETTINGS: 'payroll_worklog_settings',
      WORKLOG_GOALS: 'payroll_worklog_goals',
      WORKLOG_SKILLS: 'payroll_worklog_skills',
    };
  }

  // Generate unique ID - used across all entity creation methods
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Audit trail logging - call from CRUD operations
  logAudit(action, entity, entityId, changes = null) {
    try {
      const trail = this.getData(this.STORAGE_KEYS.AUDIT_TRAIL) || [];
      const user = this.getCurrentUser();
      trail.push({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        action,
        entity,
        entityId,
        changes,
        performedBy: user?.email || user?.name || 'system',
        timestamp: new Date().toISOString()
      });
      // Keep last 1000 entries to avoid localStorage bloat
      if (trail.length > 1000) trail.splice(0, trail.length - 1000);
      this.setData(this.STORAGE_KEYS.AUDIT_TRAIL, trail);
    } catch (e) {
      // Audit logging should never break the app
    }
  }

  // Get audit trail entries
  getAuditTrail(filters = {}) {
    const trail = this.getData(this.STORAGE_KEYS.AUDIT_TRAIL) || [];
    let filtered = trail;
    if (filters.entity) filtered = filtered.filter(e => e.entity === filters.entity);
    if (filters.action) filtered = filtered.filter(e => e.action === filters.action);
    if (filters.startDate) filtered = filtered.filter(e => e.timestamp >= filters.startDate);
    if (filters.endDate) filtered = filtered.filter(e => e.timestamp <= filters.endDate);
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user-specific key (for multi-user support)
  getUserKey(key) {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id) {
      return `user_${currentUser.id}_${key}`;
    }
    return key;
  }

  // Generic get method
  getData(key) {
    try {
      const userKey = this.getUserKey(key);
      const data = localStorage.getItem(userKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  }

  // Generic set method
  setData(key, value) {
    try {
      const userKey = this.getUserKey(key);
      localStorage.setItem(userKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      return false;
    }
  }

  // ========== STAFF METHODS ==========

  getStaff() {
    return this.getData(this.STORAGE_KEYS.STAFF) || [];
  }

  getStaffById(id) {
    const staff = this.getStaff();
    return staff.find(s => s.id === id) || null;
  }

  addStaff(staffMember) {
    const staff = this.getStaff();

    // Generate ID if not provided
    if (!staffMember.id) {
      staffMember.id = `staff_${Date.now()}`;
    }

    // Generate employee ID if not provided
    if (!staffMember.employeeId) {
      const lastId = this.getData(this.STORAGE_KEYS.LAST_STAFF_ID) || 0;
      const newId = lastId + 1;
      staffMember.employeeId = `EMP${String(newId).padStart(4, '0')}`;
      this.setData(this.STORAGE_KEYS.LAST_STAFF_ID, newId);
    }

    staffMember.createdAt = new Date().toISOString();
    staffMember.updatedAt = new Date().toISOString();

    staff.push(staffMember);
    this.setData(this.STORAGE_KEYS.STAFF, staff);
    this.logAudit('create', 'staff', staffMember.id, { name: staffMember.name });
    return staffMember;
  }

  updateStaff(staffMember) {
    const staff = this.getStaff();
    const index = staff.findIndex(s => s.id === staffMember.id);

    if (index !== -1) {
      staffMember.updatedAt = new Date().toISOString();
      staff[index] = staffMember;
      this.setData(this.STORAGE_KEYS.STAFF, staff);
      this.logAudit('update', 'staff', staffMember.id, { name: staffMember.name });
      return staffMember;
    }
    return null;
  }

  deleteStaff(id) {
    const staff = this.getStaff();
    const deleted = staff.find(s => s.id === id);
    const filtered = staff.filter(s => s.id !== id);
    this.setData(this.STORAGE_KEYS.STAFF, filtered);
    this.logAudit('delete', 'staff', id, { name: deleted?.name });
    return true;
  }

  // ========== ATTENDANCE METHODS ==========

  getAttendance(month, year) {
    const allAttendance = this.getData(this.STORAGE_KEYS.ATTENDANCE) || [];
    if (!month || !year) return allAttendance;

    return allAttendance.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
  }

  getAttendanceByStaff(staffId, month, year) {
    const attendance = this.getAttendance(month, year);
    return attendance.filter(a => a.staffId === staffId);
  }

  getAttendanceByDate(staffId, date) {
    const allAttendance = this.getData(this.STORAGE_KEYS.ATTENDANCE) || [];
    return allAttendance.find(a => a.staffId === staffId && a.date === date);
  }

  addAttendance(attendanceRecord) {
    const allAttendance = this.getData(this.STORAGE_KEYS.ATTENDANCE) || [];

    if (!attendanceRecord.id) {
      attendanceRecord.id = `att_${Date.now()}`;
    }

    attendanceRecord.createdAt = new Date().toISOString();
    attendanceRecord.updatedAt = new Date().toISOString();

    allAttendance.push(attendanceRecord);
    this.setData(this.STORAGE_KEYS.ATTENDANCE, allAttendance);
    return attendanceRecord;
  }

  updateAttendance(attendanceRecord) {
    const allAttendance = this.getData(this.STORAGE_KEYS.ATTENDANCE) || [];
    const index = allAttendance.findIndex(a => a.id === attendanceRecord.id);

    if (index !== -1) {
      attendanceRecord.updatedAt = new Date().toISOString();
      allAttendance[index] = attendanceRecord;
      this.setData(this.STORAGE_KEYS.ATTENDANCE, allAttendance);
      return attendanceRecord;
    }
    return null;
  }

  deleteAttendance(id) {
    const allAttendance = this.getData(this.STORAGE_KEYS.ATTENDANCE) || [];
    const filtered = allAttendance.filter(a => a.id !== id);
    this.setData(this.STORAGE_KEYS.ATTENDANCE, filtered);
    return true;
  }

  // ========== SALARY METHODS ==========

  getSalaryRecords(month, year) {
    const allSalaries = this.getData(this.STORAGE_KEYS.SALARY_RECORDS) || [];
    if (!month || !year) return allSalaries;

    return allSalaries.filter(s => {
      // Support both formats: s.period.month or s.month
      const recordMonth = s.period ? s.period.month : s.month;
      const recordYear = s.period ? s.period.year : s.year;
      return recordMonth === month && recordYear === year;
    });
  }

  getSalaryByStaff(staffId, month, year) {
    const salaries = this.getSalaryRecords(month, year);
    return salaries.find(s => s.staffId === staffId) || null;
  }

  // Get all salary records for a staff member (across all months)
  getSalaryRecordsByStaff(staffId) {
    const allSalaries = this.getData(this.STORAGE_KEYS.SALARY_RECORDS) || [];
    return allSalaries.filter(s => s.staffId === staffId);
  }

  addSalaryRecord(salaryRecord) {
    const allSalaries = this.getData(this.STORAGE_KEYS.SALARY_RECORDS) || [];

    if (!salaryRecord.id) {
      salaryRecord.id = `sal_${Date.now()}`;
    }

    // Generate slip number
    if (!salaryRecord.slipNumber) {
      const lastSlip = this.getData(this.STORAGE_KEYS.LAST_SALARY_SLIP) || 0;
      const newSlip = lastSlip + 1;
      const year = salaryRecord.period ? salaryRecord.period.year : salaryRecord.year;
      const month = salaryRecord.period ? salaryRecord.period.month : salaryRecord.month;
      salaryRecord.slipNumber = `SAL/${year}/${String(month).padStart(2, '0')}/${String(newSlip).padStart(3, '0')}`;
      this.setData(this.STORAGE_KEYS.LAST_SALARY_SLIP, newSlip);
    }

    salaryRecord.createdAt = new Date().toISOString();

    allSalaries.push(salaryRecord);
    this.setData(this.STORAGE_KEYS.SALARY_RECORDS, allSalaries);
    this.logAudit('create', 'salary', salaryRecord.id, { staffId: salaryRecord.staffId, month: salaryRecord.month || salaryRecord.period?.month, year: salaryRecord.year || salaryRecord.period?.year });
    return salaryRecord;
  }

  updateSalaryRecord(salaryRecord) {
    const allSalaries = this.getData(this.STORAGE_KEYS.SALARY_RECORDS) || [];
    const index = allSalaries.findIndex(s => s.id === salaryRecord.id);

    if (index !== -1) {
      salaryRecord.updatedAt = new Date().toISOString();
      allSalaries[index] = salaryRecord;
      this.setData(this.STORAGE_KEYS.SALARY_RECORDS, allSalaries);
      return salaryRecord;
    }
    return null;
  }

  // ========== LEAVE METHODS ==========

  getLeaveApplications(status = null) {
    const allLeaves = this.getData(this.STORAGE_KEYS.LEAVE_APPLICATIONS) || [];
    if (!status) return allLeaves;
    return allLeaves.filter(l => l.status === status);
  }

  getLeaveByStaff(staffId) {
    const allLeaves = this.getData(this.STORAGE_KEYS.LEAVE_APPLICATIONS) || [];
    return allLeaves.filter(l => l.staffId === staffId);
  }

  addLeaveApplication(leaveApp) {
    const allLeaves = this.getData(this.STORAGE_KEYS.LEAVE_APPLICATIONS) || [];

    if (!leaveApp.id) {
      leaveApp.id = `leave_${Date.now()}`;
    }

    // Generate leave number
    if (!leaveApp.leaveNumber) {
      const lastLeave = this.getData(this.STORAGE_KEYS.LAST_LEAVE_NUMBER) || 0;
      const newLeave = lastLeave + 1;
      leaveApp.leaveNumber = `LV/${new Date().getFullYear()}/${String(newLeave).padStart(3, '0')}`;
      this.setData(this.STORAGE_KEYS.LAST_LEAVE_NUMBER, newLeave);
    }

    leaveApp.createdAt = new Date().toISOString();

    allLeaves.push(leaveApp);
    this.setData(this.STORAGE_KEYS.LEAVE_APPLICATIONS, allLeaves);
    return leaveApp;
  }

  updateLeaveApplication(leaveApp) {
    const allLeaves = this.getData(this.STORAGE_KEYS.LEAVE_APPLICATIONS) || [];
    const index = allLeaves.findIndex(l => l.id === leaveApp.id);

    if (index !== -1) {
      leaveApp.updatedAt = new Date().toISOString();
      allLeaves[index] = leaveApp;
      this.setData(this.STORAGE_KEYS.LEAVE_APPLICATIONS, allLeaves);
      return leaveApp;
    }
    return null;
  }

  // ========== SETTINGS METHODS ==========

  getCompanySettings() {
    return this.getData(this.STORAGE_KEYS.COMPANY_SETTINGS) || {};
  }

  setCompanySettings(settings) {
    return this.setData(this.STORAGE_KEYS.COMPANY_SETTINGS, settings);
  }

  getPayrollSettings() {
    return this.getData(this.STORAGE_KEYS.PAYROLL_SETTINGS) || {};
  }

  setPayrollSettings(settings) {
    return this.setData(this.STORAGE_KEYS.PAYROLL_SETTINGS, settings);
  }

  // ========== UTILITY METHODS ==========

  exportAllData() {
    const allData = {};
    Object.values(this.STORAGE_KEYS).forEach(key => {
      allData[key] = this.getData(key);
    });
    return allData;
  }

  importAllData(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.setData(key, value);
    });
    return true;
  }

  clearAllData() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      const userKey = this.getUserKey(key);
      localStorage.removeItem(userKey);
    });
    return true;
  }

  // ========== ADDITIONAL UTILITY METHODS ==========

  // Alias for setData - used by some components
  saveData(key, data) {
    return this.setData(key, data);
  }

  // Get Settings (consolidated)
  getSettings() {
    return {
      company: this.getCompanySettings(),
      payroll: this.getPayrollSettings(),
      attendance: this.getData(this.STORAGE_KEYS.ATTENDANCE_SETTINGS) || {}
    };
  }

  // Update Settings (consolidated)
  updateSettings(settings) {
    if (settings.company) {
      this.setCompanySettings(settings.company);
    }
    if (settings.payroll) {
      this.setPayrollSettings(settings.payroll);
    }
    if (settings.attendance) {
      this.setData(this.STORAGE_KEYS.ATTENDANCE_SETTINGS, settings.attendance);
    }
    return true;
  }

  // ========== SALARY ADVANCE METHODS ==========

  getAdvances() {
    return this.getData(this.STORAGE_KEYS.ADVANCES) || [];
  }

  getAdvancesByStaff(staffId) {
    const advances = this.getAdvances();
    return advances.filter(a => a.staffId === staffId);
  }

  getPendingAdvances(staffId) {
    const advances = this.getAdvancesByStaff(staffId);
    return advances.filter(a => a.status === 'pending' || a.balance > 0);
  }

  addAdvance(advance) {
    const advances = this.getAdvances();

    if (!advance.id) {
      advance.id = `adv_${Date.now()}`;
    }

    advance.appliedDate = advance.appliedDate || new Date().toISOString();
    advance.status = advance.status || 'pending';
    advance.balance = advance.amount; // Initially full amount is balance
    advance.deductedAmount = 0;

    advances.push(advance);
    this.setData(this.STORAGE_KEYS.ADVANCES, advances);
    return advance;
  }

  updateAdvance(advance) {
    const advances = this.getAdvances();
    const index = advances.findIndex(a => a.id === advance.id);

    if (index !== -1) {
      advance.updatedAt = new Date().toISOString();
      advances[index] = advance;
      this.setData(this.STORAGE_KEYS.ADVANCES, advances);
      return advance;
    }
    return null;
  }

  approveAdvance(advanceId) {
    const advance = this.getAdvances().find(a => a.id === advanceId);
    if (advance) {
      advance.status = 'approved';
      advance.approvedDate = new Date().toISOString();
      return this.updateAdvance(advance);
    }
    return null;
  }

  deductAdvanceFromSalary(staffId, amount) {
    const pendingAdvances = this.getPendingAdvances(staffId);
    let remainingAmount = amount;
    const deductions = [];

    for (const advance of pendingAdvances) {
      if (remainingAmount <= 0) break;

      const deductAmount = Math.min(advance.balance, remainingAmount);
      advance.balance -= deductAmount;
      advance.deductedAmount += deductAmount;

      if (advance.balance === 0) {
        advance.status = 'completed';
      }

      this.updateAdvance(advance);
      deductions.push({ advanceId: advance.id, amount: deductAmount });
      remainingAmount -= deductAmount;
    }

    return { totalDeducted: amount - remainingAmount, deductions };
  }

  // ========== LOAN MANAGEMENT METHODS ==========

  getLoans() {
    return this.getData(this.STORAGE_KEYS.LOANS) || [];
  }

  getLoansByStaff(staffId) {
    const loans = this.getLoans();
    return loans.filter(l => l.staffId === staffId);
  }

  getActiveLoans(staffId) {
    const loans = this.getLoansByStaff(staffId);
    return loans.filter(l => l.status === 'active' && l.balance > 0);
  }

  addLoan(loan) {
    const loans = this.getLoans();

    if (!loan.id) {
      loan.id = `loan_${Date.now()}`;
    }

    loan.appliedDate = loan.appliedDate || new Date().toISOString();
    loan.status = loan.status || 'pending';
    loan.balance = loan.amount;
    loan.paidAmount = 0;
    loan.emiCount = loan.tenure || 12; // Default 12 months
    loan.monthlyEMI = loan.amount / loan.emiCount;

    loans.push(loan);
    this.setData(this.STORAGE_KEYS.LOANS, loans);
    return loan;
  }

  updateLoan(loan) {
    const loans = this.getLoans();
    const index = loans.findIndex(l => l.id === loan.id);

    if (index !== -1) {
      loan.updatedAt = new Date().toISOString();
      loans[index] = loan;
      this.setData(this.STORAGE_KEYS.LOANS, loans);
      return loan;
    }
    return null;
  }

  approveLoan(loanId) {
    const loan = this.getLoans().find(l => l.id === loanId);
    if (loan) {
      loan.status = 'active';
      loan.approvedDate = new Date().toISOString();
      loan.startDate = new Date().toISOString();
      return this.updateLoan(loan);
    }
    return null;
  }

  deductLoanEMI(staffId) {
    const activeLoans = this.getActiveLoans(staffId);
    let totalEMI = 0;
    const emiDetails = [];

    for (const loan of activeLoans) {
      const emiAmount = loan.monthlyEMI;
      loan.balance -= emiAmount;
      loan.paidAmount += emiAmount;

      if (loan.balance <= 0) {
        loan.status = 'completed';
        loan.completedDate = new Date().toISOString();
      }

      this.updateLoan(loan);
      emiDetails.push({ loanId: loan.id, emi: emiAmount });
      totalEMI += emiAmount;
    }

    return { totalEMI, emiDetails };
  }

  // ========== REIMBURSEMENT METHODS ==========

  getReimbursements() {
    return this.getData('payroll_reimbursements') || [];
  }

  getReimbursementsByStaff(staffId) {
    const reimbursements = this.getReimbursements();
    return reimbursements.filter(r => r.staffId === staffId);
  }

  addReimbursement(reimbursement) {
    const reimbursements = this.getReimbursements();

    if (!reimbursement.id) {
      reimbursement.id = `reimb_${Date.now()}`;
    }

    reimbursement.submittedDate = reimbursement.submittedDate || new Date().toISOString();
    reimbursement.status = reimbursement.status || 'pending';

    reimbursements.push(reimbursement);
    this.setData('payroll_reimbursements', reimbursements);
    return reimbursement;
  }

  updateReimbursement(reimbursement) {
    const reimbursements = this.getReimbursements();
    const index = reimbursements.findIndex(r => r.id === reimbursement.id);

    if (index !== -1) {
      reimbursement.updatedAt = new Date().toISOString();
      reimbursements[index] = reimbursement;
      this.setData('payroll_reimbursements', reimbursements);
      return reimbursement;
    }
    return null;
  }

  approveReimbursement(reimbursementId) {
    const reimbursement = this.getReimbursements().find(r => r.id === reimbursementId);
    if (reimbursement) {
      reimbursement.status = 'approved';
      reimbursement.approvedDate = new Date().toISOString();
      return this.updateReimbursement(reimbursement);
    }
    return null;
  }

  // ========== HOLIDAY CALENDAR METHODS ==========

  getHolidays() {
    return this.getData(this.STORAGE_KEYS.HOLIDAYS) || [];
  }

  getHolidaysByYear(year) {
    const holidays = this.getHolidays();
    return holidays.filter(h => new Date(h.date).getFullYear() === year);
  }

  addHoliday(holiday) {
    const holidays = this.getHolidays();

    if (!holiday.id) {
      holiday.id = `holiday_${Date.now()}`;
    }

    holidays.push(holiday);
    this.setData(this.STORAGE_KEYS.HOLIDAYS, holidays);
    return holiday;
  }

  updateHoliday(holiday) {
    const holidays = this.getHolidays();
    const index = holidays.findIndex(h => h.id === holiday.id);

    if (index !== -1) {
      holidays[index] = holiday;
      this.setData(this.STORAGE_KEYS.HOLIDAYS, holidays);
      return holiday;
    }
    return null;
  }

  deleteHoliday(id) {
    const holidays = this.getHolidays();
    const filtered = holidays.filter(h => h.id !== id);
    this.setData(this.STORAGE_KEYS.HOLIDAYS, filtered);
    return true;
  }

  isHoliday(date) {
    const holidays = this.getHolidays();
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
  }

  // Bonus Management
  getBonuses() {
    return this.getData(this.STORAGE_KEYS.BONUSES) || [];
  }

  addBonus(bonusData) {
    const bonuses = this.getBonuses();
    const newBonus = {
      id: this.generateId(),
      ...bonusData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedDate: null,
      paidDate: null
    };
    bonuses.push(newBonus);
    this.setData(this.STORAGE_KEYS.BONUSES, bonuses);
    return newBonus;
  }

  approveBonus(bonusId) {
    const bonuses = this.getBonuses();
    const bonus = bonuses.find(b => b.id === bonusId);
    if (bonus && bonus.status === 'pending') {
      bonus.status = 'approved';
      bonus.approvedDate = new Date().toISOString();
      this.setData(this.STORAGE_KEYS.BONUSES, bonuses);
      return true;
    }
    return false;
  }

  updateBonus(bonusData) {
    const bonuses = this.getBonuses();
    const index = bonuses.findIndex(b => b.id === bonusData.id);
    if (index !== -1) {
      bonuses[index] = bonusData;
      this.setData(this.STORAGE_KEYS.BONUSES, bonuses);
      return true;
    }
    return false;
  }

  getStaffBonuses(staffId, month, year) {
    const bonuses = this.getBonuses();
    return bonuses.filter(b =>
      b.staffId === staffId &&
      b.month === month &&
      b.year === year &&
      (b.status === 'approved' || b.status === 'paid')
    );
  }

  calculateBonusAmount(staffId, month, year) {
    const bonuses = this.getStaffBonuses(staffId, month, year);
    return bonuses.reduce((sum, b) => sum + b.amount, 0);
  }

  // Performance Incentive Management
  getIncentives() {
    return this.getData(this.STORAGE_KEYS.INCENTIVES) || [];
  }

  addIncentive(incentiveData) {
    const incentives = this.getIncentives();
    const newIncentive = {
      id: this.generateId(),
      ...incentiveData,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    incentives.push(newIncentive);
    this.setData(this.STORAGE_KEYS.INCENTIVES, incentives);
    return newIncentive;
  }

  updateIncentive(incentiveData) {
    const incentives = this.getIncentives();
    const index = incentives.findIndex(i => i.id === incentiveData.id);
    if (index !== -1) {
      incentives[index] = incentiveData;
      this.setData(this.STORAGE_KEYS.INCENTIVES, incentives);
      return true;
    }
    return false;
  }

  calculateIncentiveAmount(staffId, month, year, metrics = {}) {
    const staff = this.getStaffById(staffId);
    if (!staff) return 0;

    const incentives = this.getIncentives().filter(i =>
      (i.staffId === staffId || i.department === staff.department || i.applicableTo === 'all') &&
      i.status === 'active'
    );

    let totalIncentive = 0;

    incentives.forEach(incentive => {
      if (incentive.type === 'sales_target' && metrics.totalSales) {
        if (metrics.totalSales >= incentive.targetAmount) {
          if (incentive.calculationType === 'percentage') {
            totalIncentive += (metrics.totalSales * incentive.value) / 100;
          } else {
            totalIncentive += incentive.value;
          }
        }
      } else if (incentive.type === 'attendance' && metrics.attendancePercentage) {
        if (metrics.attendancePercentage >= incentive.targetPercentage) {
          totalIncentive += incentive.value;
        }
      } else if (incentive.type === 'performance' && metrics.performanceScore) {
        if (metrics.performanceScore >= incentive.minScore) {
          totalIncentive += incentive.value;
        }
      } else if (incentive.type === 'fixed') {
        totalIncentive += incentive.value;
      }
    });

    return Math.round(totalIncentive);
  }

  // Arrears Management
  getArrears() {
    return this.getData(this.STORAGE_KEYS.ARREARS) || [];
  }

  addArrears(arrearsData) {
    const arrears = this.getArrears();
    const newArrears = {
      id: this.generateId(),
      ...arrearsData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paidDate: null
    };
    arrears.push(newArrears);
    this.setData(this.STORAGE_KEYS.ARREARS, arrears);
    return newArrears;
  }

  updateArrears(arrearsData) {
    const arrears = this.getArrears();
    const index = arrears.findIndex(a => a.id === arrearsData.id);
    if (index !== -1) {
      arrears[index] = arrearsData;
      this.setData(this.STORAGE_KEYS.ARREARS, arrears);
      return true;
    }
    return false;
  }

  getStaffArrears(staffId, status = null) {
    const arrears = this.getArrears();
    return arrears.filter(a => {
      if (status) {
        return a.staffId === staffId && a.status === status;
      }
      return a.staffId === staffId;
    });
  }

  getPendingArrears(staffId) {
    return this.getStaffArrears(staffId, 'pending');
  }

  markArrearsPaid(arrearsId, month, year) {
    const arrears = this.getArrears();
    const arrear = arrears.find(a => a.id === arrearsId);
    if (arrear && arrear.status === 'pending') {
      arrear.status = 'paid';
      arrear.paidDate = new Date().toISOString();
      arrear.paidMonth = month;
      arrear.paidYear = year;
      this.setData(this.STORAGE_KEYS.ARREARS, arrears);
      return true;
    }
    return false;
  }

  calculateArrearsAmount(staffId, month, year) {
    const pendingArrears = this.getPendingArrears(staffId);
    return pendingArrears.reduce((sum, a) => sum + a.amount, 0);
  }

  // Shift Management
  getShifts() {
    return this.getData(this.STORAGE_KEYS.SHIFTS) || [];
  }

  addShift(shiftData) {
    const shifts = this.getShifts();
    const newShift = {
      id: this.generateId(),
      ...shiftData,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    shifts.push(newShift);
    this.setData(this.STORAGE_KEYS.SHIFTS, shifts);
    return newShift;
  }

  updateShift(shiftData) {
    const shifts = this.getShifts();
    const index = shifts.findIndex(s => s.id === shiftData.id);
    if (index !== -1) {
      shifts[index] = shiftData;
      this.setData(this.STORAGE_KEYS.SHIFTS, shifts);
      return true;
    }
    return false;
  }

  deleteShift(shiftId) {
    const shifts = this.getShifts();
    const filtered = shifts.filter(s => s.id !== shiftId);
    this.setData(this.STORAGE_KEYS.SHIFTS, filtered);
    return true;
  }

  getShiftById(shiftId) {
    const shifts = this.getShifts();
    return shifts.find(s => s.id === shiftId);
  }

  // Shift Roster Management
  getRosters() {
    return this.getData(this.STORAGE_KEYS.ROSTERS) || [];
  }

  addRoster(rosterData) {
    const rosters = this.getRosters();
    const newRoster = {
      id: this.generateId(),
      ...rosterData,
      createdAt: new Date().toISOString()
    };
    rosters.push(newRoster);
    this.setData(this.STORAGE_KEYS.ROSTERS, rosters);
    return newRoster;
  }

  getStaffRoster(staffId, month, year) {
    const rosters = this.getRosters();
    return rosters.filter(r =>
      r.staffId === staffId &&
      r.month === month &&
      r.year === year
    );
  }

  getRosterByDate(staffId, date) {
    const rosters = this.getRosters();
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return rosters.find(r => r.staffId === staffId && r.date === dateStr);
  }

  updateRoster(rosterData) {
    const rosters = this.getRosters();
    const index = rosters.findIndex(r => r.id === rosterData.id);
    if (index !== -1) {
      rosters[index] = rosterData;
      this.setData(this.STORAGE_KEYS.ROSTERS, rosters);
      return true;
    }
    return false;
  }

  deleteRoster(rosterId) {
    const rosters = this.getRosters();
    const filtered = rosters.filter(r => r.id !== rosterId);
    this.setData(this.STORAGE_KEYS.ROSTERS, filtered);
    return true;
  }

  // Leave Accrual System
  getLeaveAccruals() {
    return this.getData(this.STORAGE_KEYS.LEAVE_ACCRUALS) || [];
  }

  calculateLeaveAccrual(staffId) {
    const staff = this.getStaffById(staffId);
    if (!staff || !staff.joiningDate) return null;

    const joiningDate = new Date(staff.joiningDate);
    const today = new Date();
    const monthsWorked = Math.floor((today - joiningDate) / (1000 * 60 * 60 * 24 * 30));

    // Default accrual rates (can be customized per staff)
    const casualLeaveRate = 1; // 1 per month
    const sickLeaveRate = 0.5; // 0.5 per month
    const earnedLeaveRate = 1.5; // 1.5 per month

    return {
      staffId,
      casualLeave: monthsWorked * casualLeaveRate,
      sickLeave: monthsWorked * sickLeaveRate,
      earnedLeave: monthsWorked * earnedLeaveRate,
      monthsWorked,
      calculatedDate: new Date().toISOString()
    };
  }

  addLeaveAccrual(accrualData) {
    const accruals = this.getLeaveAccruals();
    const newAccrual = {
      id: this.generateId(),
      ...accrualData,
      createdAt: new Date().toISOString()
    };
    accruals.push(newAccrual);
    this.setData(this.STORAGE_KEYS.LEAVE_ACCRUALS, accruals);
    return newAccrual;
  }

  getStaffLeaveBalance(staffId) {
    const leaves = this.getLeaveApplications();
    const staffLeaves = leaves.filter(l => l.staffId === staffId && l.status === 'approved');

    const accrual = this.calculateLeaveAccrual(staffId);
    if (!accrual) return null;

    const used = staffLeaves.reduce((acc, leave) => {
      acc[leave.leaveType] = (acc[leave.leaveType] || 0) + leave.days;
      return acc;
    }, {});

    return {
      casualLeave: accrual.casualLeave - (used['Casual Leave'] || 0),
      sickLeave: accrual.sickLeave - (used['Sick Leave'] || 0),
      earnedLeave: accrual.earnedLeave - (used['Earned Leave'] || 0),
      calculatedDate: accrual.calculatedDate
    };
  }

  // Comp-off Management
  getCompOffs() {
    return this.getData(this.STORAGE_KEYS.COMP_OFFS) || [];
  }

  addCompOff(compOffData) {
    const compOffs = this.getCompOffs();
    const newCompOff = {
      id: this.generateId(),
      ...compOffData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiryDate: null,
      usedDate: null
    };
    compOffs.push(newCompOff);
    this.setData(this.STORAGE_KEYS.COMP_OFFS, compOffs);
    return newCompOff;
  }

  approveCompOff(compOffId, expiryDays = 90) {
    const compOffs = this.getCompOffs();
    const compOff = compOffs.find(c => c.id === compOffId);
    if (compOff && compOff.status === 'pending') {
      compOff.status = 'approved';
      compOff.approvedDate = new Date().toISOString();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expiryDays);
      compOff.expiryDate = expiry.toISOString();
      this.setData(this.STORAGE_KEYS.COMP_OFFS, compOffs);
      return true;
    }
    return false;
  }

  getStaffCompOffs(staffId, status = null) {
    const compOffs = this.getCompOffs();
    return compOffs.filter(c => {
      if (status) {
        return c.staffId === staffId && c.status === status;
      }
      return c.staffId === staffId;
    });
  }

  useCompOff(compOffId) {
    const compOffs = this.getCompOffs();
    const compOff = compOffs.find(c => c.id === compOffId);
    if (compOff && compOff.status === 'approved' && !compOff.usedDate) {
      compOff.status = 'used';
      compOff.usedDate = new Date().toISOString();
      this.setData(this.STORAGE_KEYS.COMP_OFFS, compOffs);
      return true;
    }
    return false;
  }

  // ========================================
  // BREAK TIME TRACKING
  // ========================================

  getBreakRecords() {
    return this.getData(this.STORAGE_KEYS.BREAK_RECORDS) || [];
  }

  addBreakRecord(breakData) {
    const breaks = this.getBreakRecords();
    const newBreak = {
      id: this.generateId(),
      ...breakData,
      status: 'in-progress', // 'in-progress', 'completed'
      createdAt: new Date().toISOString()
    };
    breaks.push(newBreak);
    this.setData(this.STORAGE_KEYS.BREAK_RECORDS, breaks);
    return newBreak;
  }

  updateBreakRecord(breakId, updates) {
    const breaks = this.getBreakRecords();
    const breakIndex = breaks.findIndex(b => b.id === breakId);
    if (breakIndex !== -1) {
      breaks[breakIndex] = { ...breaks[breakIndex], ...updates };
      this.setData(this.STORAGE_KEYS.BREAK_RECORDS, breaks);
      return breaks[breakIndex];
    }
    return null;
  }

  endBreak(breakId, endTime) {
    const breakRecord = this.getBreakRecords().find(b => b.id === breakId);
    if (breakRecord && breakRecord.status === 'in-progress') {
      const startTime = new Date(`2000-01-01T${breakRecord.startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const durationMinutes = Math.round((end - startTime) / (1000 * 60));

      return this.updateBreakRecord(breakId, {
        endTime,
        durationMinutes,
        status: 'completed'
      });
    }
    return null;
  }

  getStaffBreakRecords(staffId, date) {
    return this.getBreakRecords().filter(
      b => b.staffId === staffId && b.date === date
    );
  }

  getTotalBreakTime(staffId, date) {
    const breaks = this.getStaffBreakRecords(staffId, date);
    return breaks
      .filter(b => b.status === 'completed')
      .reduce((total, b) => total + (b.durationMinutes || 0), 0);
  }

  getBreaksByDateRange(startDate, endDate) {
    const breaks = this.getBreakRecords();
    return breaks.filter(b => b.date >= startDate && b.date <= endDate);
  }

  // ========================================
  // AUTO-ABSENT MARKING
  // ========================================

  getAutoAbsentSettings() {
    const defaultSettings = {
      enabled: false,
      cutoffTime: '10:30', // Mark absent if no attendance by this time
      applyToWeekends: false,
      applyToHolidays: false,
      excludedStaff: [], // Array of staff IDs to exclude
      notifyBeforeMinutes: 30 // Send notification before marking absent
    };
    return this.getData(this.STORAGE_KEYS.AUTO_ABSENT_SETTINGS) || defaultSettings;
  }

  updateAutoAbsentSettings(settings) {
    this.setData(this.STORAGE_KEYS.AUTO_ABSENT_SETTINGS, settings);
    return settings;
  }

  getAutoAbsentLog() {
    return this.getData(this.STORAGE_KEYS.AUTO_ABSENT_LOG) || [];
  }

  addAutoAbsentLogEntry(entry) {
    const log = this.getAutoAbsentLog();
    log.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    this.setData(this.STORAGE_KEYS.AUTO_ABSENT_LOG, log);
  }

  // Check and mark staff as absent based on settings
  processAutoAbsentMarking(date) {
    const settings = this.getAutoAbsentSettings();

    if (!settings.enabled) {
      return { success: false, message: 'Auto-absent marking is disabled' };
    }

    const currentTime = new Date().toTimeString().slice(0, 5);

    // Check if current time has passed cutoff time
    if (currentTime < settings.cutoffTime) {
      return { success: false, message: 'Cutoff time not reached yet' };
    }

    const staff = this.getStaff().filter(s => s.status === 'active');
    const attendance = this.getAttendance();
    const dateAttendance = attendance.filter(a => a.date === date);

    let markedAbsentCount = 0;
    const markedStaff = [];

    staff.forEach(staffMember => {
      // Skip if staff is in excluded list
      if (settings.excludedStaff.includes(staffMember.id)) {
        return;
      }

      // Check if attendance already marked for this staff on this date
      const hasAttendance = dateAttendance.some(a => a.staffId === staffMember.id);

      if (!hasAttendance) {
        // Mark as absent
        this.addAttendance({
          staffId: staffMember.id,
          staffName: staffMember.name,
          date,
          status: 'absent',
          clockIn: '',
          clockOut: '',
          overtimeHours: 0,
          lateMarks: 0,
          notes: 'Auto-marked absent (no attendance by cutoff time)',
          autoMarked: true
        });

        markedAbsentCount++;
        markedStaff.push({
          staffId: staffMember.id,
          name: staffMember.name,
          employeeId: staffMember.employeeId
        });
      }
    });

    // Log this operation
    this.addAutoAbsentLogEntry({
      date,
      cutoffTime: settings.cutoffTime,
      processedTime: currentTime,
      totalStaff: staff.length,
      markedAbsentCount,
      markedStaff
    });

    return {
      success: true,
      message: `Marked ${markedAbsentCount} staff as absent`,
      markedAbsentCount,
      markedStaff
    };
  }

  // Get staff who need to be notified before auto-absent marking
  getStaffForAutoAbsentNotification(date) {
    const settings = this.getAutoAbsentSettings();

    if (!settings.enabled) {
      return [];
    }

    const staff = this.getStaff().filter(s => s.status === 'active');
    const attendance = this.getAttendance();
    const dateAttendance = attendance.filter(a => a.date === date);

    const staffWithoutAttendance = [];

    staff.forEach(staffMember => {
      if (settings.excludedStaff.includes(staffMember.id)) {
        return;
      }

      const hasAttendance = dateAttendance.some(a => a.staffId === staffMember.id);

      if (!hasAttendance) {
        staffWithoutAttendance.push(staffMember);
      }
    });

    return staffWithoutAttendance;
  }

  // ========================================
  // LEAVE CARRY FORWARD
  // ========================================

  getLeaveCarryForwardSettings() {
    const defaultSettings = {
      casualLeave: {
        enabled: true,
        maxDays: 10, // Maximum days that can be carried forward
        expiryMonths: 3 // Expires after 3 months in new year
      },
      sickLeave: {
        enabled: false,
        maxDays: 0,
        expiryMonths: 0
      },
      earnedLeave: {
        enabled: true,
        maxDays: 30,
        expiryMonths: 12 // Full year
      },
      privilegeLeave: {
        enabled: true,
        maxDays: 15,
        expiryMonths: 6
      }
    };
    return this.getData(this.STORAGE_KEYS.LEAVE_CARRY_FORWARD_SETTINGS) || defaultSettings;
  }

  updateLeaveCarryForwardSettings(settings) {
    this.setData(this.STORAGE_KEYS.LEAVE_CARRY_FORWARD_SETTINGS, settings);
    return settings;
  }

  getLeaveCarryForwardRecords() {
    return this.getData(this.STORAGE_KEYS.LEAVE_CARRY_FORWARD) || [];
  }

  addLeaveCarryForwardRecord(record) {
    const records = this.getLeaveCarryForwardRecords();
    const newRecord = {
      id: this.generateId(),
      ...record,
      status: 'active', // active, expired, used
      createdAt: new Date().toISOString()
    };
    records.push(newRecord);
    this.setData(this.STORAGE_KEYS.LEAVE_CARRY_FORWARD, records);
    return newRecord;
  }

  getStaffCarryForwardLeaves(staffId, year) {
    const records = this.getLeaveCarryForwardRecords();
    return records.filter(r =>
      r.staffId === staffId &&
      r.forYear === year &&
      r.status === 'active'
    );
  }

  // Process year-end carry forward for all staff
  processYearEndCarryForward(fromYear, toYear) {
    const settings = this.getLeaveCarryForwardSettings();
    const staff = this.getStaff().filter(s => s.status === 'active');
    const leaves = this.getLeaveApplications();

    const processedStaff = [];
    let totalCarriedForward = 0;

    staff.forEach(staffMember => {
      // Calculate unused leaves for fromYear
      const yearLeaves = leaves.filter(l =>
        l.staffId === staffMember.id &&
        new Date(l.startDate).getFullYear() === fromYear &&
        l.status === 'approved'
      );

      const leaveBalance = this.getStaffLeaveBalance(staffMember.id);

      // Calculate carry forward for each leave type
      const carryForward = {};

      Object.keys(settings).forEach(leaveType => {
        const setting = settings[leaveType];
        if (!setting.enabled) return;

        const usedDays = yearLeaves
          .filter(l => l.leaveType === leaveType)
          .reduce((sum, l) => sum + l.days, 0);

        const totalBalance = leaveBalance[leaveType] || 0;
        const unusedDays = totalBalance - usedDays;

        if (unusedDays > 0) {
          const daysToCarryForward = Math.min(unusedDays, setting.maxDays);
          const expiryDate = new Date(toYear, setting.expiryMonths - 1, 31);

          carryForward[leaveType] = {
            days: daysToCarryForward,
            expiryDate: expiryDate.toISOString().split('T')[0]
          };

          // Create carry forward record
          this.addLeaveCarryForwardRecord({
            staffId: staffMember.id,
            leaveType,
            fromYear,
            forYear: toYear,
            days: daysToCarryForward,
            expiryDate: expiryDate.toISOString().split('T')[0]
          });

          totalCarriedForward += daysToCarryForward;
        }
      });

      if (Object.keys(carryForward).length > 0) {
        processedStaff.push({
          staffId: staffMember.id,
          name: staffMember.name,
          carryForward
        });
      }
    });

    return {
      success: true,
      fromYear,
      toYear,
      processedStaff: processedStaff.length,
      totalDaysCarriedForward: totalCarriedForward,
      details: processedStaff
    };
  }

  // Use carried forward leave
  useCarryForwardLeave(staffId, leaveType, daysUsed) {
    const records = this.getStaffCarryForwardLeaves(staffId, new Date().getFullYear());
    const record = records.find(r => r.leaveType === leaveType && r.status === 'active');

    if (!record) {
      return { success: false, message: 'No carry forward leave found' };
    }

    if (record.days < daysUsed) {
      return { success: false, message: 'Insufficient carry forward leave balance' };
    }

    // Check if expired
    if (new Date() > new Date(record.expiryDate)) {
      // Mark as expired
      const allRecords = this.getLeaveCarryForwardRecords();
      const updated = allRecords.map(r =>
        r.id === record.id ? { ...r, status: 'expired' } : r
      );
      this.setData(this.STORAGE_KEYS.LEAVE_CARRY_FORWARD, updated);
      return { success: false, message: 'Carry forward leave has expired' };
    }

    // Deduct used days
    const allRecords = this.getLeaveCarryForwardRecords();
    const updated = allRecords.map(r => {
      if (r.id === record.id) {
        const remainingDays = r.days - daysUsed;
        return {
          ...r,
          days: remainingDays,
          status: remainingDays <= 0 ? 'used' : 'active'
        };
      }
      return r;
    });
    this.setData(this.STORAGE_KEYS.LEAVE_CARRY_FORWARD, updated);

    return { success: true, remainingDays: record.days - daysUsed };
  }

  // Expire old carry forward leaves
  expireOldCarryForwardLeaves() {
    const today = new Date();
    const records = this.getLeaveCarryForwardRecords();

    const updated = records.map(record => {
      if (record.status === 'active' && new Date(record.expiryDate) < today) {
        return { ...record, status: 'expired' };
      }
      return record;
    });

    this.setData(this.STORAGE_KEYS.LEAVE_CARRY_FORWARD, updated);

    const expiredCount = updated.filter(r => r.status === 'expired').length -
                         records.filter(r => r.status === 'expired').length;

    return { success: true, expiredCount };
  }

  // ========================================
  // LEAVE ENCASHMENT
  // ========================================

  getLeaveEncashmentSettings() {
    const defaultSettings = {
      casualLeave: {
        enabled: true,
        ratePerDay: 1, // As per daily salary
        minDaysRequired: 5, // Minimum days to encash
        maxDaysPerYear: 15 // Maximum days that can be encashed per year
      },
      earnedLeave: {
        enabled: true,
        ratePerDay: 1,
        minDaysRequired: 10,
        maxDaysPerYear: 30
      },
      privilegeLeave: {
        enabled: false,
        ratePerDay: 1,
        minDaysRequired: 5,
        maxDaysPerYear: 10
      }
    };
    return this.getData(this.STORAGE_KEYS.LEAVE_ENCASHMENT_SETTINGS) || defaultSettings;
  }

  updateLeaveEncashmentSettings(settings) {
    this.setData(this.STORAGE_KEYS.LEAVE_ENCASHMENT_SETTINGS, settings);
    return settings;
  }

  getLeaveEncashmentRecords() {
    return this.getData(this.STORAGE_KEYS.LEAVE_ENCASHMENT) || [];
  }

  addLeaveEncashmentRequest(requestData) {
    const requests = this.getLeaveEncashmentRecords();
    const newRequest = {
      id: this.generateId(),
      ...requestData,
      status: 'pending', // pending, approved, rejected, processed
      createdAt: new Date().toISOString()
    };
    requests.push(newRequest);
    this.setData(this.STORAGE_KEYS.LEAVE_ENCASHMENT, requests);
    return newRequest;
  }

  updateLeaveEncashmentRequest(requestId, updates) {
    const requests = this.getLeaveEncashmentRecords();
    const updated = requests.map(r =>
      r.id === requestId ? { ...r, ...updates } : r
    );
    this.setData(this.STORAGE_KEYS.LEAVE_ENCASHMENT, updated);
    return updated.find(r => r.id === requestId);
  }

  // Calculate encashment amount
  calculateEncashmentAmount(staffId, leaveType, days) {
    const settings = this.getLeaveEncashmentSettings();
    const staff = this.getStaffById(staffId);

    if (!staff || !settings[leaveType]?.enabled) {
      return null;
    }

    const setting = settings[leaveType];

    // Validate days
    if (days < setting.minDaysRequired) {
      return {
        success: false,
        message: `Minimum ${setting.minDaysRequired} days required for encashment`
      };
    }

    if (days > setting.maxDaysPerYear) {
      return {
        success: false,
        message: `Maximum ${setting.maxDaysPerYear} days can be encashed per year`
      };
    }

    // Calculate daily rate based on basic salary (nested under staff.salary.basic)
    const basicSalary = staff.salary?.basic || staff.basicSalary || 0;
    const dailyRate = basicSalary / 30;
    const amount = dailyRate * days * setting.ratePerDay;

    return {
      success: true,
      dailyRate,
      days,
      amount: Math.round(amount),
      rateMultiplier: setting.ratePerDay
    };
  }

  // Approve encashment request
  approveEncashmentRequest(requestId, approvedBy) {
    const request = this.getLeaveEncashmentRecords().find(r => r.id === requestId);

    if (!request || request.status !== 'pending') {
      return { success: false, message: 'Invalid request or already processed' };
    }

    // Recalculate amount
    const calculation = this.calculateEncashmentAmount(
      request.staffId,
      request.leaveType,
      request.days
    );

    if (!calculation.success) {
      return calculation;
    }

    this.updateLeaveEncashmentRequest(requestId, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
      approvedAmount: calculation.amount
    });

    return { success: true, amount: calculation.amount };
  }

  // Process encashment (mark as paid)
  processEncashmentRequest(requestId, processedBy) {
    const request = this.getLeaveEncashmentRecords().find(r => r.id === requestId);

    if (!request || request.status !== 'approved') {
      return { success: false, message: 'Request must be approved first' };
    }

    this.updateLeaveEncashmentRequest(requestId, {
      status: 'processed',
      processedBy,
      processedAt: new Date().toISOString()
    });

    // Deduct leaves from balance by creating a system leave application
    // This records the encashed days as "used" so getStaffLeaveBalance reflects them
    this.addLeaveApplication({
      staffId: request.staffId,
      staffName: this.getStaffById(request.staffId)?.name || '',
      leaveType: request.leaveType,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      days: request.days,
      leaveDays: request.days,
      reason: `Leave encashment (${request.days} days)`,
      status: 'approved',
      approvedBy: 'system',
      approvedDate: new Date().toISOString(),
      isEncashment: true
    });

    this.logAudit('process', 'leave_encashment', requestId, { staffId: request.staffId, days: request.days });

    return { success: true };
  }

  // Get staff encashment history
  getStaffEncashmentHistory(staffId, year = null) {
    const records = this.getLeaveEncashmentRecords();
    let filtered = records.filter(r => r.staffId === staffId);

    if (year) {
      filtered = filtered.filter(r =>
        new Date(r.createdAt).getFullYear() === year
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get total encashed in current year
  getTotalEncashedThisYear(staffId, leaveType) {
    const currentYear = new Date().getFullYear();
    const records = this.getStaffEncashmentHistory(staffId, currentYear);

    return records
      .filter(r =>
        r.leaveType === leaveType &&
        (r.status === 'approved' || r.status === 'processed')
      )
      .reduce((sum, r) => sum + r.days, 0);
  }

  // ==================== RESTRICTED HOLIDAYS ====================

  // Get restricted holidays settings
  getRestrictedHolidaysSettings() {
    const defaultSettings = {
      enabled: true,
      maxDaysPerStaff: 2, // Max RH days each staff can avail per year
      advanceNoticeDays: 3, // Minimum days notice required
      requireApproval: true,
      allowCarryForward: false
    };
    return this.getData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS_SETTINGS) || defaultSettings;
  }

  updateRestrictedHolidaysSettings(settings) {
    this.setData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS_SETTINGS, settings);
    return settings;
  }

  // Get all restricted holidays
  getRestrictedHolidays() {
    return this.getData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS) || [];
  }

  // Get restricted holidays by year
  getRestrictedHolidaysByYear(year) {
    const rh = this.getRestrictedHolidays();
    return rh.filter(h => new Date(h.date).getFullYear() === year);
  }

  // Add restricted holiday
  addRestrictedHoliday(holiday) {
    const holidays = this.getRestrictedHolidays();

    if (!holiday.id) {
      holiday.id = `rh_${Date.now()}`;
    }

    holiday.createdAt = new Date().toISOString();
    holidays.push(holiday);
    this.setData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS, holidays);
    return holiday;
  }

  // Update restricted holiday
  updateRestrictedHoliday(holiday) {
    const holidays = this.getRestrictedHolidays();
    const index = holidays.findIndex(h => h.id === holiday.id);

    if (index !== -1) {
      holidays[index] = { ...holidays[index], ...holiday, updatedAt: new Date().toISOString() };
      this.setData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS, holidays);
      return holidays[index];
    }
    return null;
  }

  // Delete restricted holiday
  deleteRestrictedHoliday(id) {
    const holidays = this.getRestrictedHolidays();
    const filtered = holidays.filter(h => h.id !== id);
    this.setData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS, filtered);
    return true;
  }

  // Check if date is restricted holiday
  isRestrictedHoliday(date) {
    const holidays = this.getRestrictedHolidays();
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
  }

  // Get all RH requests
  getRestrictedHolidayRequests() {
    return this.getData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS_REQUESTS) || [];
  }

  // Get RH requests by status
  getRestrictedHolidayRequestsByStatus(status) {
    const requests = this.getRestrictedHolidayRequests();
    return requests.filter(r => r.status === status);
  }

  // Get RH requests by staff
  getStaffRestrictedHolidayRequests(staffId, year = null) {
    const requests = this.getRestrictedHolidayRequests();
    let filtered = requests.filter(r => r.staffId === staffId);

    if (year) {
      filtered = filtered.filter(r => new Date(r.date).getFullYear() === year);
    }

    return filtered;
  }

  // Add RH request
  addRestrictedHolidayRequest(requestData) {
    const requests = this.getRestrictedHolidayRequests();
    const settings = this.getRestrictedHolidaysSettings();

    // Validate if RH exists
    if (!this.isRestrictedHoliday(requestData.date)) {
      return {
        success: false,
        message: 'Selected date is not a restricted holiday'
      };
    }

    // Check if staff has already availed max RH days this year
    const year = new Date(requestData.date).getFullYear();
    const staffRequests = this.getStaffRestrictedHolidayRequests(requestData.staffId, year);
    const approvedDays = staffRequests.filter(r => r.status === 'approved').length;

    if (approvedDays >= settings.maxDaysPerStaff) {
      return {
        success: false,
        message: `Maximum ${settings.maxDaysPerStaff} restricted holidays allowed per year`
      };
    }

    // Check advance notice
    const requestDate = new Date(requestData.date);
    const today = new Date();
    const daysNotice = Math.floor((requestDate - today) / (1000 * 60 * 60 * 24));

    if (daysNotice < settings.advanceNoticeDays) {
      return {
        success: false,
        message: `Minimum ${settings.advanceNoticeDays} days advance notice required`
      };
    }

    // Check if already requested for same date
    const existing = requests.find(r =>
      r.staffId === requestData.staffId &&
      r.date === requestData.date &&
      r.status !== 'rejected'
    );

    if (existing) {
      return {
        success: false,
        message: 'Request already exists for this date'
      };
    }

    const newRequest = {
      id: `rh_req_${Date.now()}`,
      ...requestData,
      status: settings.requireApproval ? 'pending' : 'approved',
      createdAt: new Date().toISOString(),
      approvedBy: settings.requireApproval ? null : 'auto'
    };

    requests.push(newRequest);
    this.setData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS_REQUESTS, requests);

    return {
      success: true,
      request: newRequest
    };
  }

  // Approve RH request
  approveRestrictedHolidayRequest(requestId, approverEmail) {
    const requests = this.getRestrictedHolidayRequests();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return { success: false, message: 'Request not found' };
    }

    const request = requests[index];

    if (request.status !== 'pending') {
      return { success: false, message: 'Request is not pending' };
    }

    // Double-check max limit
    const year = new Date(request.date).getFullYear();
    const settings = this.getRestrictedHolidaysSettings();
    const staffRequests = this.getStaffRestrictedHolidayRequests(request.staffId, year);
    const approvedDays = staffRequests.filter(r => r.status === 'approved' && r.id !== requestId).length;

    if (approvedDays >= settings.maxDaysPerStaff) {
      return {
        success: false,
        message: `Staff has already availed maximum ${settings.maxDaysPerStaff} restricted holidays`
      };
    }

    requests[index] = {
      ...request,
      status: 'approved',
      approvedBy: approverEmail,
      approvedAt: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS_REQUESTS, requests);

    return {
      success: true,
      request: requests[index]
    };
  }

  // Reject RH request
  rejectRestrictedHolidayRequest(requestId, rejectorEmail, reason) {
    const requests = this.getRestrictedHolidayRequests();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return { success: false, message: 'Request not found' };
    }

    const request = requests[index];

    if (request.status !== 'pending') {
      return { success: false, message: 'Request is not pending' };
    }

    requests[index] = {
      ...request,
      status: 'rejected',
      rejectedBy: rejectorEmail,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    };

    this.setData(this.STORAGE_KEYS.RESTRICTED_HOLIDAYS_REQUESTS, requests);

    return {
      success: true,
      request: requests[index]
    };
  }

  // Get RH balance for staff (current year)
  getStaffRestrictedHolidayBalance(staffId) {
    const settings = this.getRestrictedHolidaysSettings();
    const year = new Date().getFullYear();
    const requests = this.getStaffRestrictedHolidayRequests(staffId, year);

    const approved = requests.filter(r => r.status === 'approved').length;
    const pending = requests.filter(r => r.status === 'pending').length;

    return {
      total: settings.maxDaysPerStaff,
      used: approved,
      pending: pending,
      available: settings.maxDaysPerStaff - approved - pending
    };
  }

  // Get RH statistics
  getRestrictedHolidayStatistics(year = new Date().getFullYear()) {
    const requests = this.getRestrictedHolidayRequests().filter(r =>
      new Date(r.date).getFullYear() === year
    );

    const holidays = this.getRestrictedHolidaysByYear(year);

    return {
      totalRestrictedHolidays: holidays.length,
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      rejectedRequests: requests.filter(r => r.status === 'rejected').length,
      mostRequestedDate: this.getMostRequestedRHDate(requests)
    };
  }

  getMostRequestedRHDate(requests) {
    if (requests.length === 0) return null;

    const dateCounts = requests.reduce((acc, r) => {
      acc[r.date] = (acc[r.date] || 0) + 1;
      return acc;
    }, {});

    const maxDate = Object.keys(dateCounts).reduce((a, b) =>
      dateCounts[a] > dateCounts[b] ? a : b
    );

    return { date: maxDate, count: dateCounts[maxDate] };
  }

  // ==================== PAYROLL TEMPLATES ====================

  // Get all salary templates
  getSalaryTemplates() {
    return this.getData(this.STORAGE_KEYS.SALARY_TEMPLATES) || [];
  }

  // Get template by ID
  getSalaryTemplateById(id) {
    const templates = this.getSalaryTemplates();
    return templates.find(t => t.id === id);
  }

  // Add new template
  addSalaryTemplate(templateData) {
    const templates = this.getSalaryTemplates();

    // Check for duplicate name
    const existing = templates.find(t => t.name.toLowerCase() === templateData.name.toLowerCase());
    if (existing) {
      return {
        success: false,
        message: 'Template with this name already exists'
      };
    }

    const newTemplate = {
      id: `template_${Date.now()}`,
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appliedToStaff: [] // Track which staff are using this template
    };

    templates.push(newTemplate);
    this.setData(this.STORAGE_KEYS.SALARY_TEMPLATES, templates);

    return {
      success: true,
      template: newTemplate
    };
  }

  // Update template
  updateSalaryTemplate(templateData) {
    const templates = this.getSalaryTemplates();
    const index = templates.findIndex(t => t.id === templateData.id);

    if (index === -1) {
      return { success: false, message: 'Template not found' };
    }

    // Check for duplicate name (excluding current template)
    const existing = templates.find(
      t => t.id !== templateData.id && t.name.toLowerCase() === templateData.name.toLowerCase()
    );
    if (existing) {
      return { success: false, message: 'Template with this name already exists' };
    }

    templates[index] = {
      ...templates[index],
      ...templateData,
      updatedAt: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.SALARY_TEMPLATES, templates);

    return {
      success: true,
      template: templates[index]
    };
  }

  // Delete template
  deleteSalaryTemplate(id) {
    const templates = this.getSalaryTemplates();
    const template = templates.find(t => t.id === id);

    if (!template) {
      return { success: false, message: 'Template not found' };
    }

    // Check if template is in use
    if (template.appliedToStaff && template.appliedToStaff.length > 0) {
      return {
        success: false,
        message: `Cannot delete template in use by ${template.appliedToStaff.length} staff members`
      };
    }

    const filtered = templates.filter(t => t.id !== id);
    this.setData(this.STORAGE_KEYS.SALARY_TEMPLATES, filtered);

    return { success: true };
  }

  // Apply template to staff
  applyTemplateToStaff(templateId, staffId) {
    const template = this.getSalaryTemplateById(templateId);
    const staff = this.getStaffById(staffId);

    if (!template || !staff) {
      return { success: false, message: 'Template or staff not found' };
    }

    // Update staff with template values
    const updatedStaff = {
      ...staff,
      basicSalary: template.basicSalary || staff.basicSalary,
      hra: template.hra || 0,
      conveyanceAllowance: template.conveyanceAllowance || 0,
      medicalAllowance: template.medicalAllowance || 0,
      specialAllowance: template.specialAllowance || 0,
      otherAllowances: template.otherAllowances || 0,
      pfEnabled: template.pfEnabled !== undefined ? template.pfEnabled : staff.pfEnabled,
      esiEnabled: template.esiEnabled !== undefined ? template.esiEnabled : staff.esiEnabled,
      ptEnabled: template.ptEnabled !== undefined ? template.ptEnabled : staff.ptEnabled,
      tdsEnabled: template.tdsEnabled !== undefined ? template.tdsEnabled : staff.tdsEnabled,
      salaryTemplate: templateId,
      updatedAt: new Date().toISOString()
    };

    this.updateStaff(updatedStaff);

    // Track template usage
    const templates = this.getSalaryTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);
    if (templateIndex !== -1) {
      if (!templates[templateIndex].appliedToStaff) {
        templates[templateIndex].appliedToStaff = [];
      }
      if (!templates[templateIndex].appliedToStaff.includes(staffId)) {
        templates[templateIndex].appliedToStaff.push(staffId);
      }
      this.setData(this.STORAGE_KEYS.SALARY_TEMPLATES, templates);
    }

    return {
      success: true,
      staff: updatedStaff
    };
  }

  // Remove template from staff
  removeTemplateFromStaff(staffId) {
    const staff = this.getStaffById(staffId);
    if (!staff || !staff.salaryTemplate) {
      return { success: false, message: 'Staff not found or no template applied' };
    }

    const templateId = staff.salaryTemplate;

    // Update staff
    const updatedStaff = {
      ...staff,
      salaryTemplate: null,
      updatedAt: new Date().toISOString()
    };
    this.updateStaff(updatedStaff);

    // Update template tracking
    const templates = this.getSalaryTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);
    if (templateIndex !== -1 && templates[templateIndex].appliedToStaff) {
      templates[templateIndex].appliedToStaff = templates[templateIndex].appliedToStaff.filter(
        id => id !== staffId
      );
      this.setData(this.STORAGE_KEYS.SALARY_TEMPLATES, templates);
    }

    return { success: true };
  }

  // Get staff using template
  getStaffUsingTemplate(templateId) {
    const allStaff = this.getStaff();
    return allStaff.filter(s => s.salaryTemplate === templateId);
  }

  // Clone template
  cloneSalaryTemplate(templateId, newName) {
    const template = this.getSalaryTemplateById(templateId);
    if (!template) {
      return { success: false, message: 'Template not found' };
    }

    const clonedTemplate = {
      ...template,
      id: undefined,
      name: newName || `${template.name} (Copy)`,
      appliedToStaff: []
    };

    return this.addSalaryTemplate(clonedTemplate);
  }

  // Calculate salary from template
  calculateSalaryFromTemplate(templateId, customValues = {}) {
    const template = this.getSalaryTemplateById(templateId);
    if (!template) {
      return null;
    }

    const basicSalary = customValues.basicSalary || template.basicSalary || 0;
    const hra = customValues.hra !== undefined ? customValues.hra : (template.hra || 0);
    const conveyance = customValues.conveyanceAllowance !== undefined
      ? customValues.conveyanceAllowance
      : (template.conveyanceAllowance || 0);
    const medical = customValues.medicalAllowance !== undefined
      ? customValues.medicalAllowance
      : (template.medicalAllowance || 0);
    const special = customValues.specialAllowance !== undefined
      ? customValues.specialAllowance
      : (template.specialAllowance || 0);
    const other = customValues.otherAllowances !== undefined
      ? customValues.otherAllowances
      : (template.otherAllowances || 0);

    const grossSalary = basicSalary + hra + conveyance + medical + special + other;

    // Calculate deductions
    let pf = 0;
    let esi = 0;
    let pt = 0;
    let tds = 0;

    if (template.pfEnabled) {
      pf = Math.round(basicSalary * 0.12); // 12% of basic
    }

    if (template.esiEnabled && grossSalary <= 21000) {
      esi = Math.round(grossSalary * 0.0075); // 0.75% of gross
    }

    if (template.ptEnabled) {
      // Professional Tax slabs (Maharashtra) - consistent with config.js
      if (grossSalary >= 10000) {
        pt = 200;
      } else if (grossSalary >= 7500) {
        pt = 175;
      }
    }

    if (template.tdsEnabled) {
      // Progressive TDS calculation using new tax regime slabs
      const annualGross = grossSalary * 12;
      const standardDeduction = 50000;
      const taxableIncome = annualGross - standardDeduction;
      let annualTax = 0;

      if (taxableIncome > 1500000) {
        annualTax = 15000 + 30000 + 45000 + 60000 + (taxableIncome - 1500000) * 0.30;
      } else if (taxableIncome > 1200000) {
        annualTax = 15000 + 30000 + 45000 + (taxableIncome - 1200000) * 0.20;
      } else if (taxableIncome > 900000) {
        annualTax = 15000 + 30000 + (taxableIncome - 900000) * 0.15;
      } else if (taxableIncome > 600000) {
        annualTax = 15000 + (taxableIncome - 600000) * 0.10;
      } else if (taxableIncome > 300000) {
        annualTax = (taxableIncome - 300000) * 0.05;
      }

      // Add 4% cess
      annualTax = annualTax + (annualTax * 0.04);
      tds = Math.round(annualTax / 12);
    }

    const totalDeductions = pf + esi + pt + tds;
    const netSalary = grossSalary - totalDeductions;

    return {
      basicSalary,
      hra,
      conveyanceAllowance: conveyance,
      medicalAllowance: medical,
      specialAllowance: special,
      otherAllowances: other,
      grossSalary,
      pf,
      esi,
      pt,
      tds,
      totalDeductions,
      netSalary
    };
  }

  // ==================== MULTI-CURRENCY SUPPORT ====================

  // Get currency settings
  getCurrencySettings() {
    const defaultSettings = {
      baseCurrency: 'INR',
      enableMultiCurrency: false,
      supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
      autoUpdateRates: false,
      lastRateUpdate: null
    };
    return this.getData(this.STORAGE_KEYS.CURRENCY_SETTINGS) || defaultSettings;
  }

  updateCurrencySettings(settings) {
    this.setData(this.STORAGE_KEYS.CURRENCY_SETTINGS, settings);
    return settings;
  }

  // Get exchange rates
  getExchangeRates() {
    const defaultRates = {
      INR: { rate: 1, symbol: '₹', name: 'Indian Rupee' },
      USD: { rate: 0.012, symbol: '$', name: 'US Dollar' },
      EUR: { rate: 0.011, symbol: '€', name: 'Euro' },
      GBP: { rate: 0.009, symbol: '£', name: 'British Pound' },
      AED: { rate: 0.044, symbol: 'د.إ', name: 'UAE Dirham' },
      SGD: { rate: 0.016, symbol: 'S$', name: 'Singapore Dollar' }
    };
    return this.getData(this.STORAGE_KEYS.EXCHANGE_RATES) || defaultRates;
  }

  updateExchangeRate(currency, rate) {
    const rates = this.getExchangeRates();

    if (!rates[currency]) {
      return { success: false, message: 'Currency not found' };
    }

    rates[currency] = {
      ...rates[currency],
      rate: parseFloat(rate),
      lastUpdated: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.EXCHANGE_RATES, rates);

    return { success: true, rates };
  }

  // Bulk update exchange rates
  bulkUpdateExchangeRates(ratesObj) {
    const currentRates = this.getExchangeRates();

    Object.keys(ratesObj).forEach(currency => {
      if (currentRates[currency]) {
        currentRates[currency] = {
          ...currentRates[currency],
          rate: parseFloat(ratesObj[currency]),
          lastUpdated: new Date().toISOString()
        };
      }
    });

    this.setData(this.STORAGE_KEYS.EXCHANGE_RATES, currentRates);

    // Update settings last update time
    const settings = this.getCurrencySettings();
    settings.lastRateUpdate = new Date().toISOString();
    this.updateCurrencySettings(settings);

    return { success: true, rates: currentRates };
  }

  // Convert amount between currencies
  convertCurrency(amount, fromCurrency, toCurrency) {
    const rates = this.getExchangeRates();

    if (!rates[fromCurrency] || !rates[toCurrency]) {
      return null;
    }

    // Convert to base currency (INR) first, then to target currency
    const inBase = amount / rates[fromCurrency].rate;
    const converted = inBase * rates[toCurrency].rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: converted,
      convertedCurrency: toCurrency,
      exchangeRate: rates[toCurrency].rate / rates[fromCurrency].rate,
      timestamp: new Date().toISOString()
    };
  }

  // Format amount with currency symbol
  formatCurrency(amount, currency = 'INR') {
    const rates = this.getExchangeRates();
    const currencyData = rates[currency] || rates['INR'];

    return `${currencyData.symbol}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Get staff salary in different currency
  getStaffSalaryInCurrency(staffId, currency) {
    const staff = this.getStaffById(staffId);
    if (!staff) {
      return null;
    }

    const settings = this.getCurrencySettings();
    const baseCurrency = staff.currency || settings.baseCurrency;

    if (baseCurrency === currency) {
      return {
        basicSalary: staff.basicSalary,
        currency: currency,
        converted: false
      };
    }

    const converted = this.convertCurrency(staff.basicSalary, baseCurrency, currency);

    return {
      basicSalary: converted.convertedAmount,
      currency: currency,
      converted: true,
      originalAmount: converted.originalAmount,
      originalCurrency: converted.originalCurrency,
      exchangeRate: converted.exchangeRate
    };
  }

  // Add currency to staff
  setStaffCurrency(staffId, currency) {
    const staff = this.getStaffById(staffId);
    if (!staff) {
      return { success: false, message: 'Staff not found' };
    }

    const rates = this.getExchangeRates();
    if (!rates[currency]) {
      return { success: false, message: 'Invalid currency' };
    }

    const updatedStaff = {
      ...staff,
      currency: currency,
      updatedAt: new Date().toISOString()
    };

    this.updateStaff(updatedStaff);

    return { success: true, staff: updatedStaff };
  }

  // Get payroll summary in multiple currencies
  getPayrollSummaryMultiCurrency() {
    const staff = this.getStaff();
    const settings = this.getCurrencySettings();
    const rates = this.getExchangeRates();

    const summary = {};

    // Initialize summary for all supported currencies
    settings.supportedCurrencies.forEach(curr => {
      summary[curr] = {
        currency: curr,
        symbol: rates[curr]?.symbol || curr,
        totalStaff: 0,
        totalSalary: 0,
        staffList: []
      };
    });

    // Calculate for each staff
    staff.forEach(s => {
      const staffCurrency = s.currency || settings.baseCurrency;
      const salary = s.basicSalary || 0;

      if (summary[staffCurrency]) {
        summary[staffCurrency].totalStaff++;
        summary[staffCurrency].totalSalary += salary;
        summary[staffCurrency].staffList.push({
          id: s.id,
          name: s.name,
          salary: salary
        });
      }

      // Also add converted values to base currency
      if (staffCurrency !== settings.baseCurrency) {
        const converted = this.convertCurrency(salary, staffCurrency, settings.baseCurrency);
        if (converted) {
          summary[settings.baseCurrency].totalSalary += converted.convertedAmount;
        }
      }
    });

    return summary;
  }

  // ==================== ATTENDANCE REGULARIZATION ====================

  // Get regularization settings
  getAttendanceRegularizationSettings() {
    const defaultSettings = {
      enabled: true,
      requireApproval: true,
      maxDaysInPast: 7, // Can regularize attendance for last N days
      allowReasons: ['Forgot to mark', 'System error', 'Network issue', 'On field duty', 'Other'],
      requireProof: false, // Require document/proof attachment
      autoApproveWithinDays: 0, // 0 = always require approval
      notifyManager: true
    };
    return this.getData(this.STORAGE_KEYS.ATTENDANCE_REGULARIZATION_SETTINGS) || defaultSettings;
  }

  updateAttendanceRegularizationSettings(settings) {
    this.setData(this.STORAGE_KEYS.ATTENDANCE_REGULARIZATION_SETTINGS, settings);
    return settings;
  }

  // Get all regularization requests
  getAttendanceRegularizationRequests() {
    return this.getData(this.STORAGE_KEYS.ATTENDANCE_REGULARIZATION) || [];
  }

  // Get requests by status
  getRegularizationRequestsByStatus(status) {
    const requests = this.getAttendanceRegularizationRequests();
    return requests.filter(r => r.status === status);
  }

  // Get staff regularization requests
  getStaffRegularizationRequests(staffId, month = null, year = null) {
    const requests = this.getAttendanceRegularizationRequests();
    let filtered = requests.filter(r => r.staffId === staffId);

    if (month !== null && year !== null) {
      filtered = filtered.filter(r => {
        const date = new Date(r.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });
    }

    return filtered;
  }

  // Submit regularization request
  submitRegularizationRequest(requestData) {
    const { staffId, date, reason, checkIn, checkOut, remarks } = requestData;
    const settings = this.getAttendanceRegularizationSettings();

    if (!settings.enabled) {
      return { success: false, message: 'Attendance regularization is disabled' };
    }

    // Check if date is within allowed past days
    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - requestDate) / (1000 * 60 * 60 * 24));

    if (daysDiff > settings.maxDaysInPast) {
      return {
        success: false,
        message: `Can only regularize attendance for last ${settings.maxDaysInPast} days`
      };
    }

    if (daysDiff < 0) {
      return { success: false, message: 'Cannot regularize future dates' };
    }

    // Check if already regularized or requested
    const requests = this.getAttendanceRegularizationRequests();
    const existing = requests.find(r =>
      r.staffId === staffId &&
      r.date === date &&
      (r.status === 'pending' || r.status === 'approved')
    );

    if (existing) {
      return {
        success: false,
        message: 'Regularization request already exists for this date'
      };
    }

    const newRequest = {
      id: `reg_${Date.now()}`,
      staffId,
      date,
      reason,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      remarks: remarks || '',
      status: settings.requireApproval ? 'pending' : 'approved',
      createdAt: new Date().toISOString(),
      approvedBy: settings.requireApproval ? null : 'auto',
      approvedAt: settings.requireApproval ? null : new Date().toISOString()
    };

    requests.push(newRequest);
    this.setData(this.STORAGE_KEYS.ATTENDANCE_REGULARIZATION, requests);

    // If auto-approved, update attendance
    if (!settings.requireApproval) {
      this.applyRegularization(newRequest.id);
    }

    return {
      success: true,
      request: newRequest
    };
  }

  // Approve regularization request
  approveRegularizationRequest(requestId, approverEmail) {
    const requests = this.getAttendanceRegularizationRequests();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return { success: false, message: 'Request not found' };
    }

    const request = requests[index];

    if (request.status !== 'pending') {
      return { success: false, message: 'Request is not pending' };
    }

    requests[index] = {
      ...request,
      status: 'approved',
      approvedBy: approverEmail,
      approvedAt: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.ATTENDANCE_REGULARIZATION, requests);

    // Apply the regularization to attendance
    this.applyRegularization(requestId);

    return {
      success: true,
      request: requests[index]
    };
  }

  // Reject regularization request
  rejectRegularizationRequest(requestId, rejectorEmail, rejectionReason) {
    const requests = this.getAttendanceRegularizationRequests();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return { success: false, message: 'Request not found' };
    }

    const request = requests[index];

    if (request.status !== 'pending') {
      return { success: false, message: 'Request is not pending' };
    }

    requests[index] = {
      ...request,
      status: 'rejected',
      rejectedBy: rejectorEmail,
      rejectedAt: new Date().toISOString(),
      rejectionReason: rejectionReason
    };

    this.setData(this.STORAGE_KEYS.ATTENDANCE_REGULARIZATION, requests);

    return {
      success: true,
      request: requests[index]
    };
  }

  // Apply regularization to attendance record
  applyRegularization(requestId) {
    const requests = this.getAttendanceRegularizationRequests();
    const request = requests.find(r => r.id === requestId);

    if (!request || request.status !== 'approved') {
      return { success: false, message: 'Request not found or not approved' };
    }

    const attendance = this.getAttendance();
    const dateStr = request.date;

    // Find or create attendance record for the date
    let attendanceIndex = attendance.findIndex(a =>
      a.staffId === request.staffId && a.date === dateStr
    );

    if (attendanceIndex === -1) {
      // Create new attendance record
      const newAttendance = {
        id: `att_${Date.now()}`,
        staffId: request.staffId,
        date: dateStr,
        checkIn: request.checkIn || '09:00',
        checkOut: request.checkOut || '18:00',
        status: 'present',
        regularized: true,
        regularizationId: requestId,
        createdAt: new Date().toISOString()
      };
      attendance.push(newAttendance);
    } else {
      // Update existing record
      attendance[attendanceIndex] = {
        ...attendance[attendanceIndex],
        checkIn: request.checkIn || attendance[attendanceIndex].checkIn,
        checkOut: request.checkOut || attendance[attendanceIndex].checkOut,
        status: 'present',
        regularized: true,
        regularizationId: requestId,
        updatedAt: new Date().toISOString()
      };
    }

    this.setData(this.STORAGE_KEYS.ATTENDANCE, attendance);

    return { success: true };
  }

  // Get regularization statistics
  getRegularizationStatistics(month = new Date().getMonth(), year = new Date().getFullYear()) {
    const requests = this.getAttendanceRegularizationRequests().filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      byReason: this.groupByReason(requests),
      topStaff: this.getTopRegularizationStaff(requests)
    };
  }

  groupByReason(requests) {
    const grouped = {};

    requests.forEach(r => {
      if (!grouped[r.reason]) {
        grouped[r.reason] = 0;
      }
      grouped[r.reason]++;
    });

    return grouped;
  }

  getTopRegularizationStaff(requests) {
    const staffCounts = {};

    requests.forEach(r => {
      if (!staffCounts[r.staffId]) {
        staffCounts[r.staffId] = 0;
      }
      staffCounts[r.staffId]++;
    });

    const sorted = Object.entries(staffCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted.map(([staffId, count]) => {
      const staff = this.getStaffById(staffId);
      return {
        staffId,
        name: staff?.name || 'Unknown',
        count
      };
    });
  }

  // ==================== TAX & COMPLIANCE ====================

  // Get tax declarations
  getTaxDeclarations() {
    return this.getData(this.STORAGE_KEYS.TAX_DECLARATIONS) || [];
  }

  // Get staff tax declarations for financial year
  getStaffTaxDeclaration(staffId, financialYear) {
    const declarations = this.getTaxDeclarations();
    return declarations.find(d => d.staffId === staffId && d.financialYear === financialYear);
  }

  // Submit/Update tax declaration
  submitTaxDeclaration(declarationData) {
    const { staffId, financialYear, section80C, section80D, hra, homeLoanInterest, otherDeductions } = declarationData;
    const declarations = this.getTaxDeclarations();

    const existingIndex = declarations.findIndex(
      d => d.staffId === staffId && d.financialYear === financialYear
    );

    const declaration = {
      staffId,
      financialYear,
      section80C: section80C || 0,
      section80D: section80D || 0,
      hra: hra || 0,
      homeLoanInterest: homeLoanInterest || 0,
      otherDeductions: otherDeductions || 0,
      totalDeductions: (section80C || 0) + (section80D || 0) + (hra || 0) + (homeLoanInterest || 0) + (otherDeductions || 0),
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };

    if (existingIndex !== -1) {
      declarations[existingIndex] = { ...declarations[existingIndex], ...declaration };
    } else {
      declaration.id = `taxdecl_${Date.now()}`;
      declarations.push(declaration);
    }

    this.setData(this.STORAGE_KEYS.TAX_DECLARATIONS, declarations);

    return {
      success: true,
      declaration: existingIndex !== -1 ? declarations[existingIndex] : declaration
    };
  }

  // Calculate tax (New Regime vs Old Regime)
  calculateIncomeTax(staffId, financialYear, regime = 'new') {
    const staff = this.getStaffById(staffId);
    if (!staff) return null;

    // Get annual gross salary
    const salaries = this.getSalaryRecordsByStaff(staffId);
    const fyStart = financialYear.split('-')[0];
    const fyEnd = financialYear.split('-')[1];

    const fySalaries = salaries.filter(s => {
      const salaryDate = new Date(s.salaryDate);
      const year = salaryDate.getFullYear();
      const month = salaryDate.getMonth();

      return (
        (year === parseInt(fyStart) && month >= 3) ||
        (year === parseInt(fyEnd) && month < 3)
      );
    });

    const grossAnnual = fySalaries.reduce((sum, s) => sum + (s.grossSalary || 0), 0);
    const totalDeductions = fySalaries.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);

    // Get tax declarations
    const declaration = this.getStaffTaxDeclaration(staffId, financialYear);

    let taxableIncome = grossAnnual;
    let tax = 0;
    let deductions = {};

    if (regime === 'old') {
      // Old Tax Regime with deductions
      const standardDeduction = 50000;
      const section80C = Math.min(declaration?.section80C || 0, 150000);
      const section80D = Math.min(declaration?.section80D || 0, 25000);
      const hra = declaration?.hra || 0;
      const homeLoan = Math.min(declaration?.homeLoanInterest || 0, 200000);

      deductions = {
        standardDeduction,
        section80C,
        section80D,
        hra,
        homeLoanInterest: homeLoan,
        total: standardDeduction + section80C + section80D + hra + homeLoan
      };

      taxableIncome = grossAnnual - deductions.total;

      // Old regime tax slabs (FY 2024-25)
      if (taxableIncome <= 250000) {
        tax = 0;
      } else if (taxableIncome <= 500000) {
        tax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 12500 + 100000 + (taxableIncome - 1000000) * 0.30;
      }
    } else {
      // New Tax Regime (no deductions except standard)
      const standardDeduction = 50000;

      deductions = {
        standardDeduction,
        total: standardDeduction
      };

      taxableIncome = grossAnnual - standardDeduction;

      // New regime tax slabs (FY 2024-25)
      if (taxableIncome <= 300000) {
        tax = 0;
      } else if (taxableIncome <= 600000) {
        tax = (taxableIncome - 300000) * 0.05;
      } else if (taxableIncome <= 900000) {
        tax = 15000 + (taxableIncome - 600000) * 0.10;
      } else if (taxableIncome <= 1200000) {
        tax = 15000 + 30000 + (taxableIncome - 900000) * 0.15;
      } else if (taxableIncome <= 1500000) {
        tax = 15000 + 30000 + 45000 + (taxableIncome - 1200000) * 0.20;
      } else {
        tax = 15000 + 30000 + 45000 + 60000 + (taxableIncome - 1500000) * 0.30;
      }
    }

    // Add cess (4%)
    const cess = tax * 0.04;
    const totalTax = Math.round(tax + cess);

    return {
      staffId,
      financialYear,
      regime,
      grossAnnual,
      deductions,
      taxableIncome,
      taxBeforeCess: Math.round(tax),
      cess: Math.round(cess),
      totalTax,
      monthlyTDS: Math.round(totalTax / 12),
      effectiveTaxRate: ((totalTax / grossAnnual) * 100).toFixed(2) + '%'
    };
  }

  // Save tax computation
  saveTaxComputation(computation) {
    const computations = this.getData(this.STORAGE_KEYS.TAX_COMPUTATION) || [];

    const existingIndex = computations.findIndex(
      c => c.staffId === computation.staffId && c.financialYear === computation.financialYear && c.regime === computation.regime
    );

    computation.computedAt = new Date().toISOString();

    if (existingIndex !== -1) {
      computations[existingIndex] = computation;
    } else {
      computations.push(computation);
    }

    this.setData(this.STORAGE_KEYS.TAX_COMPUTATION, computations);

    return { success: true, computation };
  }

  // Generate Form 16 data
  generateForm16(staffId, financialYear) {
    const staff = this.getStaffById(staffId);
    if (!staff) {
      return { success: false, message: 'Staff not found' };
    }

    // Get tax computation (prefer new regime unless old regime was explicitly chosen)
    let computation = this.calculateIncomeTax(staffId, financialYear, 'new');

    const declaration = this.getStaffTaxDeclaration(staffId, financialYear);

    // Check if old regime is better
    const oldRegimeComp = this.calculateIncomeTax(staffId, financialYear, 'old');

    if (oldRegimeComp && oldRegimeComp.totalTax < computation.totalTax) {
      computation = oldRegimeComp;
    }

    const form16Data = {
      id: `form16_${Date.now()}`,
      staffId,
      staffName: staff.name,
      pan: staff.pan || 'Not Provided',
      financialYear,
      assessmentYear: `${parseInt(financialYear.split('-')[1])}-${parseInt(financialYear.split('-')[1]) + 1}`,
      employerName: this.getCompanySettings()?.companyName || 'Company Name',
      employerTAN: this.getCompanySettings()?.tan || 'Not Provided',
      employerPAN: this.getCompanySettings()?.pan || 'Not Provided',
      grossSalary: computation.grossAnnual,
      deductions: computation.deductions,
      taxableIncome: computation.taxableIncome,
      taxPayable: computation.totalTax,
      tdsDeducted: computation.totalTax, // Assuming full TDS deducted
      taxRegime: computation.regime,
      generatedAt: new Date().toISOString(),
      declaration: declaration || null
    };

    // Save to storage
    const form16Records = this.getData(this.STORAGE_KEYS.FORM16_DATA) || [];
    const existingIndex = form16Records.findIndex(
      f => f.staffId === staffId && f.financialYear === financialYear
    );

    if (existingIndex !== -1) {
      form16Records[existingIndex] = form16Data;
    } else {
      form16Records.push(form16Data);
    }

    this.setData(this.STORAGE_KEYS.FORM16_DATA, form16Records);

    return {
      success: true,
      form16: form16Data
    };
  }

  // Get Form 16 for staff
  getForm16(staffId, financialYear) {
    const form16Records = this.getData(this.STORAGE_KEYS.FORM16_DATA) || [];
    return form16Records.find(f => f.staffId === staffId && f.financialYear === financialYear);
  }

  // Get all Form 16 records
  getAllForm16(financialYear = null) {
    const form16Records = this.getData(this.STORAGE_KEYS.FORM16_DATA) || [];

    if (financialYear) {
      return form16Records.filter(f => f.financialYear === financialYear);
    }

    return form16Records;
  }

  // ==================== STATUTORY REPORTS ====================

  // Generate PF ECR (Electronic Challan-cum-Return)
  generatePFECR(month, year) {
    const staff = this.getStaff().filter(s => s.pfEnabled);
    const salaries = this.getSalaryRecords();

    const monthSalaries = salaries.filter(s => {
      const date = new Date(s.salaryDate);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const ecrData = staff.map(s => {
      const salary = monthSalaries.find(sal => sal.staffId === s.id);

      if (!salary) return null;

      const wages = salary.basicSalary || 0;
      const pfWages = Math.min(wages, 15000); // PF ceiling
      const epfContribution = Math.round(pfWages * 0.12);
      const epsContribution = Math.round(pfWages * 0.0833);
      const edliContribution = Math.round(pfWages * 0.005);

      return {
        uanNumber: s.uan || '',
        memberName: s.name,
        grossWages: wages,
        epfWages: pfWages,
        epsWages: pfWages,
        edliWages: pfWages,
        epfContribution: epfContribution,
        epsContribution: epsContribution,
        edliContribution: edliContribution,
        epfEEContribution: epfContribution,
        epfERContribution: epfContribution - epsContribution,
        ncp: 0 // Non-contributing days
      };
    }).filter(Boolean);

    const totalEPF = ecrData.reduce((sum, e) => sum + e.epfContribution + e.epfEEContribution, 0);
    const totalEPS = ecrData.reduce((sum, e) => sum + e.epsContribution, 0);
    const totalEDLI = ecrData.reduce((sum, e) => sum + e.edliContribution, 0);

    return {
      month,
      year,
      staffCount: ecrData.length,
      records: ecrData,
      totalEPF,
      totalEPS,
      totalEDLI,
      grandTotal: totalEPF + totalEPS + totalEDLI,
      generatedAt: new Date().toISOString()
    };
  }

  // Generate ESI Challan
  generateESIChallan(month, year) {
    const staff = this.getStaff().filter(s => s.esiEnabled);
    const salaries = this.getSalaryRecords();

    const monthSalaries = salaries.filter(s => {
      const date = new Date(s.salaryDate);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const esiData = staff.map(s => {
      const salary = monthSalaries.find(sal => sal.staffId === s.id);

      if (!salary) return null;

      const grossWages = salary.grossSalary || 0;

      // ESI applicable only if wages <= 21000
      if (grossWages > 21000) return null;

      const employeeContribution = Math.round(grossWages * 0.0075); // 0.75%
      const employerContribution = Math.round(grossWages * 0.0325); // 3.25%

      return {
        ipNumber: s.esiNumber || '',
        name: s.name,
        days: 30,
        grossWages,
        employeeContribution,
        employerContribution,
        totalContribution: employeeContribution + employerContribution
      };
    }).filter(Boolean);

    const totalEmployeeESI = esiData.reduce((sum, e) => sum + e.employeeContribution, 0);
    const totalEmployerESI = esiData.reduce((sum, e) => sum + e.employerContribution, 0);

    return {
      month,
      year,
      staffCount: esiData.length,
      records: esiData,
      totalEmployeeESI,
      totalEmployerESI,
      grandTotal: totalEmployeeESI + totalEmployerESI,
      generatedAt: new Date().toISOString()
    };
  }

  // Generate PT Challan (Professional Tax)
  generatePTChallan(month, year, state = 'Maharashtra') {
    const staff = this.getStaff().filter(s => s.ptEnabled);
    const salaries = this.getSalaryRecords();

    const monthSalaries = salaries.filter(s => {
      const date = new Date(s.salaryDate);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const ptData = staff.map(s => {
      const salary = monthSalaries.find(sal => sal.staffId === s.id);

      if (!salary) return null;

      const grossSalary = salary.grossSalary || 0;

      // Maharashtra PT Slabs
      let pt = 0;
      if (state === 'Maharashtra') {
        if (grossSalary <= 10000) {
          pt = 0;
        } else if (grossSalary <= 15000) {
          pt = 175;
        } else {
          pt = month === 1 ? 300 : 200; // Feb has 300, others 200
        }
      }

      return {
        name: s.name,
        grossSalary,
        pt
      };
    }).filter(Boolean);

    const totalPT = ptData.reduce((sum, p) => sum + p.pt, 0);

    return {
      month,
      year,
      state,
      staffCount: ptData.length,
      records: ptData,
      totalPT,
      generatedAt: new Date().toISOString()
    };
  }

  // Save statutory report
  saveStatutoryReport(report) {
    const reports = this.getData(this.STORAGE_KEYS.STATUTORY_REPORTS) || [];

    report.id = `stat_${Date.now()}`;
    reports.push(report);

    this.setData(this.STORAGE_KEYS.STATUTORY_REPORTS, reports);

    return { success: true, report };
  }

  // Get statutory reports
  getStatutoryReports(type = null) {
    const reports = this.getData(this.STORAGE_KEYS.STATUTORY_REPORTS) || [];

    if (type) {
      return reports.filter(r => r.type === type);
    }

    return reports;
  }

  // ==================== PAYROLL AUTOMATION ====================

  // Auto-Salary Processing Settings
  getAutoSalarySettings() {
    return this.getData(this.STORAGE_KEYS.AUTO_SALARY_SETTINGS) || {
      enabled: false,
      dayOfMonth: 1,
      autoApprove: false,
      notifyStaff: true,
      excludeHold: true
    };
  }

  updateAutoSalarySettings(settings) {
    this.setData(this.STORAGE_KEYS.AUTO_SALARY_SETTINGS, settings);
    return settings;
  }

  // Process auto-salary (to be called by scheduler)
  processAutoSalary() {
    const settings = this.getAutoSalarySettings();
    if (!settings.enabled) return { success: false, message: 'Auto-salary disabled' };

    const today = new Date();
    const staff = this.getStaff().filter(s => s.status === 'active');
    const month = today.getMonth();
    const year = today.getFullYear();

    let processed = 0;
    let errors = 0;

    staff.forEach(s => {
      try {
        const salary = this.calculateSalary(s.id, month, year);
        if (salary) {
          this.addSalaryRecord({
            staffId: s.id,
            month,
            year,
            ...salary,
            autoProcessed: true,
            processedAt: new Date().toISOString()
          });
          processed++;
        }
      } catch (err) {
        errors++;
      }
    });

    const log = { date: new Date().toISOString(), processed, errors };
    const logs = this.getData(this.STORAGE_KEYS.AUTO_SALARY_LOG) || [];
    logs.push(log);
    this.setData(this.STORAGE_KEYS.AUTO_SALARY_LOG, logs);

    return { success: true, processed, errors };
  }

  // Salary Advances
  getSalaryAdvances() {
    return this.getData(this.STORAGE_KEYS.SALARY_ADVANCES) || [];
  }

  addSalaryAdvance(advance) {
    const advances = this.getSalaryAdvances();
    advance.id = `adv_${Date.now()}`;
    advance.status = 'pending';
    advance.createdAt = new Date().toISOString();
    advances.push(advance);
    this.setData(this.STORAGE_KEYS.SALARY_ADVANCES, advances);
    return { success: true, advance };
  }

  approveSalaryAdvance(advanceId) {
    const advances = this.getSalaryAdvances();
    const idx = advances.findIndex(a => a.id === advanceId);
    if (idx !== -1) {
      advances[idx].status = 'approved';
      advances[idx].approvedAt = new Date().toISOString();
      this.setData(this.STORAGE_KEYS.SALARY_ADVANCES, advances);
      return { success: true };
    }
    return { success: false };
  }

  // Loan EMI Management
  getLoanEMIs() {
    return this.getData(this.STORAGE_KEYS.LOAN_EMI) || [];
  }

  addLoanEMI(emi) {
    const emis = this.getLoanEMIs();
    emi.id = `emi_${Date.now()}`;
    emi.createdAt = new Date().toISOString();
    emis.push(emi);
    this.setData(this.STORAGE_KEYS.LOAN_EMI, emis);
    return { success: true, emi };
  }

  deductEMIFromSalary(staffId, month, year) {
    const emis = this.getLoanEMIs().filter(e => e.staffId === staffId && e.status === 'active');
    return emis.reduce((sum, e) => sum + (e.monthlyEMI || 0), 0);
  }

  // Arrears Calculation
  getArrears() {
    return this.getData(this.STORAGE_KEYS.ARREARS) || [];
  }

  calculateArrears(staffId, oldSalary, newSalary, effectiveDate, currentDate) {
    const months = this.getMonthsBetween(new Date(effectiveDate), new Date(currentDate));
    const arrears = (newSalary - oldSalary) * months;

    const arrearRecord = {
      id: `arr_${Date.now()}`,
      staffId,
      oldSalary,
      newSalary,
      effectiveDate,
      months,
      arrears,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const allArrears = this.getArrears();
    allArrears.push(arrearRecord);
    this.setData(this.STORAGE_KEYS.ARREARS, allArrears);

    return { success: true, arrears: arrearRecord };
  }

  getMonthsBetween(start, end) {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }

  // Bonus Rules Engine
  getBonusRules() {
    return this.getData(this.STORAGE_KEYS.BONUS_RULES) || [];
  }

  addBonusRule(rule) {
    const rules = this.getBonusRules();
    rule.id = `rule_${Date.now()}`;
    rule.createdAt = new Date().toISOString();
    rules.push(rule);
    this.setData(this.STORAGE_KEYS.BONUS_RULES, rules);
    return { success: true, rule };
  }

  calculateBonusByRule(staffId, ruleId) {
    const rule = this.getBonusRules().find(r => r.id === ruleId);
    if (!rule) return 0;

    const staff = this.getStaffById(staffId);
    if (!staff) return 0;

    if (rule.type === 'percentage') {
      return (staff.basicSalary || 0) * (rule.value / 100);
    } else if (rule.type === 'fixed') {
      return rule.value;
    }

    return 0;
  }

  // ==================== AUDIT TRAIL ====================

  logAuditTrail(action, entity, entityId, changes, user) {
    const trail = this.getData(this.STORAGE_KEYS.AUDIT_TRAIL) || [];
    trail.push({
      id: `audit_${Date.now()}`,
      action,
      entity,
      entityId,
      changes,
      user,
      timestamp: new Date().toISOString()
    });
    this.setData(this.STORAGE_KEYS.AUDIT_TRAIL, trail);
  }

  getAuditTrail(filters = {}) {
    let trail = this.getData(this.STORAGE_KEYS.AUDIT_TRAIL) || [];

    if (filters.entity) trail = trail.filter(t => t.entity === filters.entity);
    if (filters.entityId) trail = trail.filter(t => t.entityId === filters.entityId);
    if (filters.user) trail = trail.filter(t => t.user === filters.user);

    return trail.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // ==================== COMPLIANCE CALENDAR ====================

  getComplianceCalendar() {
    return this.getData(this.STORAGE_KEYS.COMPLIANCE_CALENDAR) || [];
  }

  addComplianceEvent(event) {
    const calendar = this.getComplianceCalendar();
    event.id = `comp_${Date.now()}`;
    event.createdAt = new Date().toISOString();
    calendar.push(event);
    this.setData(this.STORAGE_KEYS.COMPLIANCE_CALENDAR, calendar);
    return { success: true, event };
  }

  getUpcomingCompliance(days = 7) {
    const calendar = this.getComplianceCalendar();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return calendar.filter(c => {
      const dueDate = new Date(c.dueDate);
      return dueDate >= today && dueDate <= futureDate && c.status !== 'completed';
    });
  }

  // ==================== ADVANCED ANALYTICS ====================

  // Department-wise cost analysis
  getDepartmentWiseCostAnalysis() {
    const staff = this.getStaff();
    const salaries = this.getSalaryRecords();

    const deptCosts = {};

    staff.forEach(s => {
      const dept = s.department || 'Unassigned';
      if (!deptCosts[dept]) {
        deptCosts[dept] = { count: 0, totalCost: 0, avgSalary: 0 };
      }
      deptCosts[dept].count++;
      deptCosts[dept].totalCost += (s.basicSalary || 0) * 12; // Annual
    });

    Object.keys(deptCosts).forEach(dept => {
      deptCosts[dept].avgSalary = deptCosts[dept].totalCost / deptCosts[dept].count;
    });

    return deptCosts;
  }

  // Salary trend analysis
  getSalaryTrendAnalysis(months = 12) {
    const salaries = this.getSalaryRecords();
    const today = new Date();
    const trends = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthSalaries = salaries.filter(s => {
        const salDate = new Date(s.salaryDate);
        return salDate.getMonth() === month && salDate.getFullYear() === year;
      });

      const total = monthSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);

      trends.push({
        month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        total,
        count: monthSalaries.length
      });
    }

    return trends;
  }

  // Attrition analysis
  getAttritionAnalysis(year = new Date().getFullYear()) {
    const allStaff = this.getStaff();
    const leftStaff = allStaff.filter(s => s.status === 'inactive');

    const leftThisYear = leftStaff.filter(s => {
      if (!s.exitDate) return false;
      return new Date(s.exitDate).getFullYear() === year;
    });

    const avgStrength = allStaff.length + (leftThisYear.length / 2);
    const attritionRate = ((leftThisYear.length / avgStrength) * 100).toFixed(2);

    return {
      totalStaff: allStaff.length,
      leftThisYear: leftThisYear.length,
      attritionRate: `${attritionRate}%`,
      reasonBreakdown: this.groupByExitReason(leftThisYear)
    };
  }

  groupByExitReason(staff) {
    const reasons = {};
    staff.forEach(s => {
      const reason = s.exitReason || 'Not specified';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    return reasons;
  }

  // Headcount reports
  getHeadcountTrend(months = 12) {
    const staff = this.getStaff();
    const trends = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const count = staff.filter(s => {
        const joinDate = new Date(s.joiningDate);
        return joinDate <= date && (!s.exitDate || new Date(s.exitDate) >= date);
      }).length;

      trends.push({
        month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        count
      });
    }

    return trends;
  }

  // Tenure analysis
  getTenureAnalysis() {
    const staff = this.getStaff().filter(s => s.status === 'active');
    const tenureBuckets = {
      '0-1 years': 0,
      '1-3 years': 0,
      '3-5 years': 0,
      '5-10 years': 0,
      '10+ years': 0
    };

    staff.forEach(s => {
      const tenure = this.calculateTenure(s.joiningDate);
      if (tenure < 1) tenureBuckets['0-1 years']++;
      else if (tenure < 3) tenureBuckets['1-3 years']++;
      else if (tenure < 5) tenureBuckets['3-5 years']++;
      else if (tenure < 10) tenureBuckets['5-10 years']++;
      else tenureBuckets['10+ years']++;
    });

    return tenureBuckets;
  }

  calculateTenure(joiningDate) {
    const join = new Date(joiningDate);
    const now = new Date();
    return (now - join) / (1000 * 60 * 60 * 24 * 365);
  }

  // Age demographics
  getAgeDemographics() {
    const staff = this.getStaff().filter(s => s.status === 'active');
    const ageBuckets = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '55+': 0
    };

    staff.forEach(s => {
      if (!s.dateOfBirth) return;
      const age = this.calculateAge(s.dateOfBirth);
      if (age <= 25) ageBuckets['18-25']++;
      else if (age <= 35) ageBuckets['26-35']++;
      else if (age <= 45) ageBuckets['36-45']++;
      else if (age <= 55) ageBuckets['46-55']++;
      else ageBuckets['55+']++;
    });

    return ageBuckets;
  }

  calculateAge(dob) {
    const birth = new Date(dob);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  }

  // CTC Calculator
  calculateCTC(staffId) {
    const staff = this.getStaffById(staffId);
    if (!staff) return null;

    const monthlyCTC = (staff.basicSalary || 0) + (staff.hra || 0) + (staff.conveyanceAllowance || 0) +
                       (staff.medicalAllowance || 0) + (staff.specialAllowance || 0) + (staff.otherAllowances || 0);

    const annualCTC = monthlyCTC * 12;
    const employerPF = staff.pfEnabled ? Math.round((staff.basicSalary || 0) * 0.12) * 12 : 0;
    const employerESI = staff.esiEnabled ? Math.round(monthlyCTC * 0.0325) * 12 : 0;

    return {
      monthlyCTC,
      annualCTC,
      employerContributions: employerPF + employerESI,
      totalCTC: annualCTC + employerPF + employerESI
    };
  }

  // ==================== REPORT BUILDER ====================

  // Get all custom reports
  getCustomReports() {
    return this.getData(this.STORAGE_KEYS.CUSTOM_REPORTS) || [];
  }

  // Get report by ID
  getCustomReportById(reportId) {
    const reports = this.getCustomReports();
    return reports.find(r => r.id === reportId);
  }

  // Add custom report
  addCustomReport(reportData) {
    const reports = this.getCustomReports();

    const newReport = {
      id: `report_${Date.now()}`,
      ...reportData,
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      runCount: 0
    };

    reports.push(newReport);
    this.setData(this.STORAGE_KEYS.CUSTOM_REPORTS, reports);

    return { success: true, report: newReport };
  }

  // Update custom report
  updateCustomReport(updatedReport) {
    const reports = this.getCustomReports();
    const index = reports.findIndex(r => r.id === updatedReport.id);

    if (index === -1) {
      return { success: false, message: 'Report not found' };
    }

    reports[index] = { ...reports[index], ...updatedReport, updatedAt: new Date().toISOString() };
    this.setData(this.STORAGE_KEYS.CUSTOM_REPORTS, reports);

    return { success: true, report: reports[index] };
  }

  // Delete custom report
  deleteCustomReport(reportId) {
    const reports = this.getCustomReports();
    const filtered = reports.filter(r => r.id !== reportId);

    this.setData(this.STORAGE_KEYS.CUSTOM_REPORTS, filtered);

    return { success: true };
  }

  // Run custom report
  runCustomReport(reportId) {
    const report = this.getCustomReportById(reportId);
    if (!report) {
      return { success: false, message: 'Report not found' };
    }

    let data = [];
    let columns = [];

    // Generate data based on report type
    switch (report.reportType) {
      case 'salary':
        data = this.generateSalaryReportData(report);
        columns = ['Staff Name', 'Employee ID', 'Department', 'Designation', 'Basic Salary', 'HRA', 'Allowances', 'Gross Salary', 'Deductions', 'Net Salary'];
        break;

      case 'attendance':
        data = this.generateAttendanceReportData(report);
        columns = ['Staff Name', 'Employee ID', 'Department', 'Total Days', 'Present Days', 'Absent Days', 'Leave Days', 'Half Days', 'Attendance %'];
        break;

      case 'leave':
        data = this.generateLeaveReportData(report);
        columns = ['Staff Name', 'Employee ID', 'Leave Type', 'Total Leaves', 'Used Leaves', 'Balance', 'Pending Requests'];
        break;

      case 'tax':
        data = this.generateTaxReportData(report);
        columns = ['Staff Name', 'Employee ID', 'Annual Gross', 'Taxable Income', 'Tax Regime', 'Total Tax', 'Monthly TDS'];
        break;

      case 'department':
        data = this.generateDepartmentReportData(report);
        columns = ['Department', 'Total Employees', 'Annual Cost', 'Avg Salary', '% of Total Cost'];
        break;

      case 'statutory':
        data = this.generateStatutoryReportData(report);
        columns = ['Staff Name', 'Employee ID', 'UAN', 'PF Wages', 'EPF', 'EPS', 'ESI Wages', 'ESI', 'PT'];
        break;

      default:
        return { success: false, message: 'Invalid report type' };
    }

    // Apply filters
    if (report.filters) {
      data = this.applyReportFilters(data, report.filters);
    }

    // Update run statistics
    const reports = this.getCustomReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      reports[index].lastRunAt = new Date().toISOString();
      reports[index].runCount = (reports[index].runCount || 0) + 1;
      this.setData(this.STORAGE_KEYS.CUSTOM_REPORTS, reports);
    }

    return {
      success: true,
      reportName: report.name,
      reportType: report.reportType,
      columns,
      data,
      generatedAt: new Date().toISOString(),
      totalRecords: data.length
    };
  }

  // Generate salary report data
  generateSalaryReportData(report) {
    const staff = this.getStaff();
    const salaries = this.getSalaryRecords();

    const { month, year, departmentFilter, designationFilter } = report.filters || {};

    return staff
      .filter(s => {
        if (departmentFilter && s.department !== departmentFilter) return false;
        if (designationFilter && s.designation !== designationFilter) return false;
        return true;
      })
      .map(s => {
        const salary = salaries.find(sal => sal.staffId === s.id && (!month || sal.month === month) && (!year || sal.year === year));

        const basicSalary = s.basicSalary || 0;
        const hra = s.hra || 0;
        const allowances = (s.conveyanceAllowance || 0) + (s.medicalAllowance || 0) + (s.specialAllowance || 0) + (s.otherAllowances || 0);
        const grossSalary = salary?.grossSalary || (basicSalary + hra + allowances);
        const deductions = salary?.totalDeductions || 0;
        const netSalary = salary?.netSalary || (grossSalary - deductions);

        return {
          'Staff Name': s.name,
          'Employee ID': s.employeeId,
          'Department': s.department || 'N/A',
          'Designation': s.designation || 'N/A',
          'Basic Salary': basicSalary,
          'HRA': hra,
          'Allowances': allowances,
          'Gross Salary': grossSalary,
          'Deductions': deductions,
          'Net Salary': netSalary
        };
      });
  }

  // Generate attendance report data
  generateAttendanceReportData(report) {
    const staff = this.getStaff();
    const attendance = this.getAttendanceRecords();

    const { month, year, departmentFilter } = report.filters || {};

    return staff
      .filter(s => !departmentFilter || s.department === departmentFilter)
      .map(s => {
        const staffAttendance = attendance.filter(a => {
          if (a.staffId !== s.id) return false;
          const date = new Date(a.date);
          if (month !== undefined && date.getMonth() !== month) return false;
          if (year && date.getFullYear() !== year) return false;
          return true;
        });

        const totalDays = staffAttendance.length;
        const presentDays = staffAttendance.filter(a => a.status === 'present' || a.status === 'half-day').length;
        const absentDays = staffAttendance.filter(a => a.status === 'absent').length;
        const leaveDays = staffAttendance.filter(a => a.status === 'leave').length;
        const halfDays = staffAttendance.filter(a => a.status === 'half-day').length;
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0';

        return {
          'Staff Name': s.name,
          'Employee ID': s.employeeId,
          'Department': s.department || 'N/A',
          'Total Days': totalDays,
          'Present Days': presentDays,
          'Absent Days': absentDays,
          'Leave Days': leaveDays,
          'Half Days': halfDays,
          'Attendance %': attendancePercentage + '%'
        };
      });
  }

  // Generate leave report data
  generateLeaveReportData(report) {
    const staff = this.getStaff();
    const { departmentFilter, leaveTypeFilter } = report.filters || {};

    const result = [];

    staff
      .filter(s => !departmentFilter || s.department === departmentFilter)
      .forEach(s => {
        const balance = this.getStaffLeaveBalance(s.id);
        const applications = this.getLeaveApplications().filter(l => l.staffId === s.id);

        const leaveTypes = leaveTypeFilter ? [leaveTypeFilter] : ['casualLeave', 'sickLeave', 'earnedLeave'];

        leaveTypes.forEach(type => {
          const typeApplications = applications.filter(a => a.leaveType === type);
          const used = typeApplications.filter(a => a.status === 'approved').reduce((sum, a) => sum + (a.days || 0), 0);
          const pending = typeApplications.filter(a => a.status === 'pending').length;

          result.push({
            'Staff Name': s.name,
            'Employee ID': s.employeeId,
            'Leave Type': type,
            'Total Leaves': this.getLeaveSettings()[type] || 0,
            'Used Leaves': used,
            'Balance': balance[type] || 0,
            'Pending Requests': pending
          });
        });
      });

    return result;
  }

  // Generate tax report data
  generateTaxReportData(report) {
    const staff = this.getStaff();
    const { financialYear, regimeFilter } = report.filters || {};
    const fy = financialYear || '2024-2025';

    return staff.map(s => {
      const taxCalc = this.calculateIncomeTax(s.id, fy, regimeFilter || 'new');

      return {
        'Staff Name': s.name,
        'Employee ID': s.employeeId,
        'Annual Gross': taxCalc?.grossAnnual || 0,
        'Taxable Income': taxCalc?.taxableIncome || 0,
        'Tax Regime': taxCalc?.regime || 'N/A',
        'Total Tax': taxCalc?.totalTax || 0,
        'Monthly TDS': taxCalc?.monthlyTDS || 0
      };
    });
  }

  // Generate department report data
  generateDepartmentReportData(report) {
    const deptCosts = this.getDepartmentWiseCostAnalysis();
    const totalCost = Object.values(deptCosts).reduce((sum, d) => sum + d.totalCost, 0);

    return Object.entries(deptCosts).map(([dept, data]) => {
      const percentOfTotal = ((data.totalCost / totalCost) * 100).toFixed(1);

      return {
        'Department': dept,
        'Total Employees': data.count,
        'Annual Cost': data.totalCost,
        'Avg Salary': Math.round(data.avgSalary),
        '% of Total Cost': percentOfTotal + '%'
      };
    });
  }

  // Generate statutory report data
  generateStatutoryReportData(report) {
    const staff = this.getStaff();
    const salaries = this.getSalaryRecords();
    const { month, year } = report.filters || {};

    return staff.map(s => {
      const salary = salaries.find(sal => sal.staffId === s.id && (!month || sal.month === month) && (!year || sal.year === year));

      const basicSalary = s.basicSalary || 0;
      const pfWages = Math.min(basicSalary, 15000);
      const epf = s.pfEnabled ? Math.round(pfWages * 0.12) : 0;
      const eps = s.pfEnabled ? Math.round(pfWages * 0.0833) : 0;

      const grossSalary = salary?.grossSalary || 0;
      const esiWages = grossSalary <= 21000 ? grossSalary : 0;
      const esi = s.esiEnabled ? Math.round(esiWages * 0.0075) : 0;

      const pt = salary?.professionalTax || 0;

      return {
        'Staff Name': s.name,
        'Employee ID': s.employeeId,
        'UAN': s.uan || 'N/A',
        'PF Wages': pfWages,
        'EPF': epf,
        'EPS': eps,
        'ESI Wages': esiWages,
        'ESI': esi,
        'PT': pt
      };
    });
  }

  // Apply filters to report data
  applyReportFilters(data, filters) {
    // Filters are already applied in individual report generators
    return data;
  }

  // ==================== SCHEDULED REPORTS ====================

  // Get all scheduled reports
  getScheduledReports() {
    return this.getData(this.STORAGE_KEYS.SCHEDULED_REPORTS) || [];
  }

  // Get scheduled report by ID
  getScheduledReportById(scheduleId) {
    const schedules = this.getScheduledReports();
    return schedules.find(s => s.id === scheduleId);
  }

  // Add scheduled report
  addScheduledReport(scheduleData) {
    const schedules = this.getScheduledReports();

    const newSchedule = {
      id: `schedule_${Date.now()}`,
      ...scheduleData,
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      nextRunAt: this.calculateNextRunDate(scheduleData.frequency, scheduleData.dayOfWeek, scheduleData.dayOfMonth),
      runCount: 0,
      status: 'active'
    };

    schedules.push(newSchedule);
    this.setData(this.STORAGE_KEYS.SCHEDULED_REPORTS, schedules);

    return { success: true, schedule: newSchedule };
  }

  // Update scheduled report
  updateScheduledReport(updatedSchedule) {
    const schedules = this.getScheduledReports();
    const index = schedules.findIndex(s => s.id === updatedSchedule.id);

    if (index === -1) {
      return { success: false, message: 'Schedule not found' };
    }

    schedules[index] = {
      ...schedules[index],
      ...updatedSchedule,
      updatedAt: new Date().toISOString(),
      nextRunAt: this.calculateNextRunDate(updatedSchedule.frequency, updatedSchedule.dayOfWeek, updatedSchedule.dayOfMonth)
    };
    this.setData(this.STORAGE_KEYS.SCHEDULED_REPORTS, schedules);

    return { success: true, schedule: schedules[index] };
  }

  // Delete scheduled report
  deleteScheduledReport(scheduleId) {
    const schedules = this.getScheduledReports();
    const filtered = schedules.filter(s => s.id !== scheduleId);

    this.setData(this.STORAGE_KEYS.SCHEDULED_REPORTS, filtered);

    return { success: true };
  }

  // Toggle scheduled report status
  toggleScheduledReport(scheduleId) {
    const schedules = this.getScheduledReports();
    const index = schedules.findIndex(s => s.id === scheduleId);

    if (index === -1) {
      return { success: false, message: 'Schedule not found' };
    }

    schedules[index].status = schedules[index].status === 'active' ? 'paused' : 'active';
    schedules[index].updatedAt = new Date().toISOString();

    this.setData(this.STORAGE_KEYS.SCHEDULED_REPORTS, schedules);

    return { success: true, schedule: schedules[index] };
  }

  // Calculate next run date
  calculateNextRunDate(frequency, dayOfWeek = 1, dayOfMonth = 1) {
    const now = new Date();
    let nextRun = new Date(now);

    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;

      case 'weekly':
        const currentDay = nextRun.getDay();
        const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;
        nextRun.setDate(nextRun.getDate() + daysUntilNext);
        break;

      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(Math.min(dayOfMonth, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()));
        break;

      case 'quarterly':
        nextRun.setMonth(nextRun.getMonth() + 3);
        break;

      case 'yearly':
        nextRun.setFullYear(nextRun.getFullYear() + 1);
        break;

      default:
        nextRun.setDate(nextRun.getDate() + 1);
    }

    nextRun.setHours(9, 0, 0, 0); // Default to 9 AM
    return nextRun.toISOString();
  }

  // Run scheduled report
  runScheduledReport(scheduleId) {
    const schedule = this.getScheduledReportById(scheduleId);
    if (!schedule) {
      return { success: false, message: 'Schedule not found' };
    }

    // Run the associated custom report
    const reportResult = this.runCustomReport(schedule.reportId);

    if (!reportResult.success) {
      return reportResult;
    }

    // Update schedule statistics
    const schedules = this.getScheduledReports();
    const index = schedules.findIndex(s => s.id === scheduleId);

    if (index !== -1) {
      schedules[index].lastRunAt = new Date().toISOString();
      schedules[index].runCount = (schedules[index].runCount || 0) + 1;
      schedules[index].nextRunAt = this.calculateNextRunDate(schedule.frequency, schedule.dayOfWeek, schedule.dayOfMonth);
      this.setData(this.STORAGE_KEYS.SCHEDULED_REPORTS, schedules);
    }

    return {
      success: true,
      ...reportResult,
      scheduleId,
      scheduleName: schedule.name
    };
  }

  // Check and run due scheduled reports (to be called periodically)
  checkScheduledReports() {
    const schedules = this.getScheduledReports();
    const now = new Date();
    const results = [];

    schedules.forEach(schedule => {
      if (schedule.status === 'active' && schedule.nextRunAt) {
        const nextRun = new Date(schedule.nextRunAt);
        if (now >= nextRun) {
          const result = this.runScheduledReport(schedule.id);
          results.push({ scheduleId: schedule.id, ...result });
        }
      }
    });

    return results;
  }

  // ==================== MULTI-FORMAT EXPORT ====================

  // Get export history
  getExportHistory() {
    return this.getData(this.STORAGE_KEYS.EXPORT_HISTORY) || [];
  }

  // Log export
  logExport(exportData) {
    const history = this.getExportHistory();
    const newExport = {
      id: `export_${Date.now()}`,
      ...exportData,
      exportedAt: new Date().toISOString()
    };
    history.unshift(newExport); // Add to beginning
    // Keep only last 100 exports
    if (history.length > 100) {
      history.splice(100);
    }
    this.setData(this.STORAGE_KEYS.EXPORT_HISTORY, history);
    return newExport;
  }

  // Export to CSV
  exportToCSV(data, columns, filename) {
    try {
      const csvContent = [
        columns.join(','),
        ...data.map(row => columns.map(col => {
          const value = row[col] || '';
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        }).join(','))
      ].join('\n');

      this.logExport({
        format: 'CSV',
        filename,
        recordCount: data.length,
        fileSize: new Blob([csvContent]).size
      });

      return {
        success: true,
        content: csvContent,
        mimeType: 'text/csv',
        filename: filename || `export_${Date.now()}.csv`
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Export to JSON
  exportToJSON(data, filename) {
    try {
      const jsonContent = JSON.stringify(data, null, 2);

      this.logExport({
        format: 'JSON',
        filename,
        recordCount: Array.isArray(data) ? data.length : 1,
        fileSize: new Blob([jsonContent]).size
      });

      return {
        success: true,
        content: jsonContent,
        mimeType: 'application/json',
        filename: filename || `export_${Date.now()}.json`
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Export to Excel (simple HTML table format that Excel can open)
  exportToExcel(data, columns, filename, sheetName = 'Sheet1') {
    try {
      let excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      this.logExport({
        format: 'Excel',
        filename,
        recordCount: data.length,
        fileSize: new Blob([excelContent]).size
      });

      return {
        success: true,
        content: excelContent,
        mimeType: 'application/vnd.ms-excel',
        filename: filename || `export_${Date.now()}.xls`
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Export salary slips to PDF (for batch processing)
  exportSalarySlipsPDF(salaryData) {
    try {
      // This will return structured data for PDF generation in the UI layer using jsPDF
      const slips = salaryData.map(salary => {
        const staff = this.getStaffById(salary.staffId);
        return {
          staff,
          salary,
          generatedDate: new Date().toLocaleDateString()
        };
      });

      this.logExport({
        format: 'PDF',
        filename: 'salary_slips_batch.pdf',
        recordCount: slips.length,
        fileSize: 0 // PDF size calculated in UI
      });

      return {
        success: true,
        slips,
        message: 'PDF data prepared for generation'
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Batch export utility
  batchExport(dataType, filters, format = 'csv') {
    let data = [];
    let columns = [];
    let filename = '';

    switch (dataType) {
      case 'staff':
        data = this.getStaff();
        columns = ['name', 'employeeId', 'department', 'designation', 'email', 'phone', 'basicSalary'];
        filename = `staff_${Date.now()}`;
        break;

      case 'attendance':
        data = this.getAttendanceRecords();
        columns = ['staffId', 'date', 'status', 'checkIn', 'checkOut', 'workingHours'];
        filename = `attendance_${Date.now()}`;
        break;

      case 'salary':
        data = this.getSalaryRecords();
        columns = ['staffId', 'month', 'year', 'grossSalary', 'totalDeductions', 'netSalary'];
        filename = `salary_${Date.now()}`;
        break;

      case 'leave':
        data = this.getLeaveApplications();
        columns = ['staffId', 'leaveType', 'startDate', 'endDate', 'days', 'status', 'reason'];
        filename = `leave_${Date.now()}`;
        break;

      default:
        return { success: false, message: 'Invalid data type' };
    }

    // Apply filters if provided
    if (filters) {
      data = this.applyFilters(data, filters);
    }

    // Export based on format
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(data, columns, `${filename}.csv`);
      case 'json':
        return this.exportToJSON(data, `${filename}.json`);
      case 'excel':
        return this.exportToExcel(data, columns, `${filename}.xls`);
      default:
        return { success: false, message: 'Unsupported format' };
    }
  }

  // Apply generic filters
  applyFilters(data, filters) {
    return data.filter(item => {
      for (let key in filters) {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          if (item[key] != filters[key]) {
            return false;
          }
        }
      }
      return true;
    });
  }

  // ==================== BANKING INTEGRATION ====================

  // Get all bank accounts
  getBankAccounts() {
    return this.getData(this.STORAGE_KEYS.BANK_ACCOUNTS) || [];
  }

  // Get bank account by ID
  getBankAccountById(accountId) {
    const accounts = this.getBankAccounts();
    return accounts.find(a => a.id === accountId);
  }

  // Add bank account
  addBankAccount(accountData) {
    const accounts = this.getBankAccounts();

    const newAccount = {
      id: `bank_${Date.now()}`,
      ...accountData,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    accounts.push(newAccount);
    this.setData(this.STORAGE_KEYS.BANK_ACCOUNTS, accounts);

    return { success: true, account: newAccount };
  }

  // Update bank account
  updateBankAccount(updatedAccount) {
    const accounts = this.getBankAccounts();
    const index = accounts.findIndex(a => a.id === updatedAccount.id);

    if (index === -1) {
      return { success: false, message: 'Bank account not found' };
    }

    accounts[index] = { ...accounts[index], ...updatedAccount, updatedAt: new Date().toISOString() };
    this.setData(this.STORAGE_KEYS.BANK_ACCOUNTS, accounts);

    return { success: true, account: accounts[index] };
  }

  // Delete bank account
  deleteBankAccount(accountId) {
    const accounts = this.getBankAccounts();
    const filtered = accounts.filter(a => a.id !== accountId);

    this.setData(this.STORAGE_KEYS.BANK_ACCOUNTS, filtered);

    return { success: true };
  }

  // Get all payment batches
  getPaymentBatches() {
    return this.getData(this.STORAGE_KEYS.PAYMENT_BATCHES) || [];
  }

  // Get payment batch by ID
  getPaymentBatchById(batchId) {
    const batches = this.getPaymentBatches();
    return batches.find(b => b.id === batchId);
  }

  // Create payment batch
  createPaymentBatch(batchData) {
    const batches = this.getPaymentBatches();

    const newBatch = {
      id: `batch_${Date.now()}`,
      ...batchData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      totalAmount: batchData.payments.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: batchData.payments.length
    };

    batches.push(newBatch);
    this.setData(this.STORAGE_KEYS.PAYMENT_BATCHES, batches);

    return { success: true, batch: newBatch };
  }

  // Update payment batch status
  updatePaymentBatchStatus(batchId, status) {
    const batches = this.getPaymentBatches();
    const index = batches.findIndex(b => b.id === batchId);

    if (index === -1) {
      return { success: false, message: 'Batch not found' };
    }

    batches[index].status = status;
    batches[index].updatedAt = new Date().toISOString();

    if (status === 'processed') {
      batches[index].processedAt = new Date().toISOString();
    }

    this.setData(this.STORAGE_KEYS.PAYMENT_BATCHES, batches);

    return { success: true, batch: batches[index] };
  }

  // Generate NEFT file
  generateNEFTFile(batchId) {
    const batch = this.getPaymentBatchById(batchId);
    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }

    const staff = this.getStaff();
    const neftRecords = [];

    batch.payments.forEach(payment => {
      const employee = staff.find(s => s.id === payment.staffId);
      if (employee && employee.bankAccount) {
        neftRecords.push({
          beneficiaryName: employee.name,
          accountNumber: employee.bankAccount,
          ifscCode: employee.ifscCode || '',
          amount: payment.amount,
          paymentMode: 'NEFT',
          beneficiaryEmail: employee.email || '',
          beneficiaryMobile: employee.phone || '',
          remarks: `Salary for ${payment.month}/${payment.year}`
        });
      }
    });

    const neftContent = this.formatNEFTFile(neftRecords, batch);

    return {
      success: true,
      content: neftContent,
      filename: `NEFT_${batchId}_${Date.now()}.txt`,
      recordCount: neftRecords.length
    };
  }

  // Format NEFT file content
  formatNEFTFile(records, batch) {
    let content = '';

    // Header
    content += `H,${batch.accountNumber || ''},${new Date().toISOString().split('T')[0]},${records.length},${batch.totalAmount}\n`;

    // Detail records
    records.forEach((rec, idx) => {
      content += `D,${idx + 1},${rec.beneficiaryName},${rec.accountNumber},${rec.ifscCode},${rec.amount},${rec.paymentMode},${rec.remarks}\n`;
    });

    // Trailer
    content += `T,${records.length},${batch.totalAmount}\n`;

    return content;
  }

  // Generate RTGS file
  generateRTGSFile(batchId) {
    const batch = this.getPaymentBatchById(batchId);
    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }

    const staff = this.getStaff();
    const rtgsRecords = [];

    batch.payments.forEach(payment => {
      const employee = staff.find(s => s.id === payment.staffId);
      if (employee && employee.bankAccount && payment.amount >= 200000) {
        rtgsRecords.push({
          beneficiaryName: employee.name,
          accountNumber: employee.bankAccount,
          ifscCode: employee.ifscCode || '',
          amount: payment.amount,
          paymentMode: 'RTGS',
          beneficiaryEmail: employee.email || '',
          beneficiaryMobile: employee.phone || '',
          remarks: `Salary for ${payment.month}/${payment.year}`
        });
      }
    });

    const rtgsContent = this.formatRTGSFile(rtgsRecords, batch);

    return {
      success: true,
      content: rtgsContent,
      filename: `RTGS_${batchId}_${Date.now()}.txt`,
      recordCount: rtgsRecords.length
    };
  }

  // Format RTGS file content
  formatRTGSFile(records, batch) {
    let content = '';

    // Header
    content += `H,${batch.accountNumber || ''},${new Date().toISOString().split('T')[0]},${records.length},${batch.totalAmount}\n`;

    // Detail records
    records.forEach((rec, idx) => {
      content += `D,${idx + 1},${rec.beneficiaryName},${rec.accountNumber},${rec.ifscCode},${rec.amount},${rec.paymentMode},${rec.remarks}\n`;
    });

    // Trailer
    content += `T,${records.length},${batch.totalAmount}\n`;

    return content;
  }

  // Get all transactions
  getPaymentTransactions() {
    return this.getData(this.STORAGE_KEYS.PAYMENT_TRANSACTIONS) || [];
  }

  // Log payment transaction
  logPaymentTransaction(transactionData) {
    const transactions = this.getPaymentTransactions();

    const newTransaction = {
      id: `txn_${Date.now()}`,
      ...transactionData,
      createdAt: new Date().toISOString()
    };

    transactions.push(newTransaction);
    this.setData(this.STORAGE_KEYS.PAYMENT_TRANSACTIONS, transactions);

    return { success: true, transaction: newTransaction };
  }

  // Update transaction status
  updateTransactionStatus(transactionId, status, reference = '') {
    const transactions = this.getPaymentTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);

    if (index === -1) {
      return { success: false, message: 'Transaction not found' };
    }

    transactions[index].status = status;
    transactions[index].reference = reference;
    transactions[index].updatedAt = new Date().toISOString();

    if (status === 'success') {
      transactions[index].completedAt = new Date().toISOString();
    }

    this.setData(this.STORAGE_KEYS.PAYMENT_TRANSACTIONS, transactions);

    return { success: true, transaction: transactions[index] };
  }

  // Get reconciliation records
  getBankReconciliation() {
    return this.getData(this.STORAGE_KEYS.BANK_RECONCILIATION) || [];
  }

  // Add reconciliation record
  addReconciliation(reconciliationData) {
    const records = this.getBankReconciliation();

    const newRecord = {
      id: `recon_${Date.now()}`,
      ...reconciliationData,
      createdAt: new Date().toISOString()
    };

    records.push(newRecord);
    this.setData(this.STORAGE_KEYS.BANK_RECONCILIATION, records);

    return { success: true, record: newRecord };
  }

  // Reconcile payment
  reconcilePayment(transactionId, bankReference, bankDate) {
    const transactions = this.getPaymentTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);

    if (index === -1) {
      return { success: false, message: 'Transaction not found' };
    }

    transactions[index].reconciled = true;
    transactions[index].bankReference = bankReference;
    transactions[index].bankDate = bankDate;
    transactions[index].reconciledAt = new Date().toISOString();

    this.setData(this.STORAGE_KEYS.PAYMENT_TRANSACTIONS, transactions);

    // Log reconciliation
    this.addReconciliation({
      transactionId,
      bankReference,
      bankDate,
      amount: transactions[index].amount,
      status: 'matched'
    });

    return { success: true, transaction: transactions[index] };
  }

  // Get payment summary by month
  getPaymentSummary(month, year) {
    const transactions = this.getPaymentTransactions();

    const filtered = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const summary = {
      totalPayments: filtered.length,
      totalAmount: filtered.reduce((sum, t) => sum + t.amount, 0),
      successfulPayments: filtered.filter(t => t.status === 'success').length,
      pendingPayments: filtered.filter(t => t.status === 'pending').length,
      failedPayments: filtered.filter(t => t.status === 'failed').length,
      reconciledPayments: filtered.filter(t => t.reconciled).length
    };

    return summary;
  }

  // Get unreconciled transactions
  getUnreconciledTransactions() {
    const transactions = this.getPaymentTransactions();
    return transactions.filter(t => !t.reconciled && t.status === 'success');
  }

  // ==================== RBAC (ROLE-BASED ACCESS CONTROL) ====================

  // Initialize default roles and permissions
  initializeRBAC() {
    const roles = this.getRoles();
    if (roles.length === 0) {
      // Create default roles
      const defaultRoles = [
        {
          id: 'role_admin',
          name: 'Admin',
          description: 'Full system access',
          permissions: ['*'], // All permissions
          createdAt: new Date().toISOString()
        },
        {
          id: 'role_hr_manager',
          name: 'HR Manager',
          description: 'Manage staff, attendance, leave',
          permissions: [
            'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
            'attendance.view', 'attendance.mark', 'attendance.edit',
            'leave.view', 'leave.approve', 'leave.reject',
            'salary.view', 'reports.view', 'reports.export'
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'role_accountant',
          name: 'Accountant',
          description: 'Manage payroll and finances',
          permissions: [
            'staff.view', 'salary.view', 'salary.process', 'salary.edit',
            'tax.view', 'tax.calculate', 'statutory.view', 'statutory.generate',
            'banking.view', 'banking.process', 'reports.view', 'reports.export'
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'role_viewer',
          name: 'Viewer',
          description: 'Read-only access',
          permissions: [
            'staff.view', 'attendance.view', 'leave.view',
            'salary.view', 'reports.view'
          ],
          createdAt: new Date().toISOString()
        }
      ];

      this.setData(this.STORAGE_KEYS.ROLES, defaultRoles);
    }
  }

  // Get all roles
  getRoles() {
    return this.getData(this.STORAGE_KEYS.ROLES) || [];
  }

  // Get role by ID
  getRoleById(roleId) {
    const roles = this.getRoles();
    return roles.find(r => r.id === roleId);
  }

  // Add role
  addRole(roleData) {
    const roles = this.getRoles();

    const newRole = {
      id: `role_${Date.now()}`,
      ...roleData,
      createdAt: new Date().toISOString()
    };

    roles.push(newRole);
    this.setData(this.STORAGE_KEYS.ROLES, roles);

    return { success: true, role: newRole };
  }

  // Update role
  updateRole(updatedRole) {
    const roles = this.getRoles();
    const index = roles.findIndex(r => r.id === updatedRole.id);

    if (index === -1) {
      return { success: false, message: 'Role not found' };
    }

    roles[index] = { ...roles[index], ...updatedRole, updatedAt: new Date().toISOString() };
    this.setData(this.STORAGE_KEYS.ROLES, roles);

    return { success: true, role: roles[index] };
  }

  // Delete role
  deleteRole(roleId) {
    // Prevent deletion of default roles
    if (roleId.startsWith('role_admin') || roleId.startsWith('role_hr_manager') ||
        roleId.startsWith('role_accountant') || roleId.startsWith('role_viewer')) {
      return { success: false, message: 'Cannot delete default roles' };
    }

    const roles = this.getRoles();
    const filtered = roles.filter(r => r.id !== roleId);

    // Remove role assignments
    const userRoles = this.getUserRoles();
    const updatedUserRoles = userRoles.map(ur => ({
      ...ur,
      roles: ur.roles.filter(r => r !== roleId)
    }));
    this.setData(this.STORAGE_KEYS.USER_ROLES, updatedUserRoles);

    this.setData(this.STORAGE_KEYS.ROLES, filtered);

    return { success: true };
  }

  // Get user roles
  getUserRoles() {
    return this.getData(this.STORAGE_KEYS.USER_ROLES) || [];
  }

  // Assign role to user
  assignRole(userId, roleId) {
    const userRoles = this.getUserRoles();
    let userRole = userRoles.find(ur => ur.userId === userId);

    if (!userRole) {
      userRole = {
        userId,
        roles: [],
        assignedAt: new Date().toISOString()
      };
      userRoles.push(userRole);
    }

    if (!userRole.roles.includes(roleId)) {
      userRole.roles.push(roleId);
      userRole.updatedAt = new Date().toISOString();
    }

    this.setData(this.STORAGE_KEYS.USER_ROLES, userRoles);

    return { success: true, userRole };
  }

  // Remove role from user
  removeRole(userId, roleId) {
    const userRoles = this.getUserRoles();
    const userRole = userRoles.find(ur => ur.userId === userId);

    if (!userRole) {
      return { success: false, message: 'User role not found' };
    }

    userRole.roles = userRole.roles.filter(r => r !== roleId);
    userRole.updatedAt = new Date().toISOString();

    this.setData(this.STORAGE_KEYS.USER_ROLES, userRoles);

    return { success: true, userRole };
  }

  // Get user's roles
  getUserRolesByUserId(userId) {
    const userRoles = this.getUserRoles();
    const userRole = userRoles.find(ur => ur.userId === userId);

    if (!userRole) {
      return [];
    }

    const roles = this.getRoles();
    return roles.filter(r => userRole.roles.includes(r.id));
  }

  // Check if user has permission
  hasPermission(userId, permission) {
    const userRolesList = this.getUserRolesByUserId(userId);

    // Check if user has admin role (all permissions)
    if (userRolesList.some(r => r.permissions.includes('*'))) {
      return true;
    }

    // Check if user has specific permission
    return userRolesList.some(r => r.permissions.includes(permission));
  }

  // Get all permissions
  getAllPermissions() {
    return [
      { category: 'Staff', permissions: ['staff.view', 'staff.create', 'staff.edit', 'staff.delete'] },
      { category: 'Attendance', permissions: ['attendance.view', 'attendance.mark', 'attendance.edit', 'attendance.delete'] },
      { category: 'Leave', permissions: ['leave.view', 'leave.create', 'leave.approve', 'leave.reject', 'leave.delete'] },
      { category: 'Salary', permissions: ['salary.view', 'salary.process', 'salary.edit', 'salary.delete'] },
      { category: 'Tax', permissions: ['tax.view', 'tax.calculate', 'tax.edit'] },
      { category: 'Statutory', permissions: ['statutory.view', 'statutory.generate', 'statutory.export'] },
      { category: 'Banking', permissions: ['banking.view', 'banking.process', 'banking.reconcile'] },
      { category: 'Reports', permissions: ['reports.view', 'reports.create', 'reports.export'] },
      { category: 'Settings', permissions: ['settings.view', 'settings.edit'] },
      { category: 'Users', permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles'] }
    ];
  }

  // Log access attempt
  logAccess(userId, resource, action, allowed) {
    const accessLog = this.getData(this.STORAGE_KEYS.ACCESS_LOG) || [];

    const logEntry = {
      id: `access_${Date.now()}`,
      userId,
      resource,
      action,
      allowed,
      timestamp: new Date().toISOString(),
      ipAddress: 'localhost' // In real app, get from request
    };

    accessLog.unshift(logEntry);

    // Keep only last 1000 entries
    if (accessLog.length > 1000) {
      accessLog.splice(1000);
    }

    this.setData(this.STORAGE_KEYS.ACCESS_LOG, accessLog);

    return logEntry;
  }

  // Get access log
  getAccessLog(filters = {}) {
    const log = this.getData(this.STORAGE_KEYS.ACCESS_LOG) || [];

    if (!filters.userId && !filters.resource && !filters.allowed) {
      return log;
    }

    return log.filter(entry => {
      if (filters.userId && entry.userId !== filters.userId) return false;
      if (filters.resource && entry.resource !== filters.resource) return false;
      if (filters.allowed !== undefined && entry.allowed !== filters.allowed) return false;
      return true;
    });
  }

  // Get denied access attempts
  getDeniedAccess(userId = null) {
    const log = this.getAccessLog();
    let denied = log.filter(entry => !entry.allowed);

    if (userId) {
      denied = denied.filter(entry => entry.userId === userId);
    }

    return denied;
  }

  // ========== WORKLOG METHODS ==========

  // --- WorkLog Settings ---
  getWorkLogSettings() {
    return this.getData(this.STORAGE_KEYS.WORKLOG_SETTINGS) || {
      categories: ['Engineering', 'Leadership', 'Customer', 'Process', 'Strategy', 'Learning', 'Operations', 'Sales'],
      contributionRoles: ['Led', 'Contributed', 'Supported', 'Reviewed'],
      impactTypes: ['Revenue', 'Cost Saving', 'Efficiency', 'Quality', 'Customer Satisfaction', 'Team Growth'],
      reminderFrequency: 'weekly',
      reviewCyclePeriod: 'quarterly',
      enablePraise: true,
      enableGoals: true,
      enableSkills: true,
      weeklyLogTarget: 3,
    };
  }

  updateWorkLogSettings(settings) {
    this.setData(this.STORAGE_KEYS.WORKLOG_SETTINGS, settings);
    this.logAudit('update', 'worklog_settings', 'global', settings);
    return settings;
  }

  // --- WorkLog Entries CRUD ---
  getWorkLogEntries(staffId = null, filters = {}) {
    const entries = this.getData(this.STORAGE_KEYS.WORKLOGS) || [];
    let filtered = entries;

    if (staffId) filtered = filtered.filter(e => e.staffId === staffId);
    if (filters.category) filtered = filtered.filter(e => e.category === filters.category);
    if (filters.contributionRole) filtered = filtered.filter(e => e.contributionRole === filters.contributionRole);
    if (filters.startDate) filtered = filtered.filter(e => e.date >= filters.startDate);
    if (filters.endDate) filtered = filtered.filter(e => e.date <= filters.endDate);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.impact || '').toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addWorkLogEntry(entry) {
    const entries = this.getData(this.STORAGE_KEYS.WORKLOGS) || [];
    const staff = this.getStaffById(entry.staffId);
    const newEntry = {
      ...entry,
      id: this.generateId('wlog'),
      createdAt: new Date().toISOString(),
      updatedAt: null,
      staffName: staff ? staff.name : 'Unknown',
    };
    entries.push(newEntry);
    this.setData(this.STORAGE_KEYS.WORKLOGS, entries);
    this.logAudit('create', 'worklog_entry', newEntry.id, { staffId: entry.staffId, title: entry.title });
    return newEntry;
  }

  updateWorkLogEntry(id, updates) {
    const entries = this.getData(this.STORAGE_KEYS.WORKLOGS) || [];
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
    this.setData(this.STORAGE_KEYS.WORKLOGS, entries);
    this.logAudit('update', 'worklog_entry', id, updates);
    return entries[idx];
  }

  deleteWorkLogEntry(id) {
    const entries = this.getData(this.STORAGE_KEYS.WORKLOGS) || [];
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length === entries.length) return false;
    this.setData(this.STORAGE_KEYS.WORKLOGS, filtered);
    this.logAudit('delete', 'worklog_entry', id);
    return true;
  }

  // --- Praise CRUD ---
  getPraise(staffId = null, filters = {}) {
    const praise = this.getData(this.STORAGE_KEYS.WORKLOG_PRAISE) || [];
    let filtered = praise;

    if (staffId) filtered = filtered.filter(p => p.staffId === staffId);
    if (filters.tag) filtered = filtered.filter(p => p.tag === filters.tag);
    if (filters.startDate) filtered = filtered.filter(p => p.date >= filters.startDate);
    if (filters.endDate) filtered = filtered.filter(p => p.date <= filters.endDate);

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addPraise(praise) {
    const items = this.getData(this.STORAGE_KEYS.WORKLOG_PRAISE) || [];
    const staff = this.getStaffById(praise.staffId);
    const newPraise = {
      ...praise,
      id: this.generateId('praise'),
      createdAt: new Date().toISOString(),
      staffName: staff ? staff.name : 'Unknown',
    };
    items.push(newPraise);
    this.setData(this.STORAGE_KEYS.WORKLOG_PRAISE, items);
    this.logAudit('create', 'worklog_praise', newPraise.id, { staffId: praise.staffId });
    return newPraise;
  }

  deletePraise(id) {
    const items = this.getData(this.STORAGE_KEYS.WORKLOG_PRAISE) || [];
    const filtered = items.filter(p => p.id !== id);
    if (filtered.length === items.length) return false;
    this.setData(this.STORAGE_KEYS.WORKLOG_PRAISE, filtered);
    this.logAudit('delete', 'worklog_praise', id);
    return true;
  }

  // --- Review Cycles CRUD ---
  getReviewCycles() {
    return (this.getData(this.STORAGE_KEYS.WORKLOG_REVIEW_CYCLES) || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getActiveReviewCycle() {
    const cycles = this.getReviewCycles();
    return cycles.find(c => c.status === 'active') || null;
  }

  addReviewCycle(cycle) {
    const cycles = this.getData(this.STORAGE_KEYS.WORKLOG_REVIEW_CYCLES) || [];
    const newCycle = {
      ...cycle,
      id: this.generateId('review'),
      status: cycle.status || 'draft',
      createdAt: new Date().toISOString(),
      completions: {},
    };
    cycles.push(newCycle);
    this.setData(this.STORAGE_KEYS.WORKLOG_REVIEW_CYCLES, cycles);
    this.logAudit('create', 'review_cycle', newCycle.id, { name: cycle.name });
    return newCycle;
  }

  updateReviewCycle(id, updates) {
    const cycles = this.getData(this.STORAGE_KEYS.WORKLOG_REVIEW_CYCLES) || [];
    const idx = cycles.findIndex(c => c.id === id);
    if (idx === -1) return null;
    cycles[idx] = { ...cycles[idx], ...updates };
    this.setData(this.STORAGE_KEYS.WORKLOG_REVIEW_CYCLES, cycles);
    this.logAudit('update', 'review_cycle', id, updates);
    return cycles[idx];
  }

  deleteReviewCycle(id) {
    const cycles = this.getData(this.STORAGE_KEYS.WORKLOG_REVIEW_CYCLES) || [];
    const filtered = cycles.filter(c => c.id !== id);
    if (filtered.length === cycles.length) return false;
    this.setData(this.STORAGE_KEYS.WORKLOG_REVIEW_CYCLES, filtered);
    this.logAudit('delete', 'review_cycle', id);
    return true;
  }

  // --- Goals CRUD ---
  getGoals(staffId = null) {
    const goals = this.getData(this.STORAGE_KEYS.WORKLOG_GOALS) || [];
    if (staffId) return goals.filter(g => g.staffId === staffId);
    return goals;
  }

  addGoal(goal) {
    const goals = this.getData(this.STORAGE_KEYS.WORKLOG_GOALS) || [];
    const newGoal = {
      ...goal,
      id: this.generateId('goal'),
      createdAt: new Date().toISOString(),
      progress: goal.progress || 0,
      status: goal.status || 'active',
    };
    goals.push(newGoal);
    this.setData(this.STORAGE_KEYS.WORKLOG_GOALS, goals);
    this.logAudit('create', 'worklog_goal', newGoal.id, { staffId: goal.staffId, title: goal.title });
    return newGoal;
  }

  updateGoal(id, updates) {
    const goals = this.getData(this.STORAGE_KEYS.WORKLOG_GOALS) || [];
    const idx = goals.findIndex(g => g.id === id);
    if (idx === -1) return null;
    goals[idx] = { ...goals[idx], ...updates };
    this.setData(this.STORAGE_KEYS.WORKLOG_GOALS, goals);
    this.logAudit('update', 'worklog_goal', id, updates);
    return goals[idx];
  }

  deleteGoal(id) {
    const goals = this.getData(this.STORAGE_KEYS.WORKLOG_GOALS) || [];
    const filtered = goals.filter(g => g.id !== id);
    if (filtered.length === goals.length) return false;
    this.setData(this.STORAGE_KEYS.WORKLOG_GOALS, filtered);
    this.logAudit('delete', 'worklog_goal', id);
    return true;
  }

  // --- Skills CRUD ---
  getSkills(staffId = null) {
    const skills = this.getData(this.STORAGE_KEYS.WORKLOG_SKILLS) || [];
    if (staffId) return skills.filter(s => s.staffId === staffId);
    return skills;
  }

  addSkill(skill) {
    const skills = this.getData(this.STORAGE_KEYS.WORKLOG_SKILLS) || [];
    const newSkill = {
      ...skill,
      id: this.generateId('skill'),
      createdAt: new Date().toISOString(),
      endorsements: 0,
    };
    skills.push(newSkill);
    this.setData(this.STORAGE_KEYS.WORKLOG_SKILLS, skills);
    this.logAudit('create', 'worklog_skill', newSkill.id, { staffId: skill.staffId, name: skill.name });
    return newSkill;
  }

  updateSkill(id, updates) {
    const skills = this.getData(this.STORAGE_KEYS.WORKLOG_SKILLS) || [];
    const idx = skills.findIndex(s => s.id === id);
    if (idx === -1) return null;
    skills[idx] = { ...skills[idx], ...updates };
    this.setData(this.STORAGE_KEYS.WORKLOG_SKILLS, skills);
    return skills[idx];
  }

  deleteSkill(id) {
    const skills = this.getData(this.STORAGE_KEYS.WORKLOG_SKILLS) || [];
    const filtered = skills.filter(s => s.id !== id);
    if (filtered.length === skills.length) return false;
    this.setData(this.STORAGE_KEYS.WORKLOG_SKILLS, filtered);
    this.logAudit('delete', 'worklog_skill', id);
    return true;
  }

  // --- Computed / Analytics ---
  getWorkLogStats(staffId, dateRange = {}) {
    const entries = this.getWorkLogEntries(staffId, dateRange);
    const praise = this.getPraise(staffId, dateRange);
    const goals = this.getGoals(staffId);
    const skills = this.getSkills(staffId);

    // Category breakdown
    const categoryBreakdown = {};
    entries.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
    });

    // Role breakdown
    const roleBreakdown = {};
    entries.forEach(e => {
      if (e.contributionRole) {
        roleBreakdown[e.contributionRole] = (roleBreakdown[e.contributionRole] || 0) + 1;
      }
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = 0;
    }
    entries.forEach(e => {
      const d = new Date(e.date || e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrend[key] !== undefined) monthlyTrend[key]++;
    });

    // Entries this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = entries.filter(e => new Date(e.date || e.createdAt) >= weekStart).length;

    // Entries this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = entries.filter(e => new Date(e.date || e.createdAt) >= monthStart).length;

    // Active goals
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return {
      totalEntries: entries.length,
      totalPraise: praise.length,
      totalSkills: skills.length,
      thisWeek,
      thisMonth,
      categoryBreakdown,
      roleBreakdown,
      monthlyTrend,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalGoals: goals.length,
    };
  }

  getTeamEngagement() {
    const staff = this.getStaff().filter(s => s.status !== 'inactive');
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const allEntries = this.getData(this.STORAGE_KEYS.WORKLOGS) || [];
    const allPraise = this.getData(this.STORAGE_KEYS.WORKLOG_PRAISE) || [];
    const settings = this.getWorkLogSettings();

    const engagement = staff.map(s => {
      const staffEntries = allEntries.filter(e => e.staffId === s.id);
      const staffPraise = allPraise.filter(p => p.staffId === s.id);
      const weekEntries = staffEntries.filter(e => new Date(e.date || e.createdAt) >= weekStart);
      const recentEntries = staffEntries.filter(e => new Date(e.date || e.createdAt) >= twoWeeksAgo);
      const lastEntry = staffEntries.length > 0
        ? staffEntries.reduce((latest, e) => new Date(e.createdAt) > new Date(latest.createdAt) ? e : latest)
        : null;
      const daysSinceLastEntry = lastEntry
        ? Math.floor((now - new Date(lastEntry.createdAt)) / (1000 * 60 * 60 * 24))
        : 999;

      let engagementLevel = 'high';
      if (daysSinceLastEntry > 14) engagementLevel = 'low';
      else if (daysSinceLastEntry > 7 || weekEntries.length === 0) engagementLevel = 'medium';

      return {
        staffId: s.id,
        staffName: s.name,
        department: s.department,
        designation: s.designation,
        totalEntries: staffEntries.length,
        weekEntries: weekEntries.length,
        recentEntries: recentEntries.length,
        praiseCount: staffPraise.length,
        lastEntryDate: lastEntry ? lastEntry.createdAt : null,
        daysSinceLastEntry,
        engagementLevel,
        meetsWeeklyTarget: weekEntries.length >= (settings.weeklyLogTarget || 3),
      };
    });

    const weeklyActiveLoggers = engagement.filter(e => e.weekEntries > 0).length;
    const atRisk = engagement.filter(e => e.engagementLevel === 'low');
    const totalEntriesThisMonth = allEntries.filter(e => {
      const d = new Date(e.date || e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return {
      staff: engagement,
      totalStaff: staff.length,
      weeklyActiveLoggers,
      weeklyActivePercent: staff.length > 0 ? Math.round((weeklyActiveLoggers / staff.length) * 100) : 0,
      atRiskCount: atRisk.length,
      atRiskStaff: atRisk,
      totalEntriesThisMonth,
    };
  }

  getReviewReadiness(staffId, cycleId = null) {
    let cycle = null;
    if (cycleId) {
      const cycles = this.getReviewCycles();
      cycle = cycles.find(c => c.id === cycleId);
    } else {
      cycle = this.getActiveReviewCycle();
    }

    if (!cycle) return { readiness: 0, entries: 0, praise: 0, goals: 0, hasLog: false };

    const dateRange = { startDate: cycle.startDate, endDate: cycle.endDate };
    const entries = this.getWorkLogEntries(staffId, dateRange);
    const praise = this.getPraise(staffId, dateRange);
    const goals = this.getGoals(staffId).filter(g => g.status === 'completed');

    // Readiness scoring: entries weight 50%, praise 25%, goals 25%
    const entryScore = Math.min(entries.length / 10, 1) * 50;
    const praiseScore = Math.min(praise.length / 3, 1) * 25;
    const goalScore = Math.min(goals.length / 2, 1) * 25;
    const readiness = Math.round(entryScore + praiseScore + goalScore);

    return {
      readiness: Math.min(readiness, 100),
      entries: entries.length,
      praise: praise.length,
      completedGoals: goals.length,
      hasLog: entries.length > 0,
      completion: cycle.completions?.[staffId] || 0,
    };
  }

  // Generate review summary data for a staff member
  generateReviewSummary(staffId, cycleId = null) {
    let dateRange = {};
    const cycle = cycleId
      ? this.getReviewCycles().find(c => c.id === cycleId)
      : this.getActiveReviewCycle();

    if (cycle) {
      dateRange = { startDate: cycle.startDate, endDate: cycle.endDate };
    }

    const staff = this.getStaffById(staffId);
    const entries = this.getWorkLogEntries(staffId, dateRange);
    const praise = this.getPraise(staffId, dateRange);
    const goals = this.getGoals(staffId);
    const skills = this.getSkills(staffId);
    const stats = this.getWorkLogStats(staffId, dateRange);

    // Top contributions (entries with impact)
    const topContributions = entries
      .filter(e => e.impact && e.impact.trim())
      .sort((a, b) => (b.impactValue || 0) - (a.impactValue || 0))
      .slice(0, 5);

    // Category summary
    const categories = Object.entries(stats.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ category: cat, count }));

    // Leadership entries (Led role)
    const ledEntries = entries.filter(e => e.contributionRole === 'Led');

    return {
      staff,
      cycle,
      totalEntries: entries.length,
      totalPraise: praise.length,
      topContributions,
      categories,
      ledEntries: ledEntries.length,
      praise,
      goals: goals.filter(g => g.status === 'completed'),
      activeGoals: goals.filter(g => g.status === 'active'),
      skills,
      monthlyTrend: stats.monthlyTrend,
      readiness: this.getReviewReadiness(staffId, cycleId),
    };
  }
}

export default new PayrollDataStore();
