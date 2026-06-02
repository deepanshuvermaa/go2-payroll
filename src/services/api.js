import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } });

// Request interceptor — attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401, refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => { originalRequest.headers.Authorization = `Bearer ${token}`; return api(originalRequest); });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { logout(); return Promise.reject(error); }
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newToken = data.data.token;
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) { processQueue(err); logout(); return Promise.reject(err); }
      finally { isRefreshing = false; }
    }
    return Promise.reject(error);
  }
);

const logout = () => { localStorage.clear(); window.location.href = '/#/login'; };

// Generic CRUD helpers
const get = (url, params) => api.get(url, { params }).then(r => r.data);
const post = (url, data) => api.post(url, data).then(r => r.data);
const put = (url, data) => api.put(url, data).then(r => r.data);
const del = (url) => api.delete(url).then(r => r.data);

// ===== AUTH =====
export const authAPI = {
  login: (creds) => post('/auth/login', creds),
  register: (data) => post('/auth/register', data),
  refresh: (refreshToken) => post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => post('/auth/logout', { refreshToken }),
  changePassword: (data) => post('/auth/change-password', data),
};

// ===== ORGANIZATION =====
export const orgAPI = {
  get: () => get('/org/org'),
  update: (data) => put('/org/org', data),
  getBranches: () => get('/org/branches'),
  createBranch: (data) => post('/org/branches', data),
  getDepartments: () => get('/org/departments'),
  createDepartment: (data) => post('/org/departments', data),
  getDesignations: () => get('/org/designations'),
  createDesignation: (data) => post('/org/designations', data),
  getOrgChart: () => get('/org/org-chart'),
};

// ===== EMPLOYEES =====
export const employeeAPI = {
  list: (params) => get('/org/employees', params),
  getById: (id) => get(`/org/employees/${id}`),
  create: (data) => post('/org/employees', data),
  update: (id, data) => put(`/org/employees/${id}`, data),
  transfer: (id, data) => post(`/org/employees/${id}/transfer`, data),
  promote: (id, data) => post(`/org/employees/${id}/promote`, data),
  getTimeline: (id) => get(`/org/employees/${id}/timeline`),
  getReportees: (id) => get(`/org/employees/${id}/reportees`),
};

// ===== ATTENDANCE =====
export const attendanceAPI = {
  checkIn: (data) => post('/attendance/check-in', data),
  checkOut: (data) => post('/attendance/check-out', data),
  mark: (data) => post('/attendance/mark', data),
  bulkMark: (data) => post('/attendance/bulk-mark', data),
  getByDate: (date) => get(`/attendance/date/${date}`),
  getByEmployee: (id, params) => get(`/attendance/employee/${id}/monthly`, params),
  getSummary: (id, params) => get(`/attendance/employee/${id}/summary`, params),
  getOrgSummary: (params) => get('/attendance/org-summary', params),
  autoAbsent: (data) => post('/attendance/auto-absent', data),
  lock: (data) => post('/attendance/lock', data),
  // Geofence
  addGeofence: (data) => post('/attendance/geofences', data),
  getGeofences: () => get('/attendance/geofences'),
  validateLocation: (data) => post('/attendance/validate-location', data),
  // Regularization
  applyRegularization: (data) => post('/attendance/regularization', data),
  approveRegularization: (id) => post(`/attendance/regularization/${id}/approve`),
  rejectRegularization: (id, data) => post(`/attendance/regularization/${id}/reject`, data),
  getPendingRegularizations: () => get('/attendance/regularization/pending'),
  // IP location
  getIpLocation: () => get('/attendance/ip-location'),
};

// ===== LEAVE =====
export const leaveAPI = {
  apply: (data) => post('/leave/apply', data),
  approve: (id) => post(`/leave/${id}/approve`),
  reject: (id, data) => post(`/leave/${id}/reject`, data),
  cancel: (id) => post(`/leave/${id}/cancel`),
  getBalance: (params) => get('/leave/balance', params),
  getBalanceFor: (empId, params) => get(`/leave/balance/${empId}`, params),
  getCalendar: (params) => get('/leave/calendar', params),
  getTeam: (params) => get('/leave/team', params),
  checkConflict: (params) => get('/leave/check-conflict', params),
  // Accrual
  runAccrual: (data) => post('/leave/accrual/run', data),
  runReset: (data) => post('/leave/accrual/reset', data),
  // Encashment
  calculateEncashment: (data) => post('/leave/encashment/calculate', data),
  processEncashment: (data) => post('/leave/encashment/process', data),
  // Comp-off
  creditCompOff: (data) => post('/leave/comp-off/credit', data),
  approveCompOff: (id) => post(`/leave/comp-off/${id}/approve`),
  getCompOffBalance: () => get('/leave/comp-off/balance'),
};

