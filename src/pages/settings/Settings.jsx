import React, { useState, useEffect } from 'react';
import { Save, Building, DollarSign, Calendar, Settings as SettingsIcon, User } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import useAuthStore from '../../store/authStore';
import { formatCurrency } from '../../utils/dateHelpers';

const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState({
    company: {
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      gstNumber: '',
      panNumber: '',
    },
    payroll: {
      overtimeRate: 1.5,
      lateMarkPenalty: 100,
      weeklyOffs: ['Sunday'],
      workingHoursPerDay: 8,
      annualLeaveQuota: 12,
      sickLeaveQuota: 7,
      casualLeaveQuota: 12,
      pfRate: 12,
      esiWageLimit: 21000,
      pfBasicLimit: 15000,
    },
    attendance: {
      autoMarkAbsent: true,
      allowLateCheckIn: true,
      lateCheckInThreshold: 15,
      enableOvertime: true,
      requireCheckInOut: false,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = payrollDataStore.getSettings();
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      // Merge with defaults to ensure all fields exist
      setSettings(prev => ({
        company: { ...prev.company, ...(savedSettings.company || {}) },
        payroll: { ...prev.payroll, ...(savedSettings.payroll || {}) },
        attendance: { ...prev.attendance, ...(savedSettings.attendance || {}) },
      }));
    }

    // Set company info from user profile if not already set
    if (user && (!settings.company.name || settings.company.name === '')) {
      setSettings(prev => ({
        ...prev,
        company: {
          ...prev.company,
          name: user.businessName || '',
          email: user.email || '',
          phone: user.phone || '',
        },
      }));
    }
  };

  const handleSave = () => {
    payrollDataStore.updateSettings(settings);
    toast.success('Settings saved successfully');
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      company: { ...settings.company, [name]: value },
    });
  };

  const handlePayrollChange = (e) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      payroll: {
        ...settings.payroll,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      },
    });
  };

  const handleAttendanceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      attendance: {
        ...settings.attendance,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value),
      },
    });
  };

  const handleWeeklyOffChange = (day) => {
    const weeklyOffs = Array.isArray(settings.payroll.weeklyOffs)
      ? [...settings.payroll.weeklyOffs]
      : ['Sunday'];
    const index = weeklyOffs.indexOf(day);

    if (index > -1) {
      weeklyOffs.splice(index, 1);
    } else {
      weeklyOffs.push(day);
    }

    setSettings({
      ...settings,
      payroll: { ...settings.payroll, weeklyOffs },
    });
  };

  const tabs = [
    { id: 'company', name: 'Company Info', icon: Building },
    { id: 'payroll', name: 'Payroll Settings', icon: DollarSign },
    { id: 'attendance', name: 'Attendance Rules', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure payroll system settings</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={20} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={settings.company.name}
                      onChange={handleCompanyChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Address</label>
                    <textarea
                      name="address"
                      className="form-input"
                      rows="3"
                      value={settings.company.address}
                      onChange={handleCompanyChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={settings.company.phone}
                      onChange={handleCompanyChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={settings.company.email}
                      onChange={handleCompanyChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      name="website"
                      className="form-input"
                      value={settings.company.website}
                      onChange={handleCompanyChange}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="form-label">GST Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      className="form-input"
                      value={settings.company.gstNumber}
                      onChange={handleCompanyChange}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>

                  <div>
                    <label className="form-label">PAN Number</label>
                    <input
                      type="text"
                      name="panNumber"
                      className="form-input"
                      value={settings.company.panNumber}
                      onChange={handleCompanyChange}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Settings Tab */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary & Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Overtime Rate (multiplier)</label>
                    <input
                      type="number"
                      name="overtimeRate"
                      className="form-input"
                      value={settings.payroll.overtimeRate}
                      onChange={handlePayrollChange}
                      step="0.1"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {settings.payroll.overtimeRate}x of hourly rate
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Late Mark Penalty (₹)</label>
                    <input
                      type="number"
                      name="lateMarkPenalty"
                      className="form-input"
                      value={settings.payroll.lateMarkPenalty}
                      onChange={handlePayrollChange}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="form-label">PF Rate (%)</label>
                    <input
                      type="number"
                      name="pfRate"
                      className="form-input"
                      value={settings.payroll.pfRate}
                      onChange={handlePayrollChange}
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="form-label">PF Basic Limit (₹)</label>
                    <input
                      type="number"
                      name="pfBasicLimit"
                      className="form-input"
                      value={settings.payroll.pfBasicLimit}
                      onChange={handlePayrollChange}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="form-label">ESI Wage Limit (₹)</label>
                    <input
                      type="number"
                      name="esiWageLimit"
                      className="form-input"
                      value={settings.payroll.esiWageLimit}
                      onChange={handlePayrollChange}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ESI applies if gross salary ≤ {formatCurrency(settings.payroll.esiWageLimit)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Hours & Leave</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Working Hours per Day</label>
                    <input
                      type="number"
                      name="workingHoursPerDay"
                      className="form-input"
                      value={settings.payroll.workingHoursPerDay}
                      onChange={handlePayrollChange}
                      min="1"
                      max="24"
                    />
                  </div>

                  <div>
                    <label className="form-label">Annual Leave Quota</label>
                    <input
                      type="number"
                      name="annualLeaveQuota"
                      className="form-input"
                      value={settings.payroll.annualLeaveQuota}
                      onChange={handlePayrollChange}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="form-label">Sick Leave Quota</label>
                    <input
                      type="number"
                      name="sickLeaveQuota"
                      className="form-input"
                      value={settings.payroll.sickLeaveQuota}
                      onChange={handlePayrollChange}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="form-label">Casual Leave Quota</label>
                    <input
                      type="number"
                      name="casualLeaveQuota"
                      className="form-input"
                      value={settings.payroll.casualLeaveQuota}
                      onChange={handlePayrollChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Offs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <label key={day} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={Array.isArray(settings.payroll.weeklyOffs) && settings.payroll.weeklyOffs.includes(day)}
                        onChange={() => handleWeeklyOffChange(day)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Rules Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Rules</h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="autoMarkAbsent"
                      checked={settings.attendance.autoMarkAbsent}
                      onChange={handleAttendanceChange}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Auto Mark Absent</p>
                      <p className="text-sm text-gray-600">
                        Automatically mark staff as absent if attendance is not marked by end of day
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="allowLateCheckIn"
                      checked={settings.attendance.allowLateCheckIn}
                      onChange={handleAttendanceChange}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Allow Late Check-in</p>
                      <p className="text-sm text-gray-600">
                        Allow employees to check in late with penalty
                      </p>
                    </div>
                  </label>

                  {settings.attendance.allowLateCheckIn && (
                    <div className="ml-8 p-4 bg-gray-50 rounded-lg">
                      <label className="form-label">Late Check-in Threshold (minutes)</label>
                      <input
                        type="number"
                        name="lateCheckInThreshold"
                        className="form-input"
                        value={settings.attendance.lateCheckInThreshold}
                        onChange={handleAttendanceChange}
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Grace period: {settings.attendance.lateCheckInThreshold} minutes
                      </p>
                    </div>
                  )}

                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="enableOvertime"
                      checked={settings.attendance.enableOvertime}
                      onChange={handleAttendanceChange}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Enable Overtime Tracking</p>
                      <p className="text-sm text-gray-600">
                        Track and calculate overtime hours for salary processing
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="requireCheckInOut"
                      checked={settings.attendance.requireCheckInOut}
                      onChange={handleAttendanceChange}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Require Check-in/Check-out</p>
                      <p className="text-sm text-gray-600">
                        Require employees to record check-in and check-out times
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
