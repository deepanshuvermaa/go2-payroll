import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Check, X, FileText, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const AdvanceManagement = () => {
  const [advances, setAdvances] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    staffId: '',
    amount: '',
    reason: '',
    requestDate: new Date().toISOString().split('T')[0],
    repaymentMonths: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allAdvances = payrollDataStore.getAdvances();
    const allStaff = payrollDataStore.getStaff();
    setAdvances(allAdvances);
    setStaff(allStaff);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAdvance = (e) => {
    e.preventDefault();

    if (!formData.staffId) {
      toast.error('Please select a staff member');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const selectedStaff = staff.find(s => s.id === formData.staffId);
    if (!selectedStaff) {
      toast.error('Staff member not found');
      return;
    }

    const advanceData = {
      staffId: formData.staffId,
      staffName: selectedStaff.name,
      employeeId: selectedStaff.employeeId,
      department: selectedStaff.department,
      amount: parseFloat(formData.amount),
      reason: formData.reason,
      requestDate: formData.requestDate,
      repaymentMonths: parseInt(formData.repaymentMonths),
    };

    const saved = payrollDataStore.addAdvance(advanceData);
    if (saved) {
      toast.success('Salary advance request submitted');
      setShowAddModal(false);
      setFormData({
        staffId: '',
        amount: '',
        reason: '',
        requestDate: new Date().toISOString().split('T')[0],
        repaymentMonths: 3,
      });
      loadData();
    }
  };

  const handleApproveAdvance = (advanceId) => {
    const success = payrollDataStore.approveAdvance(advanceId);
    if (success) {
      toast.success('Advance approved');
      loadData();
    }
  };

  const handleRejectAdvance = (advanceId) => {
    const advances = payrollDataStore.getAdvances();
    const advance = advances.find(a => a.id === advanceId);
    if (advance) {
      advance.status = 'rejected';
      advance.rejectedDate = new Date().toISOString();
      payrollDataStore.updateAdvance(advance);
      toast.success('Advance rejected');
      loadData();
    }
  };

  const getFilteredAdvances = () => {
    if (filterStatus === 'all') return advances;
    return advances.filter(a => a.status === filterStatus);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-warning',
      approved: 'badge badge-success',
      active: 'badge badge-info',
      completed: 'badge badge-secondary',
      rejected: 'badge badge-danger'
    };
    return badges[status] || 'badge';
  };

  const filteredAdvances = getFilteredAdvances();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Advance Management</h1>
          <p className="text-gray-600 mt-1">Manage employee salary advance requests</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Request Advance
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Advances</p>
              <p className="text-2xl font-bold text-gray-900">{advances.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <DollarSign className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-warning-600">
                {advances.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-lg">
              <Calendar className="text-warning-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Advances</p>
              <p className="text-2xl font-bold text-info-600">
                {advances.filter(a => a.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-info-100 rounded-lg">
              <FileText className="text-info-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-danger-600">
                {formatCurrency(advances.filter(a => a.status === 'active').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
            <div className="p-3 bg-danger-100 rounded-lg">
              <DollarSign className="text-danger-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'active', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                  {advances.filter(a => a.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Request Date</th>
                <th>Repayment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdvances.length > 0 ? (
                filteredAdvances.map(advance => (
                  <tr key={advance.id}>
                    <td className="font-mono text-sm">{advance.employeeId}</td>
                    <td className="font-medium">{advance.staffName}</td>
                    <td>{advance.department}</td>
                    <td className="font-semibold">{formatCurrency(advance.amount)}</td>
                    <td className={advance.balance > 0 ? 'text-danger-600 font-semibold' : 'text-success-600'}>
                      {formatCurrency(advance.balance)}
                    </td>
                    <td>{formatDate(advance.requestDate, 'dd MMM yyyy')}</td>
                    <td>{advance.repaymentMonths} months</td>
                    <td>
                      <span className={getStatusBadge(advance.status)}>
                        {advance.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {advance.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveAdvance(advance.id)}
                              className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectAdvance(advance.id)}
                              className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {advance.status === 'active' && (
                          <span className="text-xs text-gray-500">
                            Deducted: {formatCurrency(advance.deductedAmount)}
                          </span>
                        )}
                        {advance.status === 'completed' && (
                          <span className="text-xs text-success-600 font-medium">
                            ✓ Fully Recovered
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No advances found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {filterStatus === 'all'
                        ? 'Click "Request Advance" to create a new advance request'
                        : `No ${filterStatus} advances`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Advance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Request Salary Advance</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddAdvance} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Select Employee *</label>
                  <select
                    name="staffId"
                    value={formData.staffId}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Choose employee...</option>
                    {staff.filter(s => s.status === 'active').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.employeeId} - {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Advance Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Repayment Period (Months) *</label>
                  <select
                    name="repaymentMonths"
                    value={formData.repaymentMonths}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 9, 12].map(months => (
                      <option key={months} value={months}>
                        {months} {months === 1 ? 'month' : 'months'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Request Date *</label>
                  <input
                    type="date"
                    name="requestDate"
                    value={formData.requestDate}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Reason for Advance *</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Enter reason..."
                    required
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceManagement;