// ===== PAYROLL =====
export const payrollAPI = {
  initialize: (data) => post('/payroll/initialize', data),
  processAll: (id) => post(`/payroll/${id}/process-all`),
  processEmployee: (id, data) => post(`/payroll/${id}/process-employee`, data),
  finalize: (id) => post(`/payroll/${id}/finalize`),
  revert: (id) => post(`/payroll/${id}/revert`),
  getPayslip: (recordId) => get(`/payroll/payslip/${recordId}`),
  getVariance: (params) => get('/payroll/variance', params),
  preChecks: (params) => get('/payroll/pre-checks', params),
  getAnomalies: (id) => get(`/payroll/${id}/anomalies`),
};

// ===== SALARY =====
export const salaryAPI = {
  createTemplate: (data) => post('/salary/templates', data),
  assign: (data) => post('/salary/assign', data),
  revise: (data) => post('/salary/revise', data),
  getHistory: (empId) => get(`/salary/history/${empId}`),
  simulate: (data) => post('/salary/simulate', data),
  getComponents: () => get('/salary/components'),
  createComponent: (data) => post('/salary/components', data),
  getStandard: () => get('/salary/components/standard'),
  getFlexiEligible: () => get('/salary/flexi/eligible'),
  declareFlexi: (data) => post('/salary/flexi/declare', data),
};

// ===== TAX =====
export const taxAPI = {
  calculate: (empId, params) => get(`/tax/calculate/${empId}`, params),
  compareRegimes: (empId, params) => get(`/tax/compare-regimes/${empId}`, params),
  submitDeclaration: (data) => post('/tax/declaration', data),
  submitProof: (data) => post('/tax/proof', data),
  verifyProof: (id, data) => post(`/tax/proof/${id}/verify`, data),
  getHRAExemption: (empId) => get(`/tax/hra-exemption/${empId}`),
  calculatePF: (params) => get('/tax/pf/calculate', params),
  generateECR: (params) => get('/tax/pf/ecr', params),
  calculateESI: (params) => get('/tax/esi/calculate', params),
  calculatePT: (params) => get('/tax/pt/calculate', params),
  getPTSlabs: (state) => get(`/tax/pt/slabs/${state}`),
  calculateGratuity: (empId) => get(`/tax/gratuity/${empId}`),
  calculateLWF: (params) => get('/tax/lwf/calculate', params),
};

// ===== BANKING =====
export const bankingAPI = {
  addAccount: (data) => post('/banking/accounts', data),
  getAccounts: () => get('/banking/accounts'),
  createBatch: (data) => post('/banking/batch', data),
  getNEFT: (id) => get(`/banking/batch/${id}/neft`),
  getStatus: (id) => get(`/banking/batch/${id}/status`),
  retry: (id) => post(`/banking/batch/${id}/retry`),
  razorpayX: (id) => post(`/banking/batch/${id}/razorpayx`),
};

// ===== ESS =====
export const essAPI = {
  getDashboard: () => get('/ess/dashboard'),
  getPayslips: (params) => get('/ess/payslips', params),
  getAttendance: (params) => get('/ess/attendance', params),
  getTaxSummary: (params) => get('/ess/tax-summary', params),
  getHolidays: () => get('/ess/holidays'),
  updateProfile: (data) => put('/ess/profile', data),
  checkIn: (data) => post('/ess/check-in', data),
  checkOut: (data) => post('/ess/check-out', data),
  getTeam: () => get('/ess/my-team'),
  getAnnouncements: () => get('/ess/announcements'),
  raiseRequest: (data) => post('/ess/requests', data),
  getMyRequests: () => get('/ess/my-requests'),
  uploadDocument: (data) => post('/ess/documents/upload', data),
  getDocuments: () => get('/ess/documents'),
};

