import React, { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const StatutoryReports = () => {
  const [activeTab, setActiveTab] = useState('pf');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);

  const handleGeneratePF = () => {
    const data = payrollDataStore.generatePFECR(selectedMonth, selectedYear);
    setReportData({ type: 'PF ECR', ...data });
    toast.success('PF ECR generated successfully');
  };

  const handleGenerateESI = () => {
    const data = payrollDataStore.generateESIChallan(selectedMonth, selectedYear);
    setReportData({ type: 'ESI Challan', ...data });
    toast.success('ESI Challan generated successfully');
  };

  const handleGeneratePT = () => {
    const data = payrollDataStore.generatePTChallan(selectedMonth, selectedYear);
    setReportData({ type: 'PT Challan', ...data });
    toast.success('PT Challan generated successfully');
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statutory Reports</h1>
          <p className="text-gray-600 mt-1">PF ECR, ESI & PT Challans</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="input">
            {monthNames.map((m, i) => (<option key={i} value={i}>{m}</option>))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="input">
            {[2023, 2024, 2025, 2026].map(y => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['pf', 'esi', 'pt'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 border-b-2 font-medium text-sm uppercase ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'pf' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">PF ECR (Electronic Challan-cum-Return)</h3>
              <button onClick={handleGeneratePF} className="btn-primary flex items-center gap-2">
                <FileText size={18} /> Generate ECR
              </button>
            </div>
            {reportData && reportData.type === 'PF ECR' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="card bg-blue-50"><p className="text-sm text-gray-600">Staff Count</p><p className="text-2xl font-bold text-blue-600">{reportData.staffCount || 0}</p></div>
                  <div className="card bg-green-50"><p className="text-sm text-gray-600">Total EPF</p><p className="text-xl font-bold text-green-600">₹{(reportData.totalEPF || 0).toLocaleString('en-IN')}</p></div>
                  <div className="card bg-purple-50"><p className="text-sm text-gray-600">Total EPS</p><p className="text-xl font-bold text-purple-600">₹{(reportData.totalEPS || 0).toLocaleString('en-IN')}</p></div>
                  <div className="card bg-orange-50"><p className="text-sm text-gray-600">Grand Total</p><p className="text-xl font-bold text-orange-600">₹{(reportData.grandTotal || 0).toLocaleString('en-IN')}</p></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2 px-2">UAN</th><th className="text-left py-2 px-2">Name</th><th className="text-right py-2 px-2">Wages</th><th className="text-right py-2 px-2">EPF EE</th><th className="text-right py-2 px-2">EPF ER</th><th className="text-right py-2 px-2">EPS</th><th className="text-right py-2 px-2">Total</th></tr></thead>
                    <tbody>
                      {reportData.records.map((r, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{r.uanNumber}</td><td className="py-2 px-2">{r.memberName}</td><td className="text-right py-2 px-2">₹{(r.grossWages || 0).toLocaleString()}</td><td className="text-right py-2 px-2">₹{(r.epfEEContribution || 0).toLocaleString()}</td><td className="text-right py-2 px-2">₹{(r.epfERContribution || 0).toLocaleString()}</td><td className="text-right py-2 px-2">₹{(r.epsContribution || 0).toLocaleString()}</td><td className="text-right py-2 px-2 font-semibold">₹{((r.epfContribution || 0) + (r.epfEEContribution || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'esi' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ESI Challan</h3>
              <button onClick={handleGenerateESI} className="btn-primary flex items-center gap-2">
                <FileText size={18} /> Generate Challan
              </button>
            </div>
            {reportData && reportData.type === 'ESI Challan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="card bg-blue-50"><p className="text-sm text-gray-600">Staff Count</p><p className="text-2xl font-bold text-blue-600">{reportData.staffCount || 0}</p></div>
                  <div className="card bg-green-50"><p className="text-sm text-gray-600">Employee ESI</p><p className="text-xl font-bold text-green-600">₹{(reportData.totalEmployeeESI || 0).toLocaleString('en-IN')}</p></div>
                  <div className="card bg-purple-50"><p className="text-sm text-gray-600">Employer ESI</p><p className="text-xl font-bold text-purple-600">₹{(reportData.totalEmployerESI || 0).toLocaleString('en-IN')}</p></div>
                  <div className="card bg-orange-50"><p className="text-sm text-gray-600">Grand Total</p><p className="text-xl font-bold text-orange-600">₹{(reportData.grandTotal || 0).toLocaleString('en-IN')}</p></div>
                </div>
                <table className="min-w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2 px-2">IP Number</th><th className="text-left py-2 px-2">Name</th><th className="text-right py-2 px-2">Wages</th><th className="text-right py-2 px-2">Emp. (0.75%)</th><th className="text-right py-2 px-2">Empr. (3.25%)</th><th className="text-right py-2 px-2">Total</th></tr></thead>
                  <tbody>
                    {reportData.records.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{r.ipNumber}</td><td className="py-2 px-2">{r.name}</td><td className="text-right py-2 px-2">₹{(r.grossWages || 0).toLocaleString()}</td><td className="text-right py-2 px-2">₹{(r.employeeContribution || 0).toLocaleString()}</td><td className="text-right py-2 px-2">₹{(r.employerContribution || 0).toLocaleString()}</td><td className="text-right py-2 px-2 font-semibold">₹{(r.totalContribution || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pt' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">PT Challan (Professional Tax)</h3>
              <button onClick={handleGeneratePT} className="btn-primary flex items-center gap-2">
                <FileText size={18} /> Generate Challan
              </button>
            </div>
            {reportData && reportData.type === 'PT Challan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="card bg-blue-50"><p className="text-sm text-gray-600">Staff Count</p><p className="text-2xl font-bold text-blue-600">{reportData.staffCount}</p></div>
                  <div className="card bg-green-50"><p className="text-sm text-gray-600">State</p><p className="text-xl font-bold text-green-600">{reportData.state}</p></div>
                  <div className="card bg-orange-50"><p className="text-sm text-gray-600">Total PT</p><p className="text-xl font-bold text-orange-600">₹{reportData.totalPT.toLocaleString('en-IN')}</p></div>
                </div>
                <table className="min-w-full">
                  <thead><tr className="border-b"><th className="text-left py-3 px-4">Name</th><th className="text-right py-3 px-4">Gross Salary</th><th className="text-right py-3 px-4">PT Amount</th></tr></thead>
                  <tbody>
                    {reportData.records.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{r.name}</td><td className="text-right py-3 px-4">₹{r.grossSalary.toLocaleString('en-IN')}</td><td className="text-right py-3 px-4 font-semibold">₹{r.pt.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatutoryReports;
