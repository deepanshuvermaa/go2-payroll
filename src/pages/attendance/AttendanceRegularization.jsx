import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import useAuthStore from '../../store/authStore';

const AttendanceRegularization = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const [requestForm, setRequestForm] = useState({
    staffId: '',
    date: '',
    reason: '',
    checkIn: '',
    checkOut: '',
    remarks: ''
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [filterStatus, selectedMonth, selectedYear]);

  const loadData = () => {
    const allRequests = payrollDataStore.getAttendanceRegularizationRequests();
    const filtered = filterStatus === 'all'
      ? allRequests
      : allRequests.filter(r => r.status === filterStatus);
    setRequests(filtered);

    const regSettings = payrollDataStore.getAttendanceRegularizationSettings();
    setSettings(regSettings);

    const allStaff = payrollDataStore.getStaff();
    setStaff(allStaff);

    const stats = payrollDataStore.getRegularizationStatistics(selectedMonth, selectedYear);
    setStatistics(stats);
  };

  const handleSubmitRequest = () => {
    if (!requestForm.staffId || !requestForm.date || !requestForm.reason) {
      toast.error('Staff, date, and reason are required');
      return;
    }

    const result = payrollDataStore.submitRegularizationRequest(requestForm);

    if (result.success) {
      toast.success('Regularization request submitted');
      setRequestForm({
        staffId: '',
        date: '',
        reason: '',
        checkIn: '',
        checkOut: '',
        remarks: ''
      });
      setShowForm(false);
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleApprove = (requestId) => {
    const result = payrollDataStore.approveRegularizationRequest(requestId, user?.email);

    if (result.success) {
      toast.success('Request approved and attendance updated');
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleReject = (requestId) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;

    const result = payrollDataStore.rejectRegularizationRequest(requestId, user?.email, reason);

    if (result.success) {
      toast.success('Request rejected');
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleUpdateSettings = () => {
    payrollDataStore.updateAttendanceRegularizationSettings(settings);
    toast.success('Settings updated');
    loadData();
  };

  const getStaffName = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Regularization</h1>
          <p className="text-gray-600 mt-1">Manage attendance correction requests</p>
        </div>
        <div className="flex gap-3">
          <select
            value={`${selectedMonth}-${selectedYear}`}
            onChange={(e) => {
              const [month, year] = e.target.value.split('-');
              setSelectedMonth(parseInt(month));
              setSelectedYear(parseInt(year));
            }}
            className="input"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(selectedYear, selectedMonth - 6 + i);
              return (
                <option key={i} value={`${date.getMonth()}-${date.getFullYear()}`}>
                  {date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => {
              setRequestForm({
                staffId: '',
                date: '',
                reason: '',
                checkIn: '',
                checkOut: '',
                remarks: ''
              });
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            New Request
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{statistics.pending}</p>
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
                <p className="text-2xl font-bold text-gray-900">{statistics.approved}</p>
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
                <p className="text-2xl font-bold text-gray-900">{statistics.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['requests', 'settings', 'analytics'].map((tab) => (
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

      {/* Request Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Submit Regularization Request</h3>

          <div className="space-y-4">
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
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  className="input"
                  value={requestForm.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Reason *</label>
                <select
                  className="input"
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                >
                  <option value="">Select Reason</option>
                  {settings?.allowReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Check-In Time</label>
                <input
                  type="time"
                  className="input"
                  value={requestForm.checkIn}
                  onChange={(e) => setRequestForm({ ...requestForm, checkIn: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Check-Out Time</label>
                <input
                  type="time"
                  className="input"
                  value={requestForm.checkOut}
                  onChange={(e) => setRequestForm({ ...requestForm, checkOut: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Remarks</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Additional details"
                  value={requestForm.remarks}
                  onChange={(e) => setRequestForm({ ...requestForm, remarks: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSubmitRequest} className="btn-primary">
                Submit Request
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input max-w-xs"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="card">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Staff</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Check-In</th>
                  <th className="text-left py-3 px-4">Check-Out</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Submitted</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{getStaffName(request.staffId)}</td>
                      <td className="py-3 px-4">{new Date(request.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">{request.reason}</td>
                      <td className="py-3 px-4">{request.checkIn || '-'}</td>
                      <td className="py-3 px-4">{request.checkOut || '-'}</td>
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
                      <td className="py-3 px-4 text-sm">
                        {new Date(request.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1"
                            >
                              <CheckCircle size={16} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                              <XCircle size={16} /> Reject
                            </button>
                          </div>
                        )}
                        {request.status === 'approved' && (
                          <span className="text-sm text-gray-600">
                            By: {request.approvedBy}
                          </span>
                        )}
                        {request.status === 'rejected' && request.rejectionReason && (
                          <span className="text-sm text-red-600" title={request.rejectionReason}>
                            {request.rejectionReason.substring(0, 20)}...
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
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Regularization Settings</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="label">Enable Regularization</label>
                <p className="text-sm text-gray-600">Allow staff to submit regularization requests</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="label">Require Approval</label>
                <p className="text-sm text-gray-600">All requests need manager approval</p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="label">Max Days in Past</label>
              <input
                type="number"
                className="input max-w-xs"
                value={settings.maxDaysInPast}
                onChange={(e) => setSettings({ ...settings, maxDaysInPast: parseInt(e.target.value) })}
                min="1"
                max="30"
              />
              <p className="text-sm text-gray-600 mt-1">
                Staff can regularize attendance for last N days
              </p>
            </div>

            <div>
              <label className="label">Allowed Reasons</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.allowReasons.map((reason, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="label">Require Proof</label>
                <p className="text-sm text-gray-600">Require document/proof attachment (Future)</p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireProof}
                onChange={(e) => setSettings({ ...settings, requireProof: e.target.checked })}
                className="w-5 h-5"
                disabled
              />
            </div>

            <button onClick={handleUpdateSettings} className="btn-primary">
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && statistics && (
        <div className="space-y-6">
          {/* By Reason */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Requests by Reason</h3>
            <div className="space-y-3">
              {Object.entries(statistics.byReason).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-gray-700">{reason}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(count / statistics.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Staff */}
          {statistics.topStaff.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                Top Regularization Requesters
              </h3>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Staff</th>
                    <th className="text-right py-3 px-4">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.topStaff.map((s, index) => (
                    <tr key={s.staffId} className="border-b">
                      <td className="py-3 px-4">
                        <span className="font-medium">{index + 1}. {s.name}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceRegularization;
