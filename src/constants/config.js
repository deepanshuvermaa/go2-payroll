// API Configuration
export const BACKEND_ENDPOINTS = [
  '/api',
  'http://localhost:3001/api'
];

export const API_BASE_URL = import.meta.env.VITE_API_URL || BACKEND_ENDPOINTS[0];

// App Configuration
export const APP_NAME = 'Go2-Payroll';
export const APP_VERSION = '1.0.0';

// Offline mode configuration
export const OFFLINE_MODE = {
  ENABLED: true,
  SYNC_INTERVAL: 5 * 60 * 1000,
  CONNECTION_TIMEOUT: 5000,
  CACHE_USER_CREDENTIALS: true
};

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  STAFF: 'staff'
};

// Employment Types
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERN: 'intern',
  CONSULTANT: 'consultant'
};

// Leave Types
export const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Unpaid Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Comp Off'
];

export const LEAVE_TYPE_CODES = {
  CASUAL: 'casual',
  SICK: 'sick',
  EARNED: 'earned',
  UNPAID: 'unpaid',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  COMP_OFF: 'comp_off'
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half-day',
  LEAVE: 'leave',
  WEEK_OFF: 'week-off',
  HOLIDAY: 'holiday'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  UPI: 'upi'
};

// Salary Components
export const SALARY_COMPONENTS = {
  EARNINGS: {
    BASIC: 'basic',
    HRA: 'hra',
    DA: 'da',
    CONVEYANCE: 'conveyance',
    MEDICAL: 'medical',
    SPECIAL_ALLOWANCE: 'special_allowance',
    OVERTIME: 'overtime',
    BONUS: 'bonus',
    INCENTIVE: 'incentive'
  },
  DEDUCTIONS: {
    PF: 'pf',
    ESI: 'esi',
    PT: 'pt',
    TDS: 'tds',
    LATE_MARK: 'late_mark',
    ADVANCE: 'advance',
    LOAN: 'loan',
    OTHER: 'other'
  }
};

// Shift Types
export const SHIFT_TYPES = {
  FIXED: 'fixed',
  FLEXIBLE: 'flexible',
  ROTATION: 'rotation'
};

// Departments
export const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Data Science', 'DevOps',
  'Quality Assurance', 'IT Infrastructure', 'Cybersecurity',
  'Human Resources', 'Finance & Accounts', 'Legal & Compliance',
  'Sales', 'Marketing', 'Business Development', 'Customer Success',
  'Operations', 'Supply Chain', 'Procurement',
  'Admin & Facilities', 'Research & Development',
  'Content', 'Analytics', 'Strategy', 'Training & Development',
  'Management', 'Executive Office', 'Other'
];

// Designations
export const DESIGNATIONS = [
  // C-Suite & Leadership
  'CEO', 'CTO', 'CFO', 'COO', 'CHRO', 'CPO', 'CMO',
  'VP Engineering', 'VP Product', 'VP Sales', 'VP Operations',
  'Director', 'Associate Director', 'Senior Director',
  // Management
  'General Manager', 'Senior Manager', 'Manager', 'Assistant Manager',
  'Team Lead', 'Tech Lead', 'Engineering Manager', 'Project Manager',
  'Delivery Manager', 'Program Manager', 'Scrum Master',
  // Tech Roles
  'Principal Engineer', 'Staff Engineer', 'Senior Software Engineer',
  'Software Engineer', 'Junior Software Engineer', 'Trainee Engineer',
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Mobile Developer', 'DevOps Engineer', 'SRE', 'Cloud Architect',
  'Solution Architect', 'Data Engineer', 'Data Scientist', 'ML Engineer',
  'QA Engineer', 'SDET', 'Security Engineer', 'DBA',
  // Design
  'Design Lead', 'Senior UI/UX Designer', 'UI/UX Designer', 'Product Designer',
  'Graphic Designer', 'Visual Designer',
  // Business
  'Business Analyst', 'Product Manager', 'Senior Product Manager',
  'Account Manager', 'Sales Executive', 'Senior Sales Executive',
  'Marketing Manager', 'Digital Marketing Executive', 'Content Writer',
  'SEO Specialist', 'Growth Manager',
  // HR & Admin
  'HR Manager', 'HR Executive', 'Recruiter', 'Senior Recruiter',
  'Talent Acquisition Lead', 'Admin Executive', 'Office Manager',
  'Executive Assistant', 'Receptionist',
  // Finance
  'Finance Manager', 'Senior Accountant', 'Accountant', 'Accounts Executive',
  'Payroll Specialist', 'Tax Consultant', 'Auditor',
  // Operations
  'Operations Manager', 'Operations Executive', 'Logistics Coordinator',
  'Procurement Officer', 'Facilities Manager',
  // Entry Level
  'Intern', 'Apprentice', 'Trainee', 'Fresher',
  'Other'
];

// Staff Status
export const STAFF_STATUS = [
  'active',
  'inactive',
  'terminated'
];

// Report Types
export const REPORT_TYPES = {
  PAYROLL_SUMMARY: 'payroll-summary',
  ATTENDANCE_REPORT: 'attendance-report',
  LEAVE_REPORT: 'leave-report',
  STAFF_REPORT: 'staff-report',
  SALARY_REGISTER: 'salary-register',
  BANK_TRANSFER: 'bank-transfer',
  CASH_PAYMENT: 'cash-payment',
  PF_REPORT: 'pf-report',
  ESI_REPORT: 'esi-report',
  PT_REPORT: 'pt-report',
  TDS_REPORT: 'tds-report'
};

