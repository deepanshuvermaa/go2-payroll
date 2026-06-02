import React, { useState, useEffect } from 'react';
import { Save, Play, AlertCircle, Clock, Users, Calendar, CheckCircle, XCircle, Settings, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatDate, formatTime, formatDisplayDate } from '../../utils/dateHelpers';

const AutoAbsentMarking = () => {
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState([]);
  const [autoAbsentLog, setAutoAbsentLog] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [staffWithoutAttendance, setStaffWithoutAttendance] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = () => {
    const savedSettings = payrollDataStore.getAutoAbsentSettings();
    setSettings(savedSettings);

    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);

    const log = payrollDataStore.getAutoAbsentLog();
    setAutoAbsentLog(log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

    // Get staff without attendance for selected date
    const staffWithout = payrollDataStore.getStaffForAutoAbsentNotification(selectedDate);
    setStaffWithoutAttendance(staffWithout);
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleExcludedStaffToggle = (staffId) => {
    setSettings(prev => {
      const excludedStaff = prev.excludedStaff || [];
      const isExcluded = excludedStaff.includes(staffId);

      return {
        ...prev,
        excludedStaff: isExcluded
          ? excludedStaff.filter(id => id !== staffId)
          : [...excludedStaff, staffId]
      };
    });
  };

  const handleSaveSettings = () => {
    try {
      payrollDataStore.updateAutoAbsentSettings(settings);
      toast.success('Auto-absent settings saved successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleRunAutoAbsent = () => {
    if (!window.confirm(`This will mark all staff without attendance on ${formatDisplayDate(selectedDate)} as absent. Continue?`)) {
      return;
    }

    setProcessing(true);
    try {
      const result = payrollDataStore.processAutoAbsentMarking(selectedDate);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      loadData();
    } catch (error) {
      toast.error('Failed to process auto-absent marking');
    } finally {
      setProcessing(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  const currentTime = new Date().toTimeString().slice(0, 5);
  const canRunNow = settings.enabled && currentTime >= settings.cutoffTime;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Auto-Absent Marking</h1>
        <p className="text-gray-600 mt-1">Automatically mark staff as absent if they don't mark attendance by cutoff time</p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 flex items-start gap-3 ${settings.enabled ? 'bg-success-50 border border-success-200' : 'bg-warning-50 border border-warning-200'}`}>
        {settings.enabled ? (
          <CheckCircle size={24} className="text-success-600 flex-shrink-0" />
        ) : (
          <AlertCircle size={24} className="text-warning-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`font-medium ${settings.enabled ? 'text-success-900' : 'text-warning-900'}`}>
            Auto-Absent Marking is {settings.enabled ? 'Enabled' : 'Disabled'}
          </p>
          <p className={`text-sm mt-1 ${settings.enabled ? 'text-success-700' : 'text-warning-700'}`}>
            {settings.enabled
              ? `Staff without attendance will be marked absent after ${formatTime(settings.cutoffTime)}`
              : 'Enable this feature to automatically mark staff as absent'}
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable Auto-Absent Marking</label>
              <p className="text-xs text-gray-600 mt-1">Automatically mark staff as absent based on cutoff time</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Cutoff Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cutoff Time
            </label>
            <input
              type="time"
              value={settings.cutoffTime}
              onChange={(e) => handleSettingChange('cutoffTime', e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-600 mt-1">
              Staff without attendance will be marked absent after this time
            </p>
          </div>

          {/* Notification Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notify Before (minutes)
            </label>
            <input
              type="number"
              value={settings.notifyBeforeMinutes}
              onChange={(e) => handleSettingChange('notifyBeforeMinutes', parseInt(e.target.value))}
              min="0"
              max="120"
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-600 mt-1">
              Send notification to staff before marking them absent
            </p>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.applyToWeekends}
                onChange={(e) => handleSettingChange('applyToWeekends', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-900">Apply to weekends</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.applyToHolidays}
                onChange={(e) => handleSettingChange('applyToHolidays', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-900">Apply to holidays</span>
            </label>
          </div>

          {/* Excluded Staff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Excluded Staff (will not be auto-marked absent)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {staff.map(staffMember => (
                <label key={staffMember.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(settings.excludedStaff || []).includes(staffMember.id)}
                    onChange={() => handleExcludedStaffToggle(staffMember.id)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {staffMember.name} ({staffMember.employeeId})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
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

      {/* Manual Run */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Play size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Manual Processing</h3>
        </div>

        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Staff Without Attendance */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Staff Without Attendance ({staffWithoutAttendance.length})
            </h4>
            {staffWithoutAttendance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {staffWithoutAttendance.map(s => (
                  <div key={s.id} className="flex items-center gap-2 bg-white rounded px-3 py-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{s.name}</span>
                    <span className="text-xs text-gray-500">({s.employeeId})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">All staff have marked attendance for this date</p>
            )}
          </div>

          {/* Run Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleRunAutoAbsent}
              disabled={processing || staffWithoutAttendance.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} />
              {processing ? 'Processing...' : 'Run Auto-Absent Now'}
            </button>

            {!canRunNow && settings.enabled && (
              <div className="flex items-center gap-2 text-sm text-warning-600">
                <Clock size={16} />
                <span>Cutoff time ({formatTime(settings.cutoffTime)}) not reached yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Log */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Processing Log</h3>
        </div>

        <div className="space-y-3">
          {autoAbsentLog.length > 0 ? (
            autoAbsentLog.slice(0, 10).map((log, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDisplayDate(log.date)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Processed at {formatTime(log.processedTime)} (Cutoff: {formatTime(log.cutoffTime)})
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    log.markedAbsentCount > 0
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-success-100 text-success-700'
                  }`}>
                    {log.markedAbsentCount} marked absent
                  </span>
                </div>

                {log.markedStaff && log.markedStaff.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600 mb-2">Marked Staff:</p>
                    <div className="flex flex-wrap gap-2">
                      {log.markedStaff.map((staff, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {staff.name} ({staff.employeeId})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-600">
              <FileText size={48} className="mx-auto text-gray-400 mb-2" />
              <p>No processing log available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoAbsentMarking;
