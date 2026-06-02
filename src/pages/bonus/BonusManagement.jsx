import React, { useState, useEffect } from 'react';
import { Gift, Plus, Check, X, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const BONUS_TYPES = [
  'Performance Bonus',
  'Festival Bonus',
  'Annual Bonus',
  'Joining Bonus',
  'Referral Bonus',
  'Project Completion',
  'Spot Award',
  'Retention Bonus',
  'Other'
];

const BonusManagement = () => {
  const [bonuses, setBonuses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    staffId: '',
    bonusType: '',
    amount: '',
    description: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allBonuses = payrollDataStore.getBonuses();
    const allStaff = payrollDataStore.getStaff();
    setBonuses(allBonuses);
    setStaff(allStaff);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBonus = (e) => {
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

    const bonusData = {
      staffId: formData.staffId,
      staffName: selectedStaff.name,
      employeeId: selectedStaff.employeeId,
      department: selectedStaff.department,
      bonusType: formData.bonusType,
      amount: parseFloat(formData.amount),
      description: formData.description,
      month: parseInt(formData.month),
      year: parseInt(formData.year),
    };

    const saved = payrollDataStore.addBonus(bonusData);
    if (saved) {
      toast.success('Bonus added successfully');
      setShowAddModal(false);
      setFormData({
        staffId: '',
        bonusType: '',
        amount: '',
        description: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      loadData();
    }
  };

  const handleApproveBonus = (bonusId) => {
    const success = payrollDataStore.approveBonus(bonusId);
    if (success) {
      toast.success('Bonus approved');
      loadData();
    }
  };

  const handleRejectBonus = (bonusId) => {
    const bonuses = payrollDataStore.getBonuses();
    const bonus = bonuses.find(b => b.id === bonusId);
    if (bonus) {
      bonus.status = 'rejected';
      bonus.rejectedDate = new Date().toISOString();
      payrollDataStore.updateBonus(bonus);
      toast.success('Bonus rejected');
      loadData();
    }
  };

  const getFilteredBonuses = () => {
    if (filterStatus === 'all') return bonuses;
    return bonuses.filter(b => b.status === filterStatus);
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

  const filteredBonuses = getFilteredBonuses();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bonus Management</h1>
          <p className="text-gray-600 mt-1">Manage employee bonuses and rewards</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Bonus
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bonuses</p>
              <p className="text-2xl font-bold text-gray-900">{bonuses.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Gift className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-warning-600">
                {bonuses.filter(b => b.status === 'pending').length}
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
                {bonuses.filter(b => b.status === 'approved').length}
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
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-info-600">
                {formatCurrency(bonuses.filter(b => b.status === 'approved' || b.status === 'paid').reduce((sum, b) => sum + b.amount, 0))}
              </p>
            </div>
            <div className="p-3 bg-info-100 rounded-lg">
              <TrendingUp className="text-info-600" size={24} />
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
                  {bonuses.filter(b => b.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bonuses Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Bonus Type</th>
                <th>Description</th>
                <th>Month/Year</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBonuses.length > 0 ? (
                filteredBonuses.map(bonus => (
                  <tr key={bonus.id}>
                    <td>
                      <div>
                        <p className="font-medium">{bonus.staffName}</p>
                        <p className="text-xs text-gray-500">{bonus.employeeId}</p>
                      </div>
                    </td>
                    <td>{bonus.department}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-primary-600" />
                        <span>{bonus.bonusType}</span>
                      </div>
                    </td>
                    <td className="max-w-xs">
                      <p className="truncate" title={bonus.description}>
                        {bonus.description}
                      </p>
                    </td>
                    <td>
                      {new Date(bonus.year, bonus.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="font-semibold text-success-600">{formatCurrency(bonus.amount)}</td>
                    <td>
                      <span className={getStatusBadge(bonus.status)}>
                        {bonus.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {bonus.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveBonus(bonus.id)}
                              className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectBonus(bonus.id)}
                              className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {bonus.status === 'approved' && (
                          <span className="text-xs text-info-600 font-medium">
                            Will be added to salary
                          </span>
                        )}
                        {bonus.status === 'paid' && (
                          <span className="text-xs text-success-600 font-medium">
                            ✓ Paid
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <Gift size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No bonuses found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {filterStatus === 'all'
                        ? 'Click "Add Bonus" to create a new bonus'
                        : `No ${filterStatus} bonuses`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bonus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add Bonus</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddBonus} className="p-6 space-y-4">
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
                  <label className="form-label">Bonus Type *</label>
                  <select
                    name="bonusType"
                    value={formData.bonusType}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select type...</option>
                    {BONUS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
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
                  <label className="form-label">Month *</label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Year *</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 1 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Enter bonus description..."
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
                  Add Bonus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusManagement;
