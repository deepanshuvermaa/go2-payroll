import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Check, X, Settings as SettingsIcon, Calculator, User, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import useAuthStore from '../../store/authStore';
import { formatDisplayDate, formatDate, getCurrentYear } from '../../utils/dateHelpers';

const LeaveEncashment = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState(null);
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeTab, setActiveTab] = useState('requests'); // requests, settings
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Request Form State
  const [requestForm, setRequestForm] = useState({
    staffId: '',
    leaveType: 'casualLeave',
    days: '',
    reason: ''
  });

  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedSettings = payrollDataStore.getLeaveEncashmentSettings();
    setSettings(savedSettings);

    const allRequests = payrollDataStore.getLeaveEncashmentRecords();
    setRequests(allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);
  };

  const handleSettingChange = (leaveType, field, value) => {
    setSettings(prev => ({
      ...prev,
      [leaveType]: {
        ...prev[leaveType],
        [field]: field === 'enabled' ? value : parseFloat(value)
      }
    }));
  };

  const handleSaveSettings = () => {
    try {
      payrollDataStore.updateLeaveEncashmentSettings(settings);
      toast.success('Encashment settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleFormChange = (field, value) => {
    setRequestForm(prev => ({ ...prev, [field]: value }));

    // Auto-calculate amount when days change
    if (field === 'days' || field === 'staffId' || field === 'leaveType') {
      const staffId = field === 'staffId' ? value : requestForm.staffId;
      const leaveType = field === 'leaveType' ? value : requestForm.leaveType;
      const days = field === 'days' ? parseInt(value) : parseInt(requestForm.days);

      if (staffId && leaveType && days > 0) {
        const calc = payrollDataStore.calculateEncashmentAmount(staffId, leaveType, days);
        setCalculation(calc);
      } else {
        setCalculation(null);
      }
    }
  };

  const handleAddRequest = () => {
    // Validation
    if (!requestForm.staffId) {
      toast.error('Please select staff member');
      return;
    }
    if (!requestForm.days || parseInt(requestForm.days) <= 0) {
      toast.error('Please enter valid number of days');
      return;
    }
    if (!requestForm.reason.trim()) {
      toast.error('Please enter reason for encashment');
      return;
    }

    if (!calculation || !calculation.success) {
      toast.error(calculation?.message || 'Unable to calculate encashment amount');
      return;
    }

    try {
      payrollDataStore.addLeaveEncashmentRequest({
        ...requestForm,
        days: parseInt(requestForm.days),
        requestedAmount: calculation.amount,
        dailyRate: calculation.dailyRate
      });

      toast.success('Leave encashment request submitted successfully');
      loadData();
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const handleApprove = (requestId) => {
    if (window.confirm('Approve this encashment request?')) {
      try {
        const result = payrollDataStore.approveEncashmentRequest(requestId, user?.email || 'Admin');
        if (result.success) {
          toast.success(`Request approved for Rs. ${result.amount}`);
          loadData();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Failed to approve request');
      }
    }
  };

  const handleReject = (requestId) => {
    if (window.confirm('Reject this encashment request?')) {
      try {
        payrollDataStore.updateLeaveEncashmentRequest(requestId, {
          status: 'rejected',
          rejectedBy: user?.email || 'Admin',
          rejectedAt: new Date().toISOString()
        });
        toast.success('Request rejected');
        loadData();
      } catch (error) {
        toast.error('Failed to reject request');
      }
    }
  };

  const handleProcess = (requestId) => {
    if (window.confirm('Mark this request as processed/paid?')) {
      try {
        const result = payrollDataStore.processEncashmentRequest(requestId, user?.email || 'Admin');
        if (result.success) {
          toast.success('Request marked as processed');
          loadData();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Failed to process request');
      }
    }
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setRequestForm({
      staffId: '',
      leaveType: 'casualLeave',
      days: '',
      reason: ''
    });
    setCalculation(null);
  };

  const toggleExpanded = (requestId) => {
    setExpandedRequest(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const getStaffById = (staffId) => {
    return staff.find(s => s.id === staffId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'approved':
        return 'bg-success-100 text-success-700';
      case 'processed':
        return 'bg-info-100 text-info-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toLocaleString('en-IN') || 0}`;
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const leaveTypes = [
    { key: 'casualLeave', label: 'Casual Leave' },
    { key: 'earnedLeave', label: 'Earned Leave' },
    { key: 'privilegeLeave', label: 'Privilege Leave' }
  ];

  const filteredRequests = selectedStatus === 'all'
    ? requests
    : requests.filter(r => r.status === selectedStatus);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    processed: requests.filter(r => r.status === 'processed').length,
    totalAmount: requests
      .filter(r => r.status === 'processed')
      .reduce((sum, r) => sum + (r.approvedAmount || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Encashment</h1>
          <p className="text-gray-600 mt-1">Convert unused leave days into cash payment</p>
        </div>
        {activeTab === 'requests' && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            New Request
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <User size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Calculator size={24} className="text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success-100 rounded-lg">
              <Check size={24} className="text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-info-100 rounded-lg">
              <DollarSign size={24} className="text-info-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <DollarSign size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Requests
        </button>
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
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'processed', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredRequests.map(request => {
              const staffMember = getStaffById(request.staffId);
              const isExpanded = expandedRequest[request.id];
              const leaveTypeLabel = leaveTypes.find(lt => lt.key === request.leaveType)?.label || request.leaveType;

              return (
                <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {staffMember?.name || 'Unknown Staff'}
                          </h3>
                          <span className="text-sm text-gray-600">({staffMember?.employeeId})</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-600">Leave Type</p>
                            <p className="font-medium text-gray-900">{leaveTypeLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Days</p>
                            <p className="font-medium text-gray-900">{request.days}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Requested Amount</p>
                            <p className="font-medium text-success-600">{formatCurrency(request.requestedAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Requested On</p>
                            <p className="font-medium text-gray-900">{formatDisplayDate(request.createdAt)}</p>
                          </div>
                        </div>

                        {request.approvedAmount && (
                          <div className="mt-3 p-3 bg-success-50 rounded-lg">
                            <p className="text-sm font-medium text-success-900">
                              Approved Amount: {formatCurrency(request.approvedAmount)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-success-100 text-success-700 rounded-lg hover:bg-success-200 transition-colors text-sm"
                            >
                              <Check size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            >
                              <X size={16} />
                              Reject
                            </button>
                          </>
                        )}

                        {request.status === 'approved' && (
                          <button
                            onClick={() => handleProcess(request.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-info-100 text-info-700 rounded-lg hover:bg-info-200 transition-colors text-sm"
                          >
                            <DollarSign size={16} />
                            Mark Processed
                          </button>
                        )}

                        <button
                          onClick={() => toggleExpanded(request.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Reason</p>
                            <p className="font-medium text-gray-900">{request.reason}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Daily Rate</p>
                            <p className="font-medium text-gray-900">{formatCurrency(request.dailyRate)}</p>
                          </div>
                          {request.approvedBy && (
                            <div>
                              <p className="text-gray-600">Approved By</p>
                              <p className="font-medium text-gray-900">{request.approvedBy}</p>
                              <p className="text-xs text-gray-500">{formatDisplayDate(request.approvedAt)}</p>
                            </div>
                          )}
                          {request.processedBy && (
                            <div>
                              <p className="text-gray-600">Processed By</p>
                              <p className="font-medium text-gray-900">{request.processedBy}</p>
                              <p className="text-xs text-gray-500">{formatDisplayDate(request.processedAt)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calculator size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No encashment requests found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Encashment Configuration</h3>
          </div>

          <div className="space-y-6">
            {leaveTypes.map(({ key, label }) => (
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate Per Day
                      </label>
                      <input
                        type="number"
                        value={settings[key]?.ratePerDay || 1}
                        onChange={(e) => handleSettingChange(key, 'ratePerDay', e.target.value)}
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Multiplier of daily salary</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Days Required
                      </label>
                      <input
                        type="number"
                        value={settings[key]?.minDaysRequired || 0}
                        onChange={(e) => handleSettingChange(key, 'minDaysRequired', e.target.value)}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Days Per Year
                      </label>
                      <input
                        type="number"
                        value={settings[key]?.maxDaysPerYear || 0}
                        onChange={(e) => handleSettingChange(key, 'maxDaysPerYear', e.target.value)}
                        min="0"
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

      {/* Add Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">New Encashment Request</h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Member *
                </label>
                <select
                  value={requestForm.staffId}
                  onChange={(e) => handleFormChange('staffId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select staff member</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type & Days */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type *
                  </label>
                  <select
                    value={requestForm.leaveType}
                    onChange={(e) => handleFormChange('leaveType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {leaveTypes.map(lt => (
                      <option key={lt.key} value={lt.key} disabled={!settings[lt.key]?.enabled}>
                        {lt.label} {!settings[lt.key]?.enabled && '(Disabled)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Days *
                  </label>
                  <input
                    type="number"
                    value={requestForm.days}
                    onChange={(e) => handleFormChange('days', e.target.value)}
                    min="1"
                    placeholder="e.g., 10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Calculation Result */}
              {calculation && (
                <div className={`p-4 rounded-lg ${calculation.success ? 'bg-success-50 border border-success-200' : 'bg-red-50 border border-red-200'}`}>
                  {calculation.success ? (
                    <div>
                      <p className="font-medium text-success-900 mb-2">Encashment Calculation:</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-success-700">Daily Rate:</p>
                          <p className="font-bold text-success-900">{formatCurrency(calculation.dailyRate)}</p>
                        </div>
                        <div>
                          <p className="text-success-700">Days:</p>
                          <p className="font-bold text-success-900">{calculation.days}</p>
                        </div>
                        <div>
                          <p className="text-success-700">Total Amount:</p>
                          <p className="font-bold text-success-900 text-lg">{formatCurrency(calculation.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-900">{calculation.message}</p>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  placeholder="Reason for leave encashment"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRequest}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={18} />
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveEncashment;
