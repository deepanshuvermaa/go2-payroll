import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, TrendingDown, AlertCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import payrollDataStore from '../services/payrollDataStore';
import { formatCurrency, formatDate, getCurrentMonthYear, getPreviousMonthYear } from '../utils/dateHelpers';
import { calculateNetSalary, calculateEarnings, calculateDeductions } from '../utils/salaryCalculations';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    presentToday: 0,
    monthlyPayroll: 0,
    pendingLeaves: 0,
    avgSalary: 0,
  });
  const [salaryTrend, setSalaryTrend] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Get all staff
    const allStaff = payrollDataStore.getStaff();
    const activeStaff = allStaff.filter(s => s.status === 'active');

    // Get current month attendance
    const { month, year } = getCurrentMonthYear();
    const todayDate = formatDate(new Date(), 'yyyy-MM-dd');
    const attendance = payrollDataStore.getAttendance(month, year);
    const todayAttendance = attendance.filter(a => a.date === todayDate);
    const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'halfDay').length;

    // Get salary records
    const salaryRecords = payrollDataStore.getSalaryRecords(month, year);
    const monthlyPayroll = salaryRecords.reduce((sum, record) => sum + record.netSalary, 0);

    // Get pending leaves
    const leaves = payrollDataStore.getLeaveApplications();
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

    // Calculate average salary
    const avgSalary = activeStaff.length > 0
      ? activeStaff.reduce((sum, s) => sum + (s.salary?.basic || 0), 0) / activeStaff.length
      : 0;

    setStats({
      totalStaff: allStaff.length,
      activeStaff: activeStaff.length,
      presentToday,
      monthlyPayroll,
      pendingLeaves,
      avgSalary,
    });

    // Generate salary trend (last 6 months)
    generateSalaryTrend();

    // Generate department stats
    generateDepartmentStats(activeStaff);

    // Generate recent activity
    generateRecentActivity(salaryRecords, leaves, attendance);
  };

  const generateSalaryTrend = () => {
    const trend = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const records = payrollDataStore.getSalaryRecords(month, year);
      const total = records.reduce((sum, r) => sum + r.netSalary, 0);

      trend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: total,
      });
    }

    setSalaryTrend(trend);
  };

  const generateDepartmentStats = (staff) => {
    const deptMap = {};
    staff.forEach(s => {
      const dept = s.department || 'Other';
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, count: 0, totalSalary: 0 };
      }
      deptMap[dept].count++;
      deptMap[dept].totalSalary += s.salary?.basic || 0;
    });

    setDepartmentStats(Object.values(deptMap));
  };

  const generateRecentActivity = (salaryRecords, leaves, attendance) => {
    const activities = [];

    // Recent salary processed
    salaryRecords.slice(-3).forEach(record => {
      activities.push({
        type: 'salary',
        message: `Salary processed for ${record.staffName}`,
        time: record.processedDate,
        icon: DollarSign,
        color: 'text-success-600',
      });
    });

    // Recent leave applications
    leaves.slice(-3).forEach(leave => {
      activities.push({
        type: 'leave',
        message: `Leave ${leave.status} for ${leave.staffName}`,
        time: leave.appliedDate,
        icon: Calendar,
        color: 'text-warning-600',
      });
    });

    // Sort by time (most recent first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    setRecentActivity(activities.slice(0, 5));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Payroll Management Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Staff */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Staff</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStaff}</p>
              <p className="text-sm text-success-600 mt-2">
                {stats.activeStaff} active
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Users className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Present Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats.presentToday}</p>
              <p className="text-sm text-gray-500 mt-2">
                {stats.activeStaff > 0
                  ? `${Math.round((stats.presentToday / stats.activeStaff) * 100)}% attendance`
                  : 'No staff'}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <Calendar className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Payroll</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyPayroll)}</p>
              <p className="text-sm text-gray-500 mt-2">Current month</p>
            </div>
            <div className="w-12 h-12 bg-info-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-info-600" size={24} />
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Leaves</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingLeaves}</p>
              <p className="text-sm text-warning-600 mt-2">Requires action</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-warning-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Trend Chart */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Trend (Last 6 Months)</h3>
          {salaryTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salaryTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No salary data available
            </div>
          )}
        </div>

        {/* Department Stats */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff by Department</h3>
          {departmentStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No department data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                  <activity.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(new Date(activity.time), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
