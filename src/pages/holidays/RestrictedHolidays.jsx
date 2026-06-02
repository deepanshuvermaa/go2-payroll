import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Settings, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import useAuthStore from '../../store/authStore';

const RestrictedHolidays = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('holidays');
  const [holidays, setHolidays] = useState([]);
  const [requests, setRequests] = useState([]);
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Forms
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', description: '' });
  const [requestForm, setRequestForm] = useState({ staffId: '', date: '', reason: '' });
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, [selectedYear, filterStatus]);

  const loadData = () => {
    const rhHolidays = payrollDataStore.getRestrictedHolidaysByYear(selectedYear);
    setHolidays(rhHolidays);

    const allRequests = payrollDataStore.getRestrictedHolidayRequests();
    const filtered = filterStatus === 'all'
      ? allRequests
      : allRequests.filter(r => r.status === filterStatus);
    setRequests(filtered);

    const rhSettings = payrollDataStore.getRestrictedHolidaysSettings();
    setSettings(rhSettings);

    const allStaff = payrollDataStore.getStaff();
    setStaff(allStaff);

    const stats = payrollDataStore.getRestrictedHolidayStatistics(selectedYear);
    setStatistics(stats);
  };

  // Holiday Management
  const handleAddHoliday = () => {
    if (!holidayForm.name || !holidayForm.date) {
      toast.error('Name and date are required');
      return;
    }

    if (editingHoliday) {
      const updated = payrollDataStore.updateRestrictedHoliday({
        ...editingHoliday,
        ...holidayForm
      });
      if (updated) {
        toast.success('Restricted holiday updated');
      }
    } else {
      const added = payrollDataStore.addRestrictedHoliday(holidayForm);
      if (added) {
        toast.success('Restricted holiday added');
      }
    }

    setHolidayForm({ name: '', date: '', description: '' });
    setEditingHoliday(null);
    setShowHolidayForm(false);
    loadData();
  };

  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      date: holiday.date,
      description: holiday.description || ''
    });
    setShowHolidayForm(true);
  };

  const handleDeleteHoliday = (id) => {
    if (window.confirm('Delete this restricted holiday?')) {
      payrollDataStore.deleteRestrictedHoliday(id);
      toast.success('Restricted holiday deleted');
      loadData();
    }
  };

  // Request Management
  const handleAddRequest = () => {
    if (!requestForm.staffId || !requestForm.date) {
      toast.error('Staff and date are required');
      return;
    }

    const result = payrollDataStore.addRestrictedHolidayRequest(requestForm);

    if (result.success) {
      toast.success('Request submitted successfully');
      setRequestForm({ staffId: '', date: '', reason: '' });
      setShowRequestForm(false);
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleApproveRequest = (requestId) => {
    const result = payrollDataStore.approveRestrictedHolidayRequest(requestId, user?.email);

    if (result.success) {
      toast.success('Request approved');
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleRejectRequest = (requestId) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;

    const result = payrollDataStore.rejectRestrictedHolidayRequest(requestId, user?.email, reason);

    if (result.success) {
      toast.success('Request rejected');
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  // Settings Management
  const handleUpdateSettings = () => {
    payrollDataStore.updateRestrictedHolidaysSettings(settings);
    toast.success('Settings updated');
    loadData();
  };

  const getStaffName = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'Unknown';
  };

  const getHolidayName = (date) => {
    const holiday = holidays.find(h => h.date === date);
    return holiday ? holiday.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restricted Holidays</h1>
          <p className="text-gray-600 mt-1">Manage restricted holidays and staff requests</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total RH Days</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalRestrictedHolidays}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.approvedRequests}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.rejectedRequests}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['holidays', 'requests', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Restricted Holidays for {selectedYear}</h2>
            <button
              onClick={() => {
                setEditingHoliday(null);
                setHolidayForm({ name: '', date: '', description: '' });
                setShowHolidayForm(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Holiday
            </button>
          </div>

          {showHolidayForm && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                {editingHoliday ? 'Edit' : 'Add'} Restricted Holiday
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Holiday Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Holi, Diwali"
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Optional description"
                    value={holidayForm.description}
                    onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAddHoliday} className="btn-primary">
                  {editingHoliday ? 'Update' : 'Add'} Holiday
                </button>
                <button
                  onClick={() => {
                    setShowHolidayForm(false);
                    setEditingHoliday(null);
                    setHolidayForm({ name: '', date: '', description: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Holiday Name</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Day</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No restricted holidays for {selectedYear}
                    </td>
                  </tr>
                ) : (
                  holidays.map((holiday) => (
                    <tr key={holiday.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{holiday.name}</td>
                      <td className="py-3 px-4">{new Date(holiday.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">
                        {new Date(holiday.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{holiday.description || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditHoliday(holiday)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <h2 className="text-xl font-semibold">RH Requests</h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input py-1"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button
              onClick={() => {
                setRequestForm({ staffId: '', date: '', reason: '' });
                setShowRequestForm(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              New Request
            </button>
          </div>

          {showRequestForm && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Submit RH Request</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Staff *</label>
                  <select
                    className="input"
                    value={requestForm.staffId}
                    onChange={(e) => setRequestForm({ ...requestForm, staffId: e.target.value })}
                  >
                    <option value="">Select Staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Restricted Holiday *</label>
                  <select
                    className="input"
                    value={requestForm.date}
                    onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                  >
                    <option value="">Select RH Date</option>
                    {holidays.map((h) => (
                      <option key={h.id} value={h.date}>
                        {h.name} - {new Date(h.date).toLocaleDateString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Reason</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Optional reason"
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAddRequest} className="btn-primary">
                  Submit Request
                </button>
                <button
                  onClick={() => {
                    setShowRequestForm(false);
                    setRequestForm({ staffId: '', date: '', reason: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Staff</th>
                  <th className="text-left py-3 px-4">Holiday</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Requested On</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{getStaffName(request.staffId)}</td>
                      <td className="py-3 px-4">{getHolidayName(request.date)}</td>
                      <td className="py-3 px-4">{new Date(request.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(request.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1"
                            >
                              <CheckCircle size={16} /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                              <XCircle size={16} /> Reject
                            </button>
                          </div>
                        )}
                        {request.status === 'rejected' && request.rejectionReason && (
                          <span className="text-sm text-gray-600" title={request.rejectionReason}>
                            Reason: {request.rejectionReason.substring(0, 20)}...
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Restricted Holiday Settings</h2>

          <div className="card">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label">Enable Restricted Holidays</label>
                  <p className="text-sm text-gray-600">Allow staff to request restricted holidays</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div>
                <label className="label">Maximum RH Days Per Staff (Per Year)</label>
                <input
                  type="number"
                  className="input max-w-xs"
                  value={settings.maxDaysPerStaff}
                  onChange={(e) => setSettings({ ...settings, maxDaysPerStaff: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Each staff can avail up to this many restricted holidays per year
                </p>
              </div>

              <div>
                <label className="label">Advance Notice Days</label>
                <input
                  type="number"
                  className="input max-w-xs"
                  value={settings.advanceNoticeDays}
                  onChange={(e) => setSettings({ ...settings, advanceNoticeDays: parseInt(e.target.value) })}
                  min="0"
                  max="30"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Minimum days in advance staff must request RH
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="label">Require Approval</label>
                  <p className="text-sm text-gray-600">All RH requests need manager approval</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="label">Allow Carry Forward</label>
                  <p className="text-sm text-gray-600">Allow unused RH days to carry forward to next year</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowCarryForward}
                  onChange={(e) => setSettings({ ...settings, allowCarryForward: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={handleUpdateSettings} className="btn-primary">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictedHolidays;
