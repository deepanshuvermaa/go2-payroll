import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, Filter, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { LEAVE_TYPES } from '../../constants/config';
import { formatDate } from '../../utils/dateHelpers';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    staffId: '',
    leaveType: '',
    startDate: formatDate(new Date(), 'yyyy-MM-dd'),
    endDate: formatDate(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allLeaves = payrollDataStore.getLeaveApplications();
    setLeaves(allLeaves);

    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);
  };

  const getFilteredLeaves = () => {
    let filtered = [...leaves];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(l => l.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(l => l.leaveType === filterType);
    }

    // Sort by applied date (most recent first)
    filtered.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

    return filtered;
  };

  const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
    return diffDays;
  };

  const handleOpenModal = () => {
    setFormData({
      staffId: '',
      leaveType: '',
      startDate: formatDate(new Date(), 'yyyy-MM-dd'),
      endDate: formatDate(new Date(), 'yyyy-MM-dd'),
      reason: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const staffMember = staff.find(s => s.id === formData.staffId);
    if (!staffMember) {
      toast.error('Please select a staff member');
      return;
    }

    const leaveDays = calculateLeaveDays(formData.startDate, formData.endDate);

    const leaveApplication = {
      staffId: staffMember.id,
      staffName: staffMember.name,
      employeeId: staffMember.employeeId,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      leaveDays,
      reason: formData.reason,
      appliedDate: new Date().toISOString(),
      status: 'pending',
      approvedBy: null,
      approvedDate: null,
      rejectionReason: null,
    };

    const saved = payrollDataStore.addLeaveApplication(leaveApplication);
    if (saved) {
      toast.success('Leave application submitted');
      loadData();
      handleCloseModal();
    }
  };

  const [rejectionModal, setRejectionModal] = useState({ show: false, leave: null, reason: '' });

  const handleApprove = (leave) => {
    const updated = {
      ...leave,
      status: 'approved',
      approvedDate: new Date().toISOString(),
      approvedBy: 'Admin',
    };

    payrollDataStore.updateLeaveApplication(updated);

    // Mark attendance as 'leave' for the leave period
    markLeaveAttendance(leave.staffId, leave.startDate, leave.endDate);

    toast.success(`Leave approved for ${leave.staffName}`);
    loadData();
  };

  const handleReject = (leave) => {
    setRejectionModal({ show: true, leave, reason: '' });
  };

  const confirmReject = () => {
    const { leave, reason } = rejectionModal;
    if (!reason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    const updated = {
      ...leave,
      status: 'rejected',
      rejectionReason: reason,
      approvedDate: new Date().toISOString(),
      approvedBy: 'Admin',
    };

    payrollDataStore.updateLeaveApplication(updated);
    toast.success(`Leave rejected for ${leave.staffName}`);
    setRejectionModal({ show: false, leave: null, reason: '' });
    loadData();
  };

  const markLeaveAttendance = (staffId, startDate, endDate) => {
    const staff = payrollDataStore.getStaffById(staffId);
    if (!staff) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateString = formatDate(date, 'yyyy-MM-dd');
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      // Check if attendance already exists
      const existingAttendance = payrollDataStore.getAttendance(month, year);
      const exists = existingAttendance.find(a => a.staffId === staffId && a.date === dateString);

      if (!exists) {
        payrollDataStore.addAttendance({
          staffId,
          staffName: staff.name,
          date: dateString,
          status: 'leave',
          clockIn: '',
          clockOut: '',
          overtimeHours: 0,
          lateMarks: 0,
          notes: 'Auto-marked from approved leave',
        });
      }
    }
  };

  const getStaffLeaveBalance = (staffId) => {
    const staffLeaves = leaves.filter(l => l.staffId === staffId && l.status === 'approved');
    const totalTaken = staffLeaves.reduce((sum, l) => sum + (l.leaveDays || l.days || 0), 0);
    // Read leave quota from settings instead of hardcoding
    const settings = payrollDataStore.getPayrollSettings();
    const leaveSettings = payrollDataStore.getData(payrollDataStore.STORAGE_KEYS.PAYROLL_SETTINGS);
    const annualLeaveQuota = leaveSettings?.leaveQuota || settings?.leaveQuota || 12;
    return annualLeaveQuota - totalTaken;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage employee leave applications</p>
        </div>
        <button onClick={handleOpenModal} className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Apply Leave
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Filter by Status</label>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="form-label">Filter by Type</label>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {LEAVE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leave Applications List */}
      <div className="space-y-4">
        {getFilteredLeaves().length > 0 ? (
          getFilteredLeaves().map(leave => (
            <div key={leave.id} className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{leave.staffName}</h3>
                      <p className="text-sm text-gray-500">{leave.employeeId}</p>
                    </div>
                    <span className={`badge ${
                      leave.leaveType === 'Sick Leave' ? 'badge-warning' :
                      leave.leaveType === 'Casual Leave' ? 'badge-info' :
                      leave.leaveType === 'Earned Leave' ? 'badge-success' :
                      'badge-secondary'
                    }`}>
                      {leave.leaveType}
                    </span>
                    <span className={`badge ${
                      leave.status === 'approved' ? 'badge-success' :
                      leave.status === 'rejected' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {leave.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Leave Period</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(new Date(leave.startDate), 'MMM dd, yyyy')} - {formatDate(new Date(leave.endDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{leave.leaveDays} day(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Applied On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(new Date(leave.appliedDate), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    {leave.approvedDate && (
                      <div>
                        <p className="text-sm text-gray-600">
                          {leave.status === 'approved' ? 'Approved' : 'Rejected'} On
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(new Date(leave.approvedDate), 'MMM dd, yyyy HH:mm')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">By: {leave.approvedBy}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reason</p>
                    <p className="text-sm text-gray-900">{leave.reason}</p>
                  </div>

                  {leave.rejectionReason && (
                    <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                      <p className="text-sm text-danger-700 font-medium">Rejection Reason:</p>
                      <p className="text-sm text-danger-600 mt-1">{leave.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {leave.status === 'pending' && (
                  <div className="flex items-center gap-2 ml-6">
                    <button
                      onClick={() => handleApprove(leave)}
                      className="btn btn-success flex items-center gap-2"
                    >
                      <Check size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(leave)}
                      className="btn btn-danger flex items-center gap-2"
                    >
                      <X size={18} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No leave applications found</p>
            <p className="text-sm text-gray-500 mt-2">Apply for leave or adjust filters</p>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Apply Leave</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Staff Member *</label>
                <select
                  name="staffId"
                  required
                  className="form-input"
                  value={formData.staffId}
                  onChange={handleInputChange}
                >
                  <option value="">Select Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeId}) - Balance: {getStaffLeaveBalance(s.id)} days
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Leave Type *</label>
                <select
                  name="leaveType"
                  required
                  className="form-input"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  {LEAVE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="form-input"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="form-input"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate}
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="p-3 bg-info-50 border border-info-200 rounded-lg">
                  <p className="text-sm text-info-700">
                    Total Leave Days: {calculateLeaveDays(formData.startDate, formData.endDate)} day(s)
                  </p>
                </div>
              )}

              <div>
                <label className="form-label">Reason *</label>
                <textarea
                  name="reason"
                  required
                  className="form-input"
                  rows="4"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Enter reason for leave..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rejection Reason</h3>
            <textarea
              className="form-input w-full"
              rows="3"
              placeholder="Enter reason for rejection..."
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectionModal({ show: false, leave: null, reason: '' })}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={confirmReject} className="btn btn-danger">
                Reject Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