// ===== ONBOARDING =====
export const onboardingAPI = {
  createChecklist: (data) => post('/onboarding/checklists', data),
  initiate: (empId, data) => post(`/onboarding/initiate/${empId}`, data),
  completeTask: (id) => post(`/onboarding/tasks/${id}/complete`),
  getProgress: (empId) => get(`/onboarding/progress/${empId}`),
  initiateExit: (data) => post('/onboarding/exit/initiate', data),
  approveExit: (id) => post(`/onboarding/exit/${id}/approve`),
  calculateFnF: (empId) => get(`/onboarding/exit/fnf/${empId}`),
  processFnF: (empId) => post(`/onboarding/exit/fnf/${empId}/process`),
  getExitAnalytics: () => get('/onboarding/exit/analytics'),
};

// ===== EXPENSES =====
export const expenseAPI = {
  createReport: (data) => post('/expenses/reports', data),
  addItem: (id, data) => post(`/expenses/reports/${id}/items`, data),
  submit: (id) => post(`/expenses/reports/${id}/submit`),
  approve: (id) => post(`/expenses/reports/${id}/approve`),
  reject: (id) => post(`/expenses/reports/${id}/reject`),
  getMyReports: () => get('/expenses/my-reports'),
  getPending: () => get('/expenses/pending'),
  getAnalytics: () => get('/expenses/analytics'),
  validate: (data) => post('/expenses/validate', data),
};

// ===== APPROVALS =====
export const approvalAPI = {
  getWorkflows: () => get('/approvals/workflows'),
  createWorkflow: (data) => post('/approvals/workflows', data),
  trigger: (data) => post('/approvals/trigger', data),
  action: (id, data) => post(`/approvals/${id}/action`, data),
  getPending: () => get('/approvals/pending'),
  getHistory: (module, recordId) => get(`/approvals/history/${module}/${recordId}`),
};

// ===== REPORTS =====
export const reportAPI = {
  salaryRegister: (params) => get('/reports/salary-register', params),
  attendanceRegister: (params) => get('/reports/attendance-register', params),
  pfRegister: (params) => get('/reports/pf-register', params),
  headcount: () => get('/reports/headcount'),
  attrition: (params) => get('/reports/attrition', params),
  exportExcel: (data) => post('/reports/export/excel', data),
  exportCSV: (data) => post('/reports/export/csv', data),
  exportPDF: (data) => post('/reports/export/pdf', data),
  costTrend: (params) => get('/reports/analytics/cost-trend', params),
  deptCost: (params) => get('/reports/analytics/dept-cost', params),
};

// ===== NOTIFICATIONS =====
export const notificationAPI = {
  getUnread: () => get('/notifications/unread'),
  getAll: (params) => get('/notifications', params),
  markRead: (id) => post(`/notifications/${id}/read`),
  markAllRead: () => post('/notifications/read-all'),
};

// ===== PERFORMANCE =====
export const performanceAPI = {
  createCycle: (data) => post('/performance/cycles', data),
  initializeReviews: (id) => post(`/performance/cycles/${id}/initialize`),
  getStatus: (id) => get(`/performance/cycles/${id}/status`),
  submitSelf: (id, data) => post(`/performance/reviews/${id}/self`, data),
  submitManager: (id, data) => post(`/performance/reviews/${id}/manager`, data),
  getTeam: (cycleId) => get(`/performance/reviews/team/${cycleId}`),
  createGoal: (data) => post('/performance/goals', data),
  updateGoal: (id, data) => put(`/performance/goals/${id}`, data),
  getGoals: () => get('/performance/goals'),
  createOKR: (data) => post('/performance/okrs', data),
  addKeyResult: (id, data) => post(`/performance/okrs/${id}/key-results`, data),
  updateKeyResult: (id, data) => put(`/performance/okrs/key-results/${id}`, data),
};

