import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Check, X, FileText, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEMISchedule, setShowEMISchedule] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    staffId: '',
    amount: '',
    interestRate: 10,
    tenure: 12,
    purpose: '',
    requestDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allLoans = payrollDataStore.getLoans();
    const allStaff = payrollDataStore.getStaff();
    setLoans(allLoans);
    setStaff(allStaff);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateEMI = (principal, rate, tenure) => {
    if (rate === 0) return principal / tenure;
    const monthlyRate = rate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  };

  const handleAddLoan = (e) => {
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

    const loanData = {
      staffId: formData.staffId,
      staffName: selectedStaff.name,
      employeeId: selectedStaff.employeeId,
      department: selectedStaff.department,
      amount: parseFloat(formData.amount),
      interestRate: parseFloat(formData.interestRate),
      tenure: parseInt(formData.tenure),
      purpose: formData.purpose,
      requestDate: formData.requestDate,
    };

    const saved = payrollDataStore.addLoan(loanData);
    if (saved) {
      toast.success('Loan request submitted');
      setShowAddModal(false);
      setFormData({
        staffId: '',
        amount: '',
        interestRate: 10,
        tenure: 12,
        purpose: '',
        requestDate: new Date().toISOString().split('T')[0],
      });
      loadData();
    }
  };

  const handleApproveLoan = (loanId) => {
    const success = payrollDataStore.approveLoan(loanId);
    if (success) {
      toast.success('Loan approved');
      loadData();
    }
  };

  const handleRejectLoan = (loanId) => {
    const loans = payrollDataStore.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      loan.status = 'rejected';
      loan.rejectedDate = new Date().toISOString();
      payrollDataStore.updateLoan(loan);
      toast.success('Loan rejected');
      loadData();
    }
  };

  const getFilteredLoans = () => {
    if (filterStatus === 'all') return loans;
    return loans.filter(l => l.status === filterStatus);
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

  const generateEMISchedule = (loan) => {
    const schedule = [];
    const monthlyEMI = loan.monthlyEMI;
    let remainingBalance = loan.amount;
    const monthlyRate = loan.interestRate / (12 * 100);

    for (let month = 1; month <= loan.tenure; month++) {
      const interestComponent = Math.round(remainingBalance * monthlyRate);
      const principalComponent = monthlyEMI - interestComponent;
      remainingBalance -= principalComponent;

      schedule.push({
        month,
        emi: monthlyEMI,
        principal: principalComponent,
        interest: interestComponent,
        balance: Math.max(0, Math.round(remainingBalance))
      });
    }

    return schedule;
  };

  const filteredLoans = getFilteredLoans();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Loan Management</h1>
          <p className="text-gray-600 mt-1">Manage employee loan requests and EMI deductions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Request Loan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Loans</p>
              <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Wallet className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-warning-600">
                {loans.filter(l => l.status === 'pending').length}
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
              <p className="text-sm text-gray-600">Active Loans</p>
              <p className="text-2xl font-bold text-info-600">
                {loans.filter(l => l.status === 'active').length}
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
                {formatCurrency(loans.filter(l => l.status === 'active').reduce((sum, l) => sum + l.balance, 0))}
              </p>
            </div>
            <div className="p-3 bg-danger-100 rounded-lg">
              <TrendingUp className="text-danger-600" size={24} />
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
                  {loans.filter(l => l.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Loan Amount</th>
                <th>Interest Rate</th>
                <th>Tenure</th>
                <th>Monthly EMI</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map(loan => (
                  <tr key={loan.id}>
                    <td className="font-mono text-sm">{loan.employeeId}</td>
                    <td className="font-medium">{loan.staffName}</td>
                    <td>{loan.department}</td>
                    <td className="font-semibold">{formatCurrency(loan.amount)}</td>
                    <td>{loan.interestRate}%</td>
                    <td>{loan.tenure} months</td>
                    <td className="font-semibold text-info-600">
                      {loan.monthlyEMI ? formatCurrency(loan.monthlyEMI) : '-'}
                    </td>
                    <td className={loan.balance > 0 ? 'text-danger-600 font-semibold' : 'text-success-600'}>
                      {formatCurrency(loan.balance)}
                    </td>
                    <td>
                      <span className={getStatusBadge(loan.status)}>
                        {loan.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {loan.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveLoan(loan.id)}
                              className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectLoan(loan.id)}
                              className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {(loan.status === 'active' || loan.status === 'completed') && loan.monthlyEMI && (
                          <button
                            onClick={() => setShowEMISchedule(loan)}
                            className="text-xs text-primary-600 hover:underline"
                          >
                            View EMI Schedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-12">
                    <Wallet size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No loans found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {filterStatus === 'all'
                        ? 'Click "Request Loan" to create a new loan request'
                        : `No ${filterStatus} loans`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Request Employee Loan</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddLoan} className="p-6 space-y-4">
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
                  <label className="form-label">Loan Amount *</label>
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
                  <label className="form-label">Interest Rate (% per annum) *</label>
                  <input
                    type="number"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter interest rate"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Tenure (Months) *</label>
                  <select
                    name="tenure"
                    value={formData.tenure}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    {[6, 12, 18, 24, 36, 48, 60].map(months => (
                      <option key={months} value={months}>
                        {months} months
                      </option>
                    ))}
                  </select>
                </div>

                <div>
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
                  <label className="form-label">Purpose of Loan *</label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Enter purpose..."
                    required
                  ></textarea>
                </div>

                {formData.amount && formData.interestRate && formData.tenure && (
                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 mb-2">Estimated Monthly EMI:</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(calculateEMI(parseFloat(formData.amount), parseFloat(formData.interestRate), parseInt(formData.tenure)))}
                    </p>
                  </div>
                )}
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

      {/* EMI Schedule Modal */}
      {showEMISchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">EMI Repayment Schedule</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {showEMISchedule.staffName} ({showEMISchedule.employeeId})
                  </p>
                </div>
                <button
                  onClick={() => setShowEMISchedule(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Loan Amount</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(showEMISchedule.amount)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Interest Rate</p>
                  <p className="text-lg font-bold text-gray-900">{showEMISchedule.interestRate}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Monthly EMI</p>
                  <p className="text-lg font-bold text-primary-600">{formatCurrency(showEMISchedule.monthlyEMI)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p className="text-lg font-bold text-danger-600">{formatCurrency(showEMISchedule.balance)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>EMI</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateEMISchedule(showEMISchedule).map(schedule => (
                      <tr key={schedule.month}>
                        <td className="font-medium">Month {schedule.month}</td>
                        <td className="font-semibold">{formatCurrency(schedule.emi)}</td>
                        <td className="text-success-600">{formatCurrency(schedule.principal)}</td>
                        <td className="text-warning-600">{formatCurrency(schedule.interest)}</td>
                        <td className="font-medium">{formatCurrency(schedule.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
