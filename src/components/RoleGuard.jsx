import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ROLE_ACCESS = {
  admin: ['all'],
  owner: ['all'],
  hr_manager: ['/dashboard', '/staff', '/attendance', '/break-tracking', '/auto-absent', '/attendance-regularization', '/shifts', '/leave', '/leave-accrual', '/leave-carry-forward', '/leave-encashment', '/comp-off', '/holidays', '/restricted-holidays', '/worklog', '/worklog-dashboard', '/reports', '/report-builder', '/advanced-analytics', '/onboarding', '/user-management', '/settings'],
  finance: ['/dashboard', '/salary', '/payroll-templates', '/advances', '/loans', '/bonus', '/incentives', '/reimbursements', '/tax-management', '/statutory-reports', '/compliance-calendar', '/banking', '/reports', '/report-builder', '/advanced-analytics', '/settings'],
  manager: ['/dashboard', '/staff', '/attendance', '/leave', '/comp-off', '/worklog', '/worklog-dashboard', '/reports', '/advanced-analytics'],
  employee: ['/dashboard', '/ess', '/attendance', '/leave', '/comp-off', '/holidays'],
};

export const RoleGuard = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase() || 'employee';
  if (allowedRoles && !allowedRoles.includes(role) && role !== 'admin' && role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const canAccess = (path) => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const role = user?.role?.toLowerCase() || 'employee';
  if (role === 'admin' || role === 'owner') return true;
  const allowed = ROLE_ACCESS[role] || ROLE_ACCESS.employee;
  if (allowed.includes('all')) return true;
  return allowed.some(p => path.startsWith(p));
};

export const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const role = user?.role?.toLowerCase() || '';
  return role === 'admin' || role === 'owner' || role === 'org_admin' || role === 'super_admin';
};

export const isEmployee = () => !isAdmin();

export default RoleGuard;
