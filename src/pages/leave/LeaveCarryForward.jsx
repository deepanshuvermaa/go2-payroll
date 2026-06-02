import React, { useState, useEffect } from 'react';
import { Save, Play, Calendar, TrendingUp, AlertCircle, Settings as SettingsIcon, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatDisplayDate, getCurrentYear } from '../../utils/dateHelpers';

const LeaveCarryForward = () => {
  const [settings, setSettings] = useState(null);
  const [carryForwardRecords, setCarryForwardRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [fromYear, setFromYear] = useState(getCurrentYear() - 1);
  const [toYear, setToYear] = useState(getCurrentYear());
  const [processing, setProcessing] = useState(false);
  const [expandedStaff, setExpandedStaff] = useState({});
  const [activeTab, setActiveTab] = useState('settings'); // settings, process, records

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedSettings = payrollDataStore.getLeaveCarryForwardSettings();
    setSettings(savedSettings);

    const records = payrollDataStore.getLeaveCarryForwardRecords();
    setCarryForwardRecords(records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);
  };

  const handleSettingChange = (leaveType, field, value) => {
    setSettings(prev => ({
      ...prev,
      [leaveType]: {
        ...prev[leaveType],
        [field]: field === 'enabled' ? value : parseInt(value)
      }
    }));
  };

  const handleSaveSettings = () => {
    try {
      payrollDataStore.updateLeaveCarryForwardSettings(settings);
      toast.success('Carry forward settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleProcessCarryForward = () => {
    if (!window.confirm(`Process year-end carry forward from ${fromYear} to ${toYear}? This will create carry forward records for all eligible staff.`)) {
      return;
    }

    setProcessing(true);
    try {
      const result = payrollDataStore.processYearEndCarryForward(fromYear, toYear);

      if (result.success) {
        toast.success(`Processed ${result.processedStaff} staff, ${result.totalDaysCarriedForward} days carried forward`);
        loadData();
        setActiveTab('records');
      } else {
        toast.error('Failed to process carry forward');
      }
    } catch (error) {
      toast.error('Error processing carry forward');
    } finally {
      setProcessing(false);
    }
  };

  const handleExpireOldLeaves = () => {
    if (!window.confirm('This will expire all carry forward leaves past their expiry date. Continue?')) {
      return;
    }

    try {
      const result = payrollDataStore.expireOldCarryForwardLeaves();
      toast.success(`Expired ${result.expiredCount} old carry forward leaves`);
      loadData();
    } catch (error) {
      toast.error('Failed to expire old leaves');
    }
  };

  const toggleStaffExpanded = (staffId) => {
    setExpandedStaff(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const getStaffById = (staffId) => {
    return staff.find(s => s.id === staffId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'used':
        return 'bg-info-100 text-info-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const leaveTypes = [
    { key: 'casualLeave', label: 'Casual Leave', color: 'success' },
    { key: 'sickLeave', label: 'Sick Leave', color: 'warning' },
    { key: 'earnedLeave', label: 'Earned Leave', color: 'info' },
    { key: 'privilegeLeave', label: 'Privilege Leave', color: 'primary' }
  ];

  const stats = {
    totalRecords: carryForwardRecords.length,
    activeRecords: carryForwardRecords.filter(r => r.status === 'active').length,
    totalActiveDays: carryForwardRecords
      .filter(r => r.status === 'active')
      .reduce((sum, r) => sum + r.days, 0),
    expiredRecords: carryForwardRecords.filter(r => r.status === 'expired').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Carry Forward</h1>
        <p className="text-gray-600 mt-1">Manage year-end leave carry forward with configurable expiry rules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircle size={24} className="text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRecords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-info-100 rounded-lg">
              <TrendingUp size={24} className="text-info-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActiveDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiredRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('process')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'process'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Process Carry Forward
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'records'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Records
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Carry Forward Configuration</h3>
          </div>

          <div className="space-y-6">
            {leaveTypes.map(({ key, label, color }) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{label}</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key]?.enabled || false}
                      onChange={(e) => handleSettingChange(key, 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {settings[key]?.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Days to Carry Forward
                      </label>
                      <input
                        type="number"
                        value={settings[key]?.maxDays || 0}
                        onChange={(e) => handleSettingChange(key, 'maxDays', e.target.value)}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry (Months in New Year)
                      </label>
                      <input
                        type="number"
                        value={settings[key]?.expiryMonths || 0}
                        onChange={(e) => handleSettingChange(key, 'expiryMonths', e.target.value)}
                        min="0"
                        max="12"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 border-t">
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Save size={18} />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Tab */}
      {activeTab === 'process' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <Play size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Year-End Processing</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Year
                  </label>
                  <select
                    value={fromYear}
                    onChange={(e) => setFromYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = getCurrentYear() - 4 + i;
                      return (
                        <option key={year} value={year}>{year}</option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Year
                  </label>
                  <select
                    value={toYear}
                    onChange={(e) => setToYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = getCurrentYear() - 3 + i;
                      return (
                        <option key={year} value={year}>{year}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Processing Information:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>System will calculate unused leaves for each staff member from {fromYear}</li>
                      <li>Carry forward will be created based on configured rules and limits</li>
                      <li>Each leave type has separate carry forward limits and expiry dates</li>
                      <li>Expired leaves will be marked automatically based on expiry months</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleProcessCarryForward}
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Play size={18} />
                  {processing ? 'Processing...' : 'Process Carry Forward'}
                </button>

                <button
                  onClick={handleExpireOldLeaves}
                  className="flex items-center gap-2 px-6 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors"
                >
                  <XCircle size={18} />
                  Expire Old Leaves
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Group by Staff */}
          {staff.map(staffMember => {
            const staffRecords = carryForwardRecords.filter(r => r.staffId === staffMember.id);
            if (staffRecords.length === 0) return null;

            const isExpanded = expandedStaff[staffMember.id];
            const activeRecords = staffRecords.filter(r => r.status === 'active');
            const totalActiveDays = activeRecords.reduce((sum, r) => sum + r.days, 0);

            return (
              <div key={staffMember.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 cursor-pointer hover:bg-gray-50" onClick={() => toggleStaffExpanded(staffMember.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{staffMember.name}</h3>
                        <span className="text-sm text-gray-600">({staffMember.employeeId})</span>
                      </div>
                      <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                        <span>Total Records: {staffRecords.length}</span>
                        <span>Active: {activeRecords.length}</span>
                        <span className="font-medium text-success-600">Active Days: {totalActiveDays}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-6 py-4 bg-gray-50">
                    <div className="space-y-3">
                      {staffRecords.map(record => (
                        <div key={record.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-gray-900 capitalize">
                                  {record.leaveType.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                  {record.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Days</p>
                                  <p className="font-medium text-gray-900">{record.days}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">From Year</p>
                                  <p className="font-medium text-gray-900">{record.fromYear}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">For Year</p>
                                  <p className="font-medium text-gray-900">{record.forYear}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Expires On</p>
                                  <p className={`font-medium ${
                                    new Date() > new Date(record.expiryDate) ? 'text-red-600' : 'text-gray-900'
                                  }`}>
                                    {formatDisplayDate(record.expiryDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {carryForwardRecords.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No carry forward records found</p>
              <button
                onClick={() => setActiveTab('process')}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Process Year-End Carry Forward
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveCarryForward;
