import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit, Trash2, TrendingUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatCurrency } from '../../utils/dateHelpers';

const INCENTIVE_TYPES = [
  { value: 'sales_target', label: 'Sales Target Based' },
  { value: 'attendance', label: 'Attendance Based' },
  { value: 'performance', label: 'Performance Based' },
  { value: 'fixed', label: 'Fixed Monthly' }
];

const APPLICABLE_TO = [
  { value: 'all', label: 'All Employees' },
  { value: 'department', label: 'By Department' },
  { value: 'individual', label: 'Individual Employee' }
];

const IncentiveManagement = () => {
  const [incentives, setIncentives] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIncentive, setEditingIncentive] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    applicableTo: '',
    department: '',
    staffId: '',
    value: '',
    calculationType: 'fixed',
    targetAmount: '',
    targetPercentage: '',
    minScore: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allIncentives = payrollDataStore.getIncentives();
    const allStaff = payrollDataStore.getStaff();

    const uniqueDepts = [...new Set(allStaff.map(s => s.department))];

    setIncentives(allIncentives);
    setStaff(allStaff);
    setDepartments(uniqueDepts);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      applicableTo: '',
      department: '',
      staffId: '',
      value: '',
      calculationType: 'fixed',
      targetAmount: '',
      targetPercentage: '',
      minScore: '',
      status: 'active'
    });
    setEditingIncentive(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.applicableTo) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      toast.error('Please enter a valid incentive value');
      return;
    }

    const incentiveData = {
      name: formData.name,
      type: formData.type,
      applicableTo: formData.applicableTo,
      department: formData.applicableTo === 'department' ? formData.department : null,
      staffId: formData.applicableTo === 'individual' ? formData.staffId : null,
      value: parseFloat(formData.value),
      calculationType: formData.calculationType,
      targetAmount: formData.type === 'sales_target' ? parseFloat(formData.targetAmount) : null,
      targetPercentage: formData.type === 'attendance' ? parseFloat(formData.targetPercentage) : null,
      minScore: formData.type === 'performance' ? parseFloat(formData.minScore) : null,
      status: formData.status
    };

    if (editingIncentive) {
      incentiveData.id = editingIncentive.id;
      const success = payrollDataStore.updateIncentive(incentiveData);
      if (success) {
        toast.success('Incentive rule updated');
        setShowAddModal(false);
        resetForm();
        loadData();
      }
    } else {
      const saved = payrollDataStore.addIncentive(incentiveData);
      if (saved) {
        toast.success('Incentive rule created');
        setShowAddModal(false);
        resetForm();
        loadData();
      }
    }
  };

  const handleEdit = (incentive) => {
    setEditingIncentive(incentive);
    setFormData({
      name: incentive.name,
      type: incentive.type,
      applicableTo: incentive.applicableTo,
      department: incentive.department || '',
      staffId: incentive.staffId || '',
      value: incentive.value.toString(),
      calculationType: incentive.calculationType || 'fixed',
      targetAmount: incentive.targetAmount?.toString() || '',
      targetPercentage: incentive.targetPercentage?.toString() || '',
      minScore: incentive.minScore?.toString() || '',
      status: incentive.status
    });
    setShowAddModal(true);
  };

  const handleDelete = (incentiveId) => {
    if (confirm('Are you sure you want to delete this incentive rule?')) {
      const incentives = payrollDataStore.getIncentives();
      const filtered = incentives.filter(i => i.id !== incentiveId);
      payrollDataStore.setData(payrollDataStore.STORAGE_KEYS.INCENTIVES, filtered);
      toast.success('Incentive rule deleted');
      loadData();
    }
  };

  const getApplicableToDisplay = (incentive) => {
    if (incentive.applicableTo === 'all') return 'All Employees';
    if (incentive.applicableTo === 'department') return `Department: ${incentive.department}`;
    if (incentive.applicableTo === 'individual') {
      const staffMember = staff.find(s => s.id === incentive.staffId);
      return `Employee: ${staffMember?.name || 'Unknown'}`;
    }
    return '-';
  };

  const getTypeDisplay = (incentive) => {
    const type = INCENTIVE_TYPES.find(t => t.value === incentive.type);
    return type?.label || incentive.type;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incentive Management</h1>
          <p className="text-gray-600 mt-1">Configure rule-based incentive calculations</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Create Incentive Rule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rules</p>
              <p className="text-2xl font-bold text-gray-900">{incentives.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Target className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-success-600">
                {incentives.filter(i => i.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-lg">
              <TrendingUp className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sales Based</p>
              <p className="text-2xl font-bold text-info-600">
                {incentives.filter(i => i.type === 'sales_target').length}
              </p>
            </div>
            <div className="p-3 bg-info-100 rounded-lg">
              <Target className="text-info-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance Based</p>
              <p className="text-2xl font-bold text-warning-600">
                {incentives.filter(i => i.type === 'performance').length}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-lg">
              <TrendingUp className="text-warning-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Incentives Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Type</th>
                <th>Applicable To</th>
                <th>Value</th>
                <th>Criteria</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incentives.length > 0 ? (
                incentives.map(incentive => (
                  <tr key={incentive.id}>
                    <td className="font-medium">{incentive.name}</td>
                    <td>{getTypeDisplay(incentive)}</td>
                    <td>{getApplicableToDisplay(incentive)}</td>
                    <td className="font-semibold text-success-600">
                      {incentive.calculationType === 'percentage' ? `${incentive.value}%` : formatCurrency(incentive.value)}
                    </td>
                    <td className="text-sm">
                      {incentive.type === 'sales_target' && `Sales ≥ ${formatCurrency(incentive.targetAmount)}`}
                      {incentive.type === 'attendance' && `Attendance ≥ ${incentive.targetPercentage}%`}
                      {incentive.type === 'performance' && `Score ≥ ${incentive.minScore}`}
                      {incentive.type === 'fixed' && 'Monthly Fixed'}
                    </td>
                    <td>
                      <span className={`badge ${incentive.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                        {incentive.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(incentive)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(incentive.id)}
                          className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Target size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No incentive rules configured</p>
                    <p className="text-sm text-gray-500 mt-2">Click "Create Incentive Rule" to add a new rule</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Incentive Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingIncentive ? 'Edit Incentive Rule' : 'Create Incentive Rule'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Rule Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Monthly Sales Incentive"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Incentive Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select type...</option>
                    {INCENTIVE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Applicable To *</label>
                  <select
                    name="applicableTo"
                    value={formData.applicableTo}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select...</option>
                    {APPLICABLE_TO.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {formData.applicableTo === 'department' && (
                  <div className="md:col-span-2">
                    <label className="form-label">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select department...</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.applicableTo === 'individual' && (
                  <div className="md:col-span-2">
                    <label className="form-label">Employee *</label>
                    <select
                      name="staffId"
                      value={formData.staffId}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select employee...</option>
                      {staff.filter(s => s.status === 'active').map(s => (
                        <option key={s.id} value={s.id}>
                          {s.employeeId} - {s.name} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.type === 'sales_target' && (
                  <>
                    <div>
                      <label className="form-label">Target Sales Amount *</label>
                      <input
                        type="number"
                        name="targetAmount"
                        value={formData.targetAmount}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter target amount"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Calculation Type *</label>
                      <select
                        name="calculationType"
                        value={formData.calculationType}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage of Sales</option>
                      </select>
                    </div>
                  </>
                )}

                {formData.type === 'attendance' && (
                  <div>
                    <label className="form-label">Minimum Attendance % *</label>
                    <input
                      type="number"
                      name="targetPercentage"
                      value={formData.targetPercentage}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 95"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                )}

                {formData.type === 'performance' && (
                  <div>
                    <label className="form-label">Minimum Performance Score *</label>
                    <input
                      type="number"
                      name="minScore"
                      value={formData.minScore}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 80"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="form-label">Incentive Value *</label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={formData.calculationType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                    min="0.01"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.calculationType === 'percentage' ? 'Percentage of sales' : 'Fixed amount in ₹'}
                  </p>
                </div>

                <div>
                  <label className="form-label">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingIncentive ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentiveManagement;
