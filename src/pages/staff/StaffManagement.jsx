import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Search, Filter, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import useAuthStore from '../../store/authStore';
import { DEPARTMENTS, DESIGNATIONS, STAFF_STATUS } from '../../constants/config';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';
import { validatePAN, validateAadhar, validateIFSC, validatePhone, formatAadhar, formatPAN, formatIFSC } from '../../utils/validators';
import { useDebounce } from '../../hooks/useDebounce';

const StaffManagement = () => {
  const { checkSubscription } = useAuthStore();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: formatDate(new Date(), 'yyyy-MM-dd'),
    status: 'active',
    salary: {
      basic: 0,
      hra: 0,
      conveyance: 0,
      medical: 0,
      specialAllowance: 0,
      pfApplicable: true,
      esiApplicable: true,
      tds: 0,
    },
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: '',
    },
    address: '',
    emergencyContact: '',
    aadharNumber: '',
    panNumber: '',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [staff, debouncedSearch, filterDepartment, filterStatus]);

  const loadStaff = () => {
    const allStaff = payrollDataStore.getStaff();
    setStaff(allStaff);
  };

  const applyFilters = () => {
    let filtered = [...staff];

    // Search filter (uses debounced value)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.employeeId && s.employeeId.toLowerCase().includes(q))
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(s => s.department === filterDepartment);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    setFilteredStaff(filtered);
  };

  const handleOpenModal = (staffMember = null) => {
    // Check subscription before adding new staff
    if (!staffMember) {
      const { canAddStaff, maxStaff, plan } = checkSubscription();
      if (!canAddStaff) {
        toast.error('Please subscribe to add staff members');
        return;
      }

      const currentStaffCount = staff.filter(s => s.status === 'active').length;
      if (currentStaffCount >= maxStaff) {
        toast.error(`Maximum ${maxStaff} active staff allowed on ${plan} plan`);
        return;
      }
    }

    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData(staffMember);
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        joiningDate: formatDate(new Date(), 'yyyy-MM-dd'),
        status: 'active',
        salary: {
          basic: 0,
          hra: 0,
          conveyance: 0,
          medical: 0,
          specialAllowance: 0,
          pfApplicable: true,
          esiApplicable: true,
          tds: 0,
        },
        bankDetails: {
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: '',
        },
        address: '',
        emergencyContact: '',
        aadharNumber: '',
        panNumber: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('salary.')) {
      const field = name.split('.')[1];
      const fieldValue = type === 'checkbox' ? checked : (parseFloat(value) || 0);
      setFormData({
        ...formData,
        salary: { ...formData.salary, [field]: fieldValue },
      });
    } else if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        bankDetails: { ...formData.bankDetails, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    if (!validatePhone(formData.phone)) {
      toast.error('Invalid phone number (10-13 digits required)');
      return;
    }
    if (formData.panNumber && !validatePAN(formData.panNumber)) {
      toast.error('Invalid PAN format (e.g., ABCDE1234F)');
      return;
    }
    if (formData.aadharNumber && !validateAadhar(formData.aadharNumber)) {
      toast.error('Invalid Aadhar number (12 digits required)');
      return;
    }
    if (formData.bankDetails.ifscCode && !validateIFSC(formData.bankDetails.ifscCode)) {
      toast.error('Invalid IFSC code format (e.g., SBIN0001234)');
      return;
    }
    if (formData.salary.basic <= 0) {
      toast.error('Basic salary must be greater than 0');
      return;
    }

    // Format fields before saving
    const cleanedData = {
      ...formData,
      panNumber: formData.panNumber ? formatPAN(formData.panNumber) : '',
      aadharNumber: formData.aadharNumber ? formatAadhar(formData.aadharNumber) : '',
      bankDetails: {
        ...formData.bankDetails,
        ifscCode: formData.bankDetails.ifscCode ? formatIFSC(formData.bankDetails.ifscCode) : '',
      },
    };

    if (editingStaff) {
      // Update existing staff
      const updated = payrollDataStore.updateStaff({ ...cleanedData, id: editingStaff.id });
      if (updated) {
        toast.success('Staff updated successfully');
        loadStaff();
        handleCloseModal();
      }
    } else {
      // Add new staff
      const newStaff = payrollDataStore.addStaff(cleanedData);
      if (newStaff) {
        toast.success(`Staff added successfully (ID: ${newStaff.employeeId})`);
        loadStaff();
        handleCloseModal();
      }
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = (staffMember) => {
    setDeleteConfirm(staffMember);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      payrollDataStore.deleteStaff(deleteConfirm.id);
      toast.success('Staff deleted successfully');
      setDeleteConfirm(null);
      loadStaff();
    }
  };

  const calculateGrossSalary = (salary) => {
    return (salary.basic || 0) + (salary.hra || 0) + (salary.conveyance || 0) +
           (salary.medical || 0) + (salary.specialAllowance || salary.otherAllowances || 0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage your employees</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
          <UserPlus size={20} />
          Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <select
            className="form-input"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            {STAFF_STATUS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Phone</th>
                <th>Joining Date</th>
                <th>Gross Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map(staffMember => (
                  <tr key={staffMember.id}>
                    <td className="font-mono text-sm">{staffMember.employeeId}</td>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">{staffMember.name}</div>
                        <div className="text-sm text-gray-500">{staffMember.email}</div>
                      </div>
                    </td>
                    <td>{staffMember.department}</td>
                    <td>{staffMember.designation}</td>
                    <td>{staffMember.phone}</td>
                    <td>{formatDate(new Date(staffMember.joiningDate), 'MMM dd, yyyy')}</td>
                    <td className="font-semibold">{formatCurrency(calculateGrossSalary(staffMember.salary))}</td>
                    <td>
                      <span className={`badge ${
                        staffMember.status === 'active' ? 'badge-success' :
                        staffMember.status === 'inactive' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {staffMember.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(staffMember)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(staffMember)}
                          className="text-danger-600 hover:text-danger-700"
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
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    No staff members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingStaff ? 'Edit Staff' : 'Add New Staff'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="form-input"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="form-input"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Emergency Contact</label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      className="form-input"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Aadhar Number</label>
                    <input
                      type="text"
                      name="aadharNumber"
                      className="form-input"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      placeholder="XXXX-XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className="form-label">PAN Number</label>
                    <input
                      type="text"
                      name="panNumber"
                      className="form-input"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Address</label>
                    <textarea
                      name="address"
                      className="form-input"
                      rows="2"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Department *</label>
                    <select
                      name="department"
                      required
                      className="form-input"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Designation *</label>
                    <select
                      name="designation"
                      required
                      className="form-input"
                      value={formData.designation}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Designation</option>
                      {DESIGNATIONS.map(desig => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Joining Date *</label>
                    <input
                      type="date"
                      name="joiningDate"
                      required
                      className="form-input"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Status *</label>
                    <select
                      name="status"
                      required
                      className="form-input"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {STAFF_STATUS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Basic Salary *</label>
                    <input
                      type="number"
                      name="salary.basic"
                      required
                      className="form-input"
                      value={formData.salary.basic}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">HRA</label>
                    <input
                      type="number"
                      name="salary.hra"
                      className="form-input"
                      value={formData.salary.hra}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Conveyance</label>
                    <input
                      type="number"
                      name="salary.conveyance"
                      className="form-input"
                      value={formData.salary.conveyance}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Medical Allowance</label>
                    <input
                      type="number"
                      name="salary.medical"
                      className="form-input"
                      value={formData.salary.medical}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Special / Other Allowances</label>
                    <input
                      type="number"
                      name="salary.specialAllowance"
                      className="form-input"
                      value={formData.salary.specialAllowance}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Gross Salary</label>
                    <input
                      type="text"
                      className="form-input bg-gray-100"
                      value={formatCurrency(calculateGrossSalary(formData.salary))}
                      readOnly
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="salary.pfApplicable"
                        checked={formData.salary.pfApplicable || false}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">PF Applicable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="salary.esiApplicable"
                        checked={formData.salary.esiApplicable || false}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">ESI Applicable</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Account Holder Name</label>
                    <input
                      type="text"
                      name="bankDetails.accountHolderName"
                      className="form-input"
                      value={formData.bankDetails.accountHolderName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      name="bankDetails.accountNumber"
                      className="form-input"
                      value={formData.bankDetails.accountNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      name="bankDetails.bankName"
                      className="form-input"
                      value={formData.bankDetails.bankName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      name="bankDetails.ifscCode"
                      className="form-input"
                      value={formData.bankDetails.ifscCode}
                      onChange={handleInputChange}
                      placeholder="ABCD0123456"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save size={20} />
                  {editingStaff ? 'Update Staff' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
