import React, { useState, useEffect } from 'react';
import { Play, Calendar, DollarSign, TrendingUp, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const PayrollAutomation = () => {
  const [activeTab, setActiveTab] = useState('auto-salary');
  const [autoSettings, setAutoSettings] = useState(null);
  const [advances, setAdvances] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [bonusRules, setBonusRules] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAutoSettings(payrollDataStore.getAutoSalarySettings());
    setAdvances(payrollDataStore.getSalaryAdvances());
    setArrears(payrollDataStore.getArrears());
    setBonusRules(payrollDataStore.getBonusRules());
    setStaff(payrollDataStore.getStaff());
  };

  const handleProcessAutoSalary = () => {
    const result = payrollDataStore.processAutoSalary();
    if (result.success) {
      toast.success(`Processed ${result.processed} salaries`);
      if (result.errors > 0) toast.error(`${result.errors} errors`);
    } else {
      toast.error(result.message);
    }
  };

  const handleSaveAutoSettings = () => {
    payrollDataStore.updateAutoSalarySettings(autoSettings);
    toast.success('Auto-salary settings saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Payroll Automation</h1><p className="text-gray-600 mt-1">Auto-processing, advances, arrears & bonus engine</p></div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['auto-salary', 'advances', 'arrears', 'bonus'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}>{tab.replace('-', ' ')}</button>
          ))}
        </nav>
      </div>

      {activeTab === 'auto-salary' && autoSettings && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Auto-Salary Processing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><label className="label">Enable Auto-Processing</label><p className="text-sm text-gray-600">Automatically process salaries on specified day</p></div>
                <input type="checkbox" checked={autoSettings.enabled} onChange={(e) => setAutoSettings({ ...autoSettings, enabled: e.target.checked })} className="w-5 h-5" />
              </div>
              <div><label className="label">Day of Month</label><input type="number" className="input max-w-xs" value={autoSettings.dayOfMonth} onChange={(e) => setAutoSettings({ ...autoSettings, dayOfMonth: parseInt(e.target.value) })} min="1" max="28" /></div>
              <div className="flex items-center justify-between">
                <div><label className="label">Auto-Approve</label><p className="text-sm text-gray-600">Automatically approve processed salaries</p></div>
                <input type="checkbox" checked={autoSettings.autoApprove} onChange={(e) => setAutoSettings({ ...autoSettings, autoApprove: e.target.checked })} className="w-5 h-5" />
              </div>
              <button onClick={handleSaveAutoSettings} className="btn-primary">Save Settings</button>
              <button onClick={handleProcessAutoSalary} className="btn-secondary flex items-center gap-2"><Play size={18} /> Process Now (Manual)</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advances' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Salary Advances</h3>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 px-2">Staff</th><th className="text-right py-2 px-2">Amount</th><th className="text-left py-2 px-2">Status</th><th className="text-left py-2 px-2">Date</th></tr></thead>
            <tbody>
              {advances.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">No advances</td></tr> : advances.map(a => (
                <tr key={a.id} className="border-b hover:bg-gray-50"><td className="py-2 px-2">{staff.find(s => s.id === a.staffId)?.name}</td><td className="text-right py-2 px-2">₹{(a.amount || 0).toLocaleString()}</td><td className="py-2 px-2"><span className={`px-2 py-1 rounded text-xs ${a.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span></td><td className="py-2 px-2">{new Date(a.createdAt).toLocaleDateString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'arrears' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Salary Arrears</h3>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 px-2">Staff</th><th className="text-right py-2 px-2">Old Salary</th><th className="text-right py-2 px-2">New Salary</th><th className="text-right py-2 px-2">Months</th><th className="text-right py-2 px-2">Arrears</th></tr></thead>
            <tbody>
              {arrears.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-500">No arrears</td></tr> : arrears.map(a => (
                <tr key={a.id} className="border-b hover:bg-gray-50"><td className="py-2 px-2">{staff.find(s => s.id === a.staffId)?.name}</td><td className="text-right py-2 px-2">₹{(a.oldSalary || 0).toLocaleString()}</td><td className="text-right py-2 px-2">₹{(a.newSalary || 0).toLocaleString()}</td><td className="text-right py-2 px-2">{a.months || 0}</td><td className="text-right py-2 px-2 font-semibold">₹{(a.arrears || 0).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bonus' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Bonus Rules Engine</h3>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 px-2">Rule Name</th><th className="text-left py-2 px-2">Type</th><th className="text-right py-2 px-2">Value</th><th className="text-left py-2 px-2">Created</th></tr></thead>
            <tbody>
              {bonusRules.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">No bonus rules</td></tr> : bonusRules.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50"><td className="py-2 px-2">{r.name}</td><td className="py-2 px-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{r.type}</span></td><td className="text-right py-2 px-2">{r.type === 'percentage' ? `${r.value}%` : `₹${(r.value || 0).toLocaleString()}`}</td><td className="py-2 px-2">{new Date(r.createdAt).toLocaleDateString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PayrollAutomation;
