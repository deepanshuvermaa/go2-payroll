import React, { useState, useEffect } from 'react';
import { Building2, Plus, Download, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const BankingIntegration = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [unreconciled, setUnreconciled] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [accountForm, setAccountForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'current'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAccounts(payrollDataStore.getBankAccounts());
    setBatches(payrollDataStore.getPaymentBatches());
    setTransactions(payrollDataStore.getPaymentTransactions());
    setUnreconciled(payrollDataStore.getUnreconciledTransactions());
  };

  const handleAddAccount = () => {
    if (!accountForm.bankName || !accountForm.accountNumber) {
      toast.error('Please fill required fields');
      return;
    }

    const result = payrollDataStore.addBankAccount(accountForm);
    if (result.success) {
      toast.success('Bank account added successfully');
      loadData();
      setShowAccountModal(false);
      setAccountForm({ bankName: '', accountNumber: '', ifscCode: '', branchName: '', accountType: 'current' });
    }
  };

  const handleCreateBatch = () => {
    // Get latest salary records for all staff
    const staff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    const salaries = payrollDataStore.getSalaryRecords();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const payments = staff.map(s => {
      const salary = salaries.find(sal => sal.staffId === s.id && sal.month === currentMonth && sal.year === currentYear);
      return {
        staffId: s.id,
        amount: salary?.netSalary || 0,
        month: currentMonth,
        year: currentYear
      };
    }).filter(p => p.amount > 0);

    if (payments.length === 0) {
      toast.error('No salary records found for current month');
      return;
    }

    const result = payrollDataStore.createPaymentBatch({
      name: `Salary Batch ${currentMonth + 1}/${currentYear}`,
      accountNumber: accounts[0]?.accountNumber || '',
      payments
    });

    if (result.success) {
      toast.success(`Payment batch created with ${payments.length} payments`);
      loadData();
    }
  };

  const handleGenerateNEFT = (batchId) => {
    const result = payrollDataStore.generateNEFTFile(batchId);
    if (result.success) {
      downloadFile(result.content, result.filename, 'text/plain');
      toast.success(`NEFT file generated with ${result.recordCount} records`);
    } else {
      toast.error(result.message);
    }
  };

  const handleGenerateRTGS = (batchId) => {
    const result = payrollDataStore.generateRTGSFile(batchId);
    if (result.success) {
      downloadFile(result.content, result.filename, 'text/plain');
      toast.success(`RTGS file generated with ${result.recordCount} records`);
    } else {
      toast.error(result.message);
    }
  };

  const handleReconcile = (transactionId) => {
    const bankRef = prompt('Enter bank reference number:');
    if (!bankRef) return;

    const bankDate = new Date().toISOString();
    const result = payrollDataStore.reconcilePayment(transactionId, bankRef, bankDate);

    if (result.success) {
      toast.success('Payment reconciled successfully');
      loadData();
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      processed: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banking Integration</h1>
          <p className="text-gray-600 mt-1">Manage bank accounts, payments & reconciliation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAccountModal(true)} className="btn-secondary flex items-center gap-2">
            <Plus size={20} />
            Add Account
          </button>
          <button onClick={handleCreateBatch} className="btn-primary flex items-center gap-2">
            <Upload size={20} />
            Create Batch
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-2 px-4 ${activeTab === 'accounts' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Bank Accounts
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-2 px-4 ${activeTab === 'batches' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Payment Batches
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-2 px-4 ${activeTab === 'transactions' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-2 px-4 ${activeTab === 'reconciliation' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Reconciliation ({unreconciled.length})
        </button>
      </div>

      {/* Bank Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Bank Accounts</h3>
          {accounts.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No bank accounts configured</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(account => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="text-blue-600" size={24} />
                        <h4 className="font-semibold text-lg">{account.bankName}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{account.branchName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {account.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Account:</span> <span className="font-mono">{account.accountNumber}</span></p>
                    <p><span className="text-gray-600">IFSC:</span> <span className="font-mono">{account.ifscCode}</span></p>
                    <p><span className="text-gray-600">Type:</span> <span className="capitalize">{account.accountType}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Batches Tab */}
      {activeTab === 'batches' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Payment Batches</h3>
          {batches.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No payment batches created</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Batch Name</th>
                  <th className="text-left py-2 px-2">Created</th>
                  <th className="text-right py-2 px-2">Payments</th>
                  <th className="text-right py-2 px-2">Total Amount</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">{batch.name}</td>
                    <td className="py-2 px-2">{new Date(batch.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-2 text-right">{batch.paymentCount}</td>
                    <td className="py-2 px-2 text-right">₹{(batch.totalAmount || 0).toLocaleString()}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGenerateNEFT(batch.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          NEFT
                        </button>
                        <button
                          onClick={() => handleGenerateRTGS(batch.id)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          RTGS
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Payment Transactions</h3>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No transactions found</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Transaction ID</th>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Amount</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Reconciled</th>
                  <th className="text-left py-2 px-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map(txn => (
                  <tr key={txn.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-xs">{txn.id}</td>
                    <td className="py-2 px-2">{new Date(txn.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-2 text-right">₹{txn.amount?.toLocaleString() || 0}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {txn.reconciled ? (
                        <CheckCircle className="text-green-600" size={16} />
                      ) : (
                        <XCircle className="text-red-600" size={16} />
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs">{txn.reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reconciliation Tab */}
      {activeTab === 'reconciliation' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Unreconciled Transactions</h3>
          {unreconciled.length === 0 ? (
            <p className="text-center py-8 text-gray-500">All transactions reconciled</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Transaction ID</th>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Amount</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unreconciled.map(txn => (
                  <tr key={txn.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-xs">{txn.id}</td>
                    <td className="py-2 px-2">{new Date(txn.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-2 text-right">₹{txn.amount?.toLocaleString() || 0}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleReconcile(txn.id)}
                        className="btn-primary text-xs"
                      >
                        Reconcile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Bank Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={accountForm.bankName}
                  onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                  className="input"
                  placeholder="HDFC Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Number *</label>
                <input
                  type="text"
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                  className="input"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={accountForm.ifscCode}
                  onChange={(e) => setAccountForm({ ...accountForm, ifscCode: e.target.value })}
                  className="input"
                  placeholder="HDFC0001234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Branch Name</label>
                <input
                  type="text"
                  value={accountForm.branchName}
                  onChange={(e) => setAccountForm({ ...accountForm, branchName: e.target.value })}
                  className="input"
                  placeholder="Mumbai Main Branch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Type</label>
                <select
                  value={accountForm.accountType}
                  onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                  className="input"
                >
                  <option value="current">Current Account</option>
                  <option value="savings">Savings Account</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddAccount} className="btn-primary flex-1">Add Account</button>
              <button onClick={() => setShowAccountModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankingIntegration;
