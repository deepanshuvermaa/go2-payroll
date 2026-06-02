import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Calendar, Clock, User, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatDate, formatDisplayDate, getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';

const CompOffManagement = () => {
  const [compOffs, setCompOffs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, pending, approved, used, expired
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCompOff, setExpandedCompOff] = useState({});

  // Add Form State
  const [compOffForm, setCompOffForm] = useState({
    staffId: '',
    workDate: '',
    hoursWorked: '',
    reason: '',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCompOffs(payrollDataStore.getCompOffs());
    setStaff(payrollDataStore.getStaff().filter(s => s.status === 'active'));
  };

  const handleFormChange = (field, value) => {
    setCompOffForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCompOff = () => {
    // Validation
    if (!compOffForm.staffId) {
      toast.error('Please select staff member');
      return;
    }
    if (!compOffForm.workDate) {
      toast.error('Please select work date');
      return;
    }
    if (!compOffForm.hoursWorked || parseFloat(compOffForm.hoursWorked) <= 0) {
      toast.error('Please enter valid hours worked');
      return;
    }
    if (!compOffForm.reason.trim()) {
      toast.error('Please enter reason for comp-off');
      return;
    }

    try {
      // Calculate comp-off days based on hours (8 hours = 1 day)
      const daysEarned = parseFloat(compOffForm.hoursWorked) / 8;

      payrollDataStore.addCompOff({
        ...compOffForm,
        hoursWorked: parseFloat(compOffForm.hoursWorked),
        daysEarned: parseFloat(daysEarned.toFixed(2))
      });

      toast.success('Comp-off request added successfully');
      loadData();
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to add comp-off request');
    }
  };

  const handleApproveCompOff = (compOffId) => {
    if (window.confirm('Are you sure you want to approve this comp-off request?')) {
      try {
        // approveCompOff expects (id, expiryDays) — pass 90 days
        payrollDataStore.approveCompOff(compOffId, 90);
        toast.success('Comp-off approved successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to approve comp-off');
      }
    }
  };

  const handleRejectCompOff = (compOffId) => {
    if (window.confirm('Are you sure you want to reject this comp-off request?')) {
      try {
        const compOff = compOffs.find(c => c.id === compOffId);
        if (compOff) {
          const updated = { ...compOff, status: 'rejected' };
          const allCompOffs = compOffs.map(c => c.id === compOffId ? updated : c);
          payrollDataStore.setData(payrollDataStore.STORAGE_KEYS.COMP_OFFS, allCompOffs);
          toast.success('Comp-off rejected');
          loadData();
        }
      } catch (error) {
        toast.error('Failed to reject comp-off');
      }
    }
  };

  const handleUseCompOff = (compOffId) => {
    const usageDate = prompt('Enter usage date (YYYY-MM-DD):');
    if (!usageDate) return;

    try {
      payrollDataStore.useCompOff(compOffId, usageDate);
      toast.success('Comp-off marked as used');
      loadData();
    } catch (error) {
      toast.error('Failed to mark comp-off as used');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setCompOffForm({
      staffId: '',
      workDate: '',
      hoursWorked: '',
      reason: '',
      remarks: ''
    });
  };

  const toggleExpanded = (compOffId) => {
    setExpandedCompOff(prev => ({
      ...prev,
      [compOffId]: !prev[compOffId]
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
      case 'used':
        return 'bg-info-100 text-info-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const checkExpiry = (compOff) => {
    if (compOff.status === 'approved' && compOff.expiryDate) {
      const today = new Date();
      const expiry = new Date(compOff.expiryDate);
      return today > expiry;
    }
    return false;
  };

  const filteredCompOffs = compOffs
    .filter(compOff => {
      // Status filter
      if (selectedStatus !== 'all' && compOff.status !== selectedStatus) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const staffMember = getStaffById(compOff.staffId);
        const searchLower = searchTerm.toLowerCase();
        return (
          staffMember?.name.toLowerCase().includes(searchLower) ||
          staffMember?.employeeId.toLowerCase().includes(searchLower) ||
          compOff.reason.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = {
    total: compOffs.length,
    pending: compOffs.filter(c => c.status === 'pending').length,
    approved: compOffs.filter(c => c.status === 'approved').length,
    used: compOffs.filter(c => c.status === 'used').length,
    totalDaysEarned: compOffs
      .filter(c => c.status === 'approved' || c.status === 'used')
      .reduce((sum, c) => sum + (c.daysEarned || 0), 0),
    totalDaysUsed: compOffs
      .filter(c => c.status === 'used')
      .reduce((sum, c) => sum + (c.daysEarned || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comp-Off Management</h1>
          <p className="text-gray-600 mt-1">Manage compensatory leave for overtime work</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add Comp-Off
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar size={24} className="text-primary-600" />
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
              <Clock size={24} className="text-warning-600" />
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
              <User size={24} className="text-info-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Earned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDaysEarned.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Calendar size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Used</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDaysUsed.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by staff name, employee ID, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'used', 'expired'].map(status => (
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
      </div>

      {/* Comp-Off List */}
      <div className="space-y-4">
        {filteredCompOffs.map(compOff => {
          const staffMember = getStaffById(compOff.staffId);
          const isExpanded = expandedCompOff[compOff.id];
          const isExpired = checkExpiry(compOff);

          return (
            <div key={compOff.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {staffMember?.name || 'Unknown Staff'}
                      </h3>
                      <span className="text-sm text-gray-600">({staffMember?.employeeId})</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(isExpired ? 'expired' : compOff.status)}`}>
                        {isExpired ? 'Expired' : compOff.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-600">Work Date</p>
                        <p className="font-medium text-gray-900">{formatDisplayDate(compOff.workDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Hours Worked</p>
                        <p className="font-medium text-gray-900">{compOff.hoursWorked} hrs</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Days Earned</p>
                        <p className="font-medium text-success-600">{compOff.daysEarned?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Requested On</p>
                        <p className="font-medium text-gray-900">{formatDisplayDate(compOff.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-600">Reason</p>
                      <p className="text-sm text-gray-900 mt-1">{compOff.reason}</p>
                    </div>

                    {compOff.expiryDate && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">Expires On</p>
                        <p className={`text-sm font-medium mt-1 ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDisplayDate(compOff.expiryDate)}
                          {isExpired && ' (Expired)'}
                        </p>
                      </div>
                    )}

                    {compOff.usedDate && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">Used On</p>
                        <p className="text-sm font-medium text-info-600 mt-1">{formatDisplayDate(compOff.usedDate)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {compOff.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveCompOff(compOff.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-success-100 text-success-700 rounded-lg hover:bg-success-200 transition-colors"
                        >
                          <Check size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectCompOff(compOff.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X size={18} />
                          Reject
                        </button>
                      </>
                    )}

                    {compOff.status === 'approved' && !isExpired && (
                      <button
                        onClick={() => handleUseCompOff(compOff.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-info-100 text-info-700 rounded-lg hover:bg-info-200 transition-colors"
                      >
                        <Calendar size={18} />
                        Mark as Used
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpanded(compOff.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {compOff.remarks && (
                        <div>
                          <p className="text-xs text-gray-600">Remarks</p>
                          <p className="text-sm text-gray-900 mt-1">{compOff.remarks}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600">Request ID</p>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{compOff.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredCompOffs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No comp-off requests found</p>
            {selectedStatus !== 'all' && (
              <button
                onClick={() => setSelectedStatus('all')}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                View all requests
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Comp-Off Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Add Comp-Off Request</h3>
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
                  value={compOffForm.staffId}
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

              {/* Work Date & Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Date *
                  </label>
                  <input
                    type="date"
                    value={compOffForm.workDate}
                    onChange={(e) => handleFormChange('workDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours Worked *
                  </label>
                  <input
                    type="number"
                    value={compOffForm.hoursWorked}
                    onChange={(e) => handleFormChange('hoursWorked', e.target.value)}
                    min="0"
                    step="0.5"
                    placeholder="e.g., 8"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days earned: {compOffForm.hoursWorked ? (parseFloat(compOffForm.hoursWorked) / 8).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={compOffForm.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  placeholder="e.g., Weekend project deployment, Holiday support"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={compOffForm.remarks}
                  onChange={(e) => handleFormChange('remarks', e.target.value)}
                  placeholder="Any additional notes"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompOff}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={18} />
                Add Comp-Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompOffManagement;
