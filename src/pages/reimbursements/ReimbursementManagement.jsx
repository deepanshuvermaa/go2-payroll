import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Check, X, FileText, Calendar, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { expenseAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const REIMBURSEMENT_CATEGORIES = [
  'Travel',
  'Food & Accommodation',
  'Medical',
  'Fuel',
  'Communication',
  'Training & Education',
  'Office Supplies',
  'Client Entertainment',
  'Other'
];

const ReimbursementManagement = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [attachments, setAttachments] = useState([]);
  const [formData, setFormData] = useState({
    staffId: '',
    category: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    billNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Always load staff from local store
    const allStaff = payrollDataStore.getStaff();
    setStaff(allStaff);

    // Try real API first; fall back to local store on error
    try {
      const [myRes, pendingRes] = await Promise.allSettled([
        expenseAPI.getMyReports(),
        expenseAPI.getPending(),
      ]);

      let combined = [];

      if (myRes.status === 'fulfilled' && myRes.value?.data?.length) {
        combined = myRes.value.data;
      } else {
        combined = payrollDataStore.getReimbursements();
      }

      if (pendingRes.status === 'fulfilled' && pendingRes.value?.data?.length) {
        // Merge pending approvals (avoid duplicates by id)
        const existingIds = new Set(combined.map((r) => r.id));
        pendingRes.value.data.forEach((r) => {
          if (!existingIds.has(r.id)) combined.push(r);
        });
      }

      setReimbursements(combined);
    } catch {
      setReimbursements(payrollDataStore.getReimbursements());
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddReimbursement = async (e) => {
    e.preventDefault();

    if (!formData.staffId) {
      toast.error('Please select a staff member');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    const selectedStaff = staff.find(s => s.id === formData.staffId);
    if (!selectedStaff) {
      toast.error('Staff member not found');
      return;
    }

    const reimbursementData = {
      staffId: formData.staffId,
      staffName: selectedStaff.name,
      employeeId: selectedStaff.employeeId,
      department: selectedStaff.department,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      expenseDate: formData.expenseDate,
      billNumber: formData.billNumber,
    };

    // Call real API; fall back to local store on failure
    try {
      await expenseAPI.createReport(reimbursementData);
    } catch {
      payrollDataStore.addReimbursement(reimbursementData);
    }

    toast.success('Reimbursement claim submitted');
    setShowAddModal(false);
    setAttachments([]);
    setFormData({
      staffId: '',
      category: '',
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      billNumber: '',
    });
    loadData();
  };

  const handleApproveReimbursement = async (reimbursementId) => {
    // Optimistic local update
    payrollDataStore.approveReimbursement(reimbursementId);
    toast.success('Reimbursement approved');

    try {
      await expenseAPI.approve(reimbursementId);
    } catch {
      // local update already applied; silent fail for offline resilience
    }

    loadData();
  };

  const handleRejectReimbursement = async (reimbursementId) => {
    // Optimistic local update
    const localList = payrollDataStore.getReimbursements();
    const reimbursement = localList.find(r => r.id === reimbursementId);
    if (reimbursement) {
      reimbursement.status = 'rejected';
      reimbursement.rejectedDate = new Date().toISOString();
      payrollDataStore.updateReimbursement(reimbursement);
    }
    toast.success('Reimbursement rejected');

    try {
      await expenseAPI.reject(reimbursementId);
    } catch {
      // silent fail
    }

    loadData();
  };

  const getFilteredReimbursements = () => {
    if (filterStatus === 'all') return reimbursements;
    return reimbursements.filter(r => r.status === filterStatus);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-warning',
      approved: 'badge badge-success',
      paid: 'badge badge-info',
      rejected: 'badge badge-danger'
    };
    return badges[status] || 'badge';
  };

  const getCategoryIcon = (category) => {
    return <Receipt size={18} className="text-gray-500" />;
  };

  const filteredReimbursements = getFilteredReimbursements();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reimbursement Management</h1>
          <p className="text-gray-600 mt-1">Manage employee expense reimbursement claims</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Submit Claim
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{reimbursements.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Receipt className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-warning-600">
                {reimbursements.filter(r => r.status === 'pending').length}
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
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-success-600">
                {reimbursements.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-lg">
              <Check className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-info-600">
                {formatCurrency(reimbursements.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0))}
              </p>
            </div>
            <div className="p-3 bg-info-100 rounded-lg">
              <FileText className="text-info-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'paid', 'rejected'].map(status => (
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
                  {reimbursements.filter(r => r.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reimbursements Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Category</th>
                <th>Description</th>
                <th>Expense Date</th>
                <th>Amount</th>
                <th>Bill No</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReimbursements.length > 0 ? (
                filteredReimbursements.map(reimbursement => (
                  <tr key={reimbursement.id}>
                    <td className="font-mono text-sm">#{reimbursement.id.slice(-6)}</td>
                    <td>
                      <div>
                        <p className="font-medium">{reimbursement.staffName}</p>
                        <p className="text-xs text-gray-500">{reimbursement.employeeId}</p>
                      </div>
                    </td>
                    <td>{reimbursement.department}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(reimbursement.category)}
                        <span>{reimbursement.category}</span>
                      </div>
                    </td>
                    <td className="max-w-xs">
                      <p className="truncate" title={reimbursement.description}>
                        {reimbursement.description}
                      </p>
                    </td>
                    <td>{formatDate(reimbursement.expenseDate, 'dd MMM yyyy')}</td>
                    <td className="font-semibold">{formatCurrency(reimbursement.amount)}</td>
                    <td className="font-mono text-sm">{reimbursement.billNumber || '-'}</td>
                    <td>
                      <span className={getStatusBadge(reimbursement.status)}>
                        {reimbursement.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {reimbursement.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveReimbursement(reimbursement.id)}
                              className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectReimbursement(reimbursement.id)}
                              className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {reimbursement.status === 'approved' && (
                          <span className="text-xs text-info-600 font-medium">
                            Awaiting Payment
                          </span>
                        )}
                        {reimbursement.status === 'paid' && (
                          <span className="text-xs text-success-600 font-medium">
                            ✓ Paid on {formatDate(reimbursement.paidDate, 'dd MMM')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-12">
                    <Receipt size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No reimbursement claims found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {filterStatus === 'all'
                        ? 'Click "Submit Claim" to create a new reimbursement request'
                        : `No ${filterStatus} claims`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reimbursement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Submit Reimbursement Claim</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddReimbursement} className="p-6 space-y-4">
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
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select category...</option>
                    {REIMBURSEMENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Amount *</label>
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
                  <label className="form-label">Expense Date *</label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleInputChange}
                    className="form-input"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Bill Number</label>
                  <input
                    type="text"
                    name="billNumber"
                    value={formData.billNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter bill number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Enter description of expense..."
                    required
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#9C9C9C] mb-2">Attach Supporting Documents</label>
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-[#E7E2D8] rounded-xl cursor-pointer hover:border-[#F3CC4D] hover:bg-[#F5F1E6] transition">
                    <Upload size={16} className="text-[#9C9C9C]" />
                    <span className="text-sm text-[#9C9C9C]">{attachments.length > 0 ? `${attachments.length} file(s) attached` : 'Click to attach bills, receipts, invoices (PDF, JPG)'}</span>
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files).map(f => ({ name: f.name, size: (f.size/1024).toFixed(0)+'KB' }))])} />
                  </label>
                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachments.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-[#F5F1E6] rounded-lg px-3 py-1.5">
                          <span className="text-[#2B2B2B] font-medium">{f.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#9C9C9C]">{f.size}</span>
                            <button type="button" onClick={() => setAttachments(prev => prev.filter((_,j) => j !== i))} className="text-red-400 hover:text-red-600">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReimbursementManagement;
