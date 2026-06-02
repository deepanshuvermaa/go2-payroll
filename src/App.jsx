import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

import Landing from './pages/Landing';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Pages
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/staff/StaffManagement';
import AttendanceTracking from './pages/attendance/AttendanceTracking';
import BreakTimeTracking from './pages/attendance/BreakTimeTracking';
import AutoAbsentMarking from './pages/attendance/AutoAbsentMarking';
import AttendanceRegularization from './pages/attendance/AttendanceRegularization';
import SalaryProcessing from './pages/salary/SalaryProcessing';
import PayrollTemplates from './pages/salary/PayrollTemplates';
import LeaveManagement from './pages/leave/LeaveManagement';
import LeaveAccrual from './pages/leave/LeaveAccrual';
import LeaveCarryForward from './pages/leave/LeaveCarryForward';
import LeaveEncashment from './pages/leave/LeaveEncashment';
import CompOffManagement from './pages/compoff/CompOffManagement';
import AdvanceManagement from './pages/advances/AdvanceManagement';
import LoanManagement from './pages/loans/LoanManagement';
import ReimbursementManagement from './pages/reimbursements/ReimbursementManagement';
import BonusManagement from './pages/bonus/BonusManagement';
import IncentiveManagement from './pages/incentives/IncentiveManagement';
import HolidayCalendar from './pages/holidays/HolidayCalendar';
import RestrictedHolidays from './pages/holidays/RestrictedHolidays';
import ShiftManagement from './pages/shifts/ShiftManagement';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import CurrencySettings from './pages/settings/CurrencySettings';
import TaxManagement from './pages/compliance/TaxManagement';
import StatutoryReports from './pages/compliance/StatutoryReports';
import ComplianceCalendar from './pages/compliance/ComplianceCalendar';
import AuditTrail from './pages/compliance/AuditTrail';
import PayrollAutomation from './pages/automation/PayrollAutomation';
import AdvancedAnalytics from './pages/analytics/AdvancedAnalytics';
import ReportBuilder from './pages/reports/ReportBuilder';
import BankingIntegration from './pages/banking/BankingIntegration';
import WorkLogManagement from './pages/worklog/WorkLogManagement';
import WorkLogDashboard from './pages/worklog/WorkLogDashboard';
import UserManagement from './pages/users/UserManagement';
import ESSPortal from './pages/ess/ESSPortal';
import OnboardingScreen from './pages/onboarding/OnboardingScreen';
import ApprovalInbox from './pages/approvals/ApprovalInbox';
import RecruitmentPipeline from './pages/recruitment/RecruitmentPipeline';
import TeamDashboard from './pages/team/TeamDashboard';
import EmployeeEngagement from './pages/engagement/EmployeeEngagement';
import LearningDevelopment from './pages/lnd/LearningDevelopment';
import AIAssistant from './pages/ai/AIAssistant';
import DocumentGeneration from './pages/documents/DocumentGeneration';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setInitialized(true);
    };
    init();
  }, [initializeAuth]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Go2-Payroll...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2B2B2B',
            color: '#fff',
            borderRadius: '14px',
            padding: '14px 20px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#F3CC4D',
              secondary: '#2B2B2B',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/staff" element={<StaffManagement />} />
                  <Route path="/attendance" element={<AttendanceTracking />} />
                  <Route path="/break-tracking" element={<BreakTimeTracking />} />
                  <Route path="/auto-absent" element={<AutoAbsentMarking />} />
                  <Route path="/attendance-regularization" element={<AttendanceRegularization />} />
                  <Route path="/salary" element={<SalaryProcessing />} />
                  <Route path="/payroll-templates" element={<PayrollTemplates />} />
                  <Route path="/leave" element={<LeaveManagement />} />
                  <Route path="/leave-accrual" element={<LeaveAccrual />} />
                  <Route path="/leave-carry-forward" element={<LeaveCarryForward />} />
                  <Route path="/leave-encashment" element={<LeaveEncashment />} />
                  <Route path="/comp-off" element={<CompOffManagement />} />
                  <Route path="/advances" element={<AdvanceManagement />} />
                  <Route path="/loans" element={<LoanManagement />} />
                  <Route path="/reimbursements" element={<ReimbursementManagement />} />
                  <Route path="/bonus" element={<BonusManagement />} />
                  <Route path="/incentives" element={<IncentiveManagement />} />
                  <Route path="/holidays" element={<HolidayCalendar />} />
                  <Route path="/restricted-holidays" element={<RestrictedHolidays />} />
                  <Route path="/shifts" element={<ShiftManagement />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/currency-settings" element={<CurrencySettings />} />
                  <Route path="/tax-management" element={<TaxManagement />} />
                  <Route path="/statutory-reports" element={<StatutoryReports />} />
                  <Route path="/compliance-calendar" element={<ComplianceCalendar />} />
                  <Route path="/audit-trail" element={<AuditTrail />} />
                  <Route path="/payroll-automation" element={<PayrollAutomation />} />
                  <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
                  <Route path="/report-builder" element={<ReportBuilder />} />
                  <Route path="/banking" element={<BankingIntegration />} />
                  <Route path="/worklog" element={<WorkLogManagement />} />
                  <Route path="/worklog-dashboard" element={<WorkLogDashboard />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/ess" element={<ESSPortal />} />
                  <Route path="/onboarding" element={<OnboardingScreen />} />
                  <Route path="/approvals" element={<ApprovalInbox />} />
                  <Route path="/recruitment" element={<RecruitmentPipeline />} />
                  <Route path="/team-dashboard" element={<TeamDashboard />} />
                  <Route path="/engagement" element={<EmployeeEngagement />} />
                  <Route path="/lnd" element={<LearningDevelopment />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/document-generation" element={<DocumentGeneration />} />
                  {/* 404 catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