// ===== RECRUITMENT =====
export const recruitmentAPI = {
  createJob: (data) => post('/recruitment/jobs', data),
  publishJob: (id) => post(`/recruitment/jobs/${id}/publish`),
  addCandidate: (data) => post('/recruitment/candidates', data),
  moveStage: (id, data) => post(`/recruitment/candidates/${id}/move`, data),
  scheduleInterview: (data) => post('/recruitment/interviews', data),
  submitFeedback: (id, data) => post(`/recruitment/interviews/${id}/feedback`, data),
  getPipeline: () => get('/recruitment/pipeline'),
  convert: (id) => post(`/recruitment/candidates/${id}/convert`),
};

// ===== DOCUMENTS =====
export const documentAPI = {
  createTemplate: (data) => post('/documents/templates', data),
  getTemplates: () => get('/documents/templates'),
  preview: (id, data) => post(`/documents/templates/${id}/preview`, data),
  generate: (data) => post('/documents/generate', data),
  getByEmployee: (id) => get(`/documents/employee/${id}`),
  upload: (data) => post('/documents/upload', data),
  verify: (id) => post(`/documents/${id}/verify`),
  getExpiring: (params) => get('/documents/expiring', params),
};

// ===== AI =====
export const aiAPI = {
  anomalies: (payrollRunId) => get(`/ai/anomalies/${payrollRunId}`),
  attritionRisk: () => get('/ai/attrition-risk'),
  chatbot: (data) => post('/ai/chatbot', data),
  runAutomation: () => post('/ai/automation/run'),
};

// ===== INTEGRATIONS =====
export const integrationAPI = {
  tallyExport: (payrollRunId) => get(`/integrations/tally/journal-voucher/${payrollRunId}`),
  slackNotify: (data) => post('/integrations/slack/notify', data),
};

// ===== ANNOUNCEMENTS =====
export const announcementAPI = {
  getAll: (params) => get('/ess/announcements', params),
  create: (data) => post('/ess/announcements', data),
  markRead: (id) => post(`/ess/announcements/${id}/read`),
};

// ===== TEAM =====
export const teamAPI = {
  getMyTeam: () => get('/org/my-team'),
  getTodayStatus: () => get('/attendance/team-today'),
  getStandupLogs: (params) => get('/ess/standup', params),
  addStandupNote: (data) => post('/ess/standup', data),
  getManagerPending: () => get('/approvals/pending'),
};

// ===== REQUESTS =====
export const requestAPI = {
  raise: (data) => post('/approvals/trigger', data),
  getMyRequests: () => get('/approvals/my-requests'),
};

// ===== AUTOMATION =====
export const automationAPI = {
  getStatus: () => get('/automation/status'),
  triggerPayroll: () => post('/automation/trigger/payroll'),
  triggerLeaveAccrual: () => post('/automation/trigger/leave-accrual'),
};

// ===== ENGAGEMENT =====
export const engagementAPI = {
  // Pulse
  submitPulse: (data) => post('/engagement/pulse', data),
  getPulseTrend: () => get('/engagement/pulse/trend'),
  // Kudos / Recognition
  sendKudos: (data) => post('/engagement/kudos', data),
  getKudosFeed: () => get('/engagement/kudos/feed'),
  // Leaderboard
  getLeaderboard: () => get('/engagement/leaderboard'),
  // eNPS
  getENPS: () => get('/engagement/enps'),
  submitENPS: (data) => post('/engagement/enps', data),
  // Mood heatmap
  getMoodHeatmap: () => get('/engagement/mood/heatmap'),
};

// ===== LEARNING & DEVELOPMENT =====
export const lndAPI = {
  // Trainings
  getTrainings: () => get('/lnd/trainings'),
  getMyTrainings: () => get('/lnd/trainings/mine'),
  enrollTraining: (id) => post(`/lnd/trainings/${id}/enroll`),
  completeTraining: (id) => post(`/lnd/trainings/${id}/complete`),
  // Assessments
  getAssessments: () => get('/lnd/assessments'),
  startAssessment: (id) => post(`/lnd/assessments/${id}/start`),
  submitAttempt: (attemptId, data) => post(`/lnd/attempts/${attemptId}/submit`, data),
  // Certificates
  getMyCertificates: () => get('/lnd/certificates/mine'),
  uploadCertificate: (data) => post('/lnd/certificates', data),
  getExpiringCertificates: (params) => get('/lnd/certificates/expiring', params),
};

export default api;
