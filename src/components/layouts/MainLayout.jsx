import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, DollarSign, FileText, Settings, LogOut, ClipboardList, Wallet, TrendingUp, Receipt, Gift, Target, Clock, Award, Timer, Coffee, AlertCircle, Banknote, CalendarCheck, Layout, Coins, FileEdit, Calculator, FileCheck, Zap, Bell, Shield, BarChart3, FileSpreadsheet, Building2, ChevronDown, ChevronRight, BookOpen, Eye, Search, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const isAdminRole = (user) => {
  const role = (user?.role || '').toLowerCase();
  return ['admin', 'owner', 'org_admin', 'super_admin', 'hr_manager', 'finance_manager'].includes(role);
};

const SidebarGroup = ({ label, icon: Icon, items, currentPath }) => {
  const isChildActive = items.some(item => currentPath === item.path);
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button onClick={() => setOpen(!open)} className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${isChildActive ? 'text-[#2B2B2B] bg-[#F3CC4D]/15' : 'text-[#9C9C9C] hover:text-[#2B2B2B] hover:bg-[#F5F1E6]'}`}>
        <span className="flex items-center gap-2.5">
          <Icon size={15} className={isChildActive ? 'text-[#F3CC4D]' : ''} />
          {label}
        </span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-[#E7E2D8] pl-3">
          {items.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all duration-150 ${isActive ? 'bg-[#F3CC4D]/20 text-[#2B2B2B] font-semibold' : 'text-[#9C9C9C] hover:bg-[#F5F1E6] hover:text-[#2B2B2B]'}`}>
              <item.icon size={13} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const MainLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = [
    { id: 1, text: 'PF ECR filing due in 5 days', time: '2 min ago', type: 'warning' },
    { id: 2, text: 'June payroll processed — ₹24.8L disbursed', time: '1 hour ago', type: 'success' },
    { id: 3, text: '3 new leave applications pending approval', time: '2 hours ago', type: 'info' },
    { id: 4, text: 'Priya Sharma marked attendance late (09:45 AM)', time: '3 hours ago', type: 'info' },
    { id: 5, text: 'ESI challan generated for June', time: 'Yesterday', type: 'success' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      toast('Welcome back! You have 3 pending actions.', { icon: '👋' });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const isAdmin = isAdminRole(user);

  // Employee-only sidebar
  const employeeSidebar = [
    { type: 'link', name: 'My Dashboard', path: '/ess', icon: LayoutDashboard },
    { type: 'link', name: 'My Attendance', path: '/attendance', icon: Calendar },
    { type: 'link', name: 'Apply Leave', path: '/leave', icon: ClipboardList },
    { type: 'link', name: 'My Payslips', path: '/ess', icon: FileText },
    { type: 'link', name: 'Comp-Off', path: '/comp-off', icon: Timer },
    { type: 'link', name: 'Holidays', path: '/holidays', icon: CalendarCheck },
    { type: 'link', name: 'Tax & Declarations', path: '/tax-management', icon: Calculator },
    { type: 'link', name: 'Approvals', path: '/approvals', icon: Bell },
  ];

  // Admin full sidebar
  const sidebarConfig = isAdmin ? [
    { type: 'link', name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { type: 'link', name: 'Approvals', path: '/approvals', icon: Bell },
    { type: 'link', name: 'Staff', path: '/staff', icon: Users },
    { type: 'link', name: 'ESS Portal', path: '/ess', icon: Users },
    { type: 'group', label: 'WorkLog', icon: BookOpen, items: [{ name: 'Staff WorkLog', path: '/worklog', icon: BookOpen }, { name: 'Team Overview', path: '/worklog-dashboard', icon: Eye }] },
    { type: 'group', label: 'Attendance', icon: Calendar, items: [{ name: 'Daily Attendance', path: '/attendance', icon: Calendar }, { name: 'Break Tracking', path: '/break-tracking', icon: Coffee }, { name: 'Auto-Absent', path: '/auto-absent', icon: AlertCircle }, { name: 'Regularization', path: '/attendance-regularization', icon: FileEdit }, { name: 'Shifts', path: '/shifts', icon: Clock }] },
    { type: 'group', label: 'Salary', icon: DollarSign, items: [{ name: 'Salary Processing', path: '/salary', icon: DollarSign }, { name: 'Payroll Templates', path: '/payroll-templates', icon: Layout }] },
    { type: 'group', label: 'Leave', icon: ClipboardList, items: [{ name: 'Leave Management', path: '/leave', icon: ClipboardList }, { name: 'Leave Accrual', path: '/leave-accrual', icon: Award }, { name: 'Carry Forward', path: '/leave-carry-forward', icon: TrendingUp }, { name: 'Encashment', path: '/leave-encashment', icon: Banknote }, { name: 'Comp-Off', path: '/comp-off', icon: Timer }] },
    { type: 'group', label: 'Financial', icon: Wallet, items: [{ name: 'Advances', path: '/advances', icon: TrendingUp }, { name: 'Loans', path: '/loans', icon: Wallet }, { name: 'Reimbursements', path: '/reimbursements', icon: Receipt }, { name: 'Bonus', path: '/bonus', icon: Gift }, { name: 'Incentives', path: '/incentives', icon: Target }] },
    { type: 'group', label: 'Holidays', icon: CalendarCheck, items: [{ name: 'Holiday Calendar', path: '/holidays', icon: Calendar }, { name: 'Restricted Holidays', path: '/restricted-holidays', icon: CalendarCheck }] },
    { type: 'group', label: 'Reports', icon: FileText, items: [{ name: 'Reports', path: '/reports', icon: FileText }, { name: 'Report Builder', path: '/report-builder', icon: FileSpreadsheet }, { name: 'Analytics', path: '/advanced-analytics', icon: BarChart3 }] },
    { type: 'group', label: 'Compliance', icon: Shield, items: [{ name: 'Tax Management', path: '/tax-management', icon: Calculator }, { name: 'Statutory Reports', path: '/statutory-reports', icon: FileCheck }, { name: 'Compliance Calendar', path: '/compliance-calendar', icon: Bell }, { name: 'Audit Trail', path: '/audit-trail', icon: Shield }] },
    { type: 'group', label: 'Operations', icon: Zap, items: [{ name: 'Automation', path: '/payroll-automation', icon: Zap }, { name: 'Banking', path: '/banking', icon: Building2 }, { name: 'Onboarding', path: '/onboarding', icon: Users }] },
    { type: 'group', label: 'Settings', icon: Settings, items: [{ name: 'Settings', path: '/settings', icon: Settings }, { name: 'Currency', path: '/currency-settings', icon: Coins }, { name: 'User Management', path: '/user-management', icon: Users }] },
  ] : employeeSidebar;

  return (
    <div className="flex h-screen" style={{ background: '#F5F1E6' }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-[240px]' : 'w-0 overflow-hidden'} bg-white flex flex-col flex-shrink-0 transition-all duration-300 border-r border-[#E7E2D8]`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#E7E2D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2B2B2B] flex items-center justify-center flex-shrink-0">
              <span className="text-[#F3CC4D] font-bold text-[11px]">G2</span>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-[#2B2B2B] tracking-tight leading-none">Go2-Payroll</h1>
              <p className="text-[10px] text-[#9C9C9C] mt-0.5">{user?.email || 'Admin Panel'}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]">
            <Search size={13} className="text-[#9C9C9C]" />
            <input type="text" placeholder="Search..." className="bg-transparent text-[12px] text-[#2B2B2B] placeholder-[#9C9C9C] outline-none w-full" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {sidebarConfig.map((item) => {
            if (item.type === 'link') {
              return (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${isActive ? 'bg-[#F3CC4D]/15 text-[#2B2B2B] font-semibold' : 'text-[#9C9C9C] hover:text-[#2B2B2B] hover:bg-[#F5F1E6]'}`}>
                  <item.icon size={15} className={currentPath === item.path ? 'text-[#F3CC4D]' : ''} />
                  <span>{item.name}</span>
                  {currentPath === item.path && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F3CC4D]" />}
                </NavLink>
              );
            }
            return <SidebarGroup key={item.label} label={item.label} icon={item.icon} items={item.items} currentPath={currentPath} />;
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-[#E7E2D8]">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3CC4D] to-[#f59e0b] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {(user?.ownerName || user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#2B2B2B] truncate">{user?.ownerName || 'Admin'}</p>
              <p className="text-[10px] text-[#9C9C9C] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-[12px] text-[#9C9C9C] hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm border-b border-[#E7E2D8] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F1E6] transition-colors">
              {sidebarOpen ? <X size={16} className="text-[#9C9C9C]" /> : <Menu size={16} className="text-[#9C9C9C]" />}
            </button>
            <span className="text-[13px] text-[#9C9C9C] font-medium capitalize">{currentPath.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F1E6] transition-colors relative">
                <Bell size={15} className="text-[#9C9C9C]" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F3CC4D] border border-white" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl border border-[#E7E2D8] shadow-xl z-50 animate-slideDown overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E7E2D8] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#2B2B2B]">Notifications</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3CC4D] text-[#2B2B2B] font-bold">{notifications.length}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-[#F5F1E6] hover:bg-[#F5F1E6] transition-colors cursor-pointer">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'success' ? 'bg-emerald-400' : n.type === 'warning' ? 'bg-[#F3CC4D]' : 'bg-[#9C9C9C]'}`} />
                          <div>
                            <p className="text-[12px] text-[#2B2B2B] leading-snug">{n.text}</p>
                            <p className="text-[10px] text-[#9C9C9C] mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 text-center">
                    <button className="text-[11px] font-semibold text-[#2B2B2B] hover:text-[#F3CC4D] transition-colors">View All Notifications</button>
                  </div>
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3CC4D] to-[#f59e0b] flex items-center justify-center text-[10px] font-bold text-white">
              {(user?.ownerName || user?.email || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