// Date Ranges
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom'
};

// Subscription Plans (matches Go2-Desktop)
export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    name: 'Trial',
    duration: 7,
    maxStaff: 5,
    features: ['Basic payroll', 'Up to 5 staff', 'Basic attendance']
  },
  BASIC: {
    name: 'Basic',
    price: 999,
    maxStaff: 25,
    features: ['All Trial features', 'Up to 25 staff', 'Leave management']
  },
  PREMIUM: {
    name: 'Premium',
    price: 1999,
    maxStaff: 50,
    features: ['All Basic features', 'Up to 50 staff', 'Advance tracking', 'Advanced reports']
  },
  PLATINUM: {
    name: 'Platinum',
    price: 3999,
    maxStaff: 999,
    features: ['All Premium features', 'Unlimited staff', 'Statutory reports', 'Multi-user', 'Priority support']
  }
};

// Top 20 Indian Banks
export const INDIAN_BANKS = [
  'State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'IndusInd Bank', 'Yes Bank', 'Punjab National Bank (PNB)',
  'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Indian Bank',
  'Bank of India', 'Central Bank of India', 'IDBI Bank', 'Federal Bank',
  'South Indian Bank', 'Bandhan Bank', 'IDFC First Bank', 'RBL Bank'
];

// Statutory Limits (FY 2024-25 / AY 2025-26)
export const STATUTORY_LIMITS = {
  ESI_WAGE_LIMIT: 21000,
  PF_BASIC_LIMIT: 15000,
  PF_EMPLOYEE_RATE: 0.12,
  PF_EMPLOYER_RATE: 0.12,
  EPS_RATE: 0.0833,
  ESI_EMPLOYEE_RATE: 0.0075,
  ESI_EMPLOYER_RATE: 0.0325,
  GRATUITY_ELIGIBLE_YEARS: 5,
  // New Tax Regime (Default from FY 2023-24) — Budget 2024
  NEW_REGIME_SLABS: [
    { from: 0, to: 300000, rate: 0 },
    { from: 300001, to: 700000, rate: 0.05 },
    { from: 700001, to: 1000000, rate: 0.10 },
    { from: 1000001, to: 1200000, rate: 0.15 },
    { from: 1200001, to: 1500000, rate: 0.20 },
    { from: 1500001, to: Infinity, rate: 0.30 },
  ],
  NEW_REGIME_STANDARD_DEDUCTION: 75000,
  NEW_REGIME_REBATE_LIMIT: 700000, // No tax if income <= 7L (87A)
  // Old Tax Regime
  OLD_REGIME_SLABS: [
    { from: 0, to: 250000, rate: 0 },
    { from: 250001, to: 500000, rate: 0.05 },
    { from: 500001, to: 1000000, rate: 0.20 },
    { from: 1000001, to: Infinity, rate: 0.30 },
  ],
  OLD_REGIME_STANDARD_DEDUCTION: 50000,
  OLD_REGIME_REBATE_LIMIT: 500000, // No tax if income <= 5L (87A)
  OLD_REGIME_80C_LIMIT: 150000,
  OLD_REGIME_80D_LIMIT: 25000,
  OLD_REGIME_80D_SENIOR: 50000,
  OLD_REGIME_NPS_80CCD: 50000,
  OLD_REGIME_HOME_LOAN_LIMIT: 200000,
  // Surcharge
  SURCHARGE_SLABS: [
    { from: 0, to: 5000000, rate: 0 },
    { from: 5000001, to: 10000000, rate: 0.10 },
    { from: 10000001, to: 20000000, rate: 0.15 },
    { from: 20000001, to: 50000000, rate: 0.25 },
    { from: 50000001, to: Infinity, rate: 0.37 },
  ],
  // New regime surcharge capped at 25% for income > 2Cr
  NEW_REGIME_MAX_SURCHARGE: 0.25,
  CESS_RATE: 0.04,
  // Professional Tax (Maharashtra default)
  PT_SLABS: [
    { from: 0, to: 7500, tax: 0 },
    { from: 7501, to: 10000, tax: 175 },
    { from: 10001, to: Infinity, tax: 200 },
  ],
};

// Default Settings
export const DEFAULT_SETTINGS = {
  company: {
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    pfNumber: '',
    esiNumber: '',
    ptNumber: ''
  },
  payroll: {
    salaryProcessingDay: 1,      // 1st of next month
    paymentMode: 'bank_transfer',
    overtimeRate: 1.5,
    lateMarkPenalty: 100,
    earlyLeavePenalty: 200,
    halfDayThreshold: 4,          // 4 hours = half day
    gracePeriod: 15,              // 15 mins grace
    workingDaysPerMonth: 26,
    weeklyOff: 'Sunday'
  },
  leave: {
    casual: 12,
    sick: 12,
    earned: 15,
    carryForward: true,
    maxCarryForward: 15,
    encashment: true
  }
};

export default {
  API_BASE_URL,
  APP_NAME,
  APP_VERSION,
  USER_ROLES,
  EMPLOYMENT_TYPES,
  LEAVE_TYPES,
  ATTENDANCE_STATUS,
  PAYMENT_METHODS,
  SALARY_COMPONENTS,
  SHIFT_TYPES,
  DEPARTMENTS,
  DESIGNATIONS,
  REPORT_TYPES,
  DATE_RANGES,
  SUBSCRIPTION_PLANS,
  STATUTORY_LIMITS,
  DEFAULT_SETTINGS
};
