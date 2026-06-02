import React, { useState, useEffect } from 'react';
import { Calculator, FileText, Download, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const TaxManagement = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  // Dynamic FY: if current month >= April, FY is currentYear-nextYear, else prevYear-currentYear
  const getCurrentFY = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };
  const [financialYear, setFinancialYear] = useState(getCurrentFY());
  const [taxRegime, setTaxRegime] = useState('new');
  const [computation, setComputation] = useState(null);
  const [oldRegimeComp, setOldRegimeComp] = useState(null);
  const [declaration, setDeclaration] = useState({
    section80C: 0,
    section80D: 0,
    hra: 0,
    homeLoanInterest: 0,
    otherDeductions: 0
  });
  const [form16Records, setForm16Records] = useState([]);

  useEffect(() => {
    loadData();
  }, [financialYear]);

  const loadData = () => {
    const allStaff = payrollDataStore.getStaff();
    setStaff(allStaff);

    const forms = payrollDataStore.getAllForm16(financialYear);
    setForm16Records(forms);
  };

  const handleCalculateTax = () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    const newComp = payrollDataStore.calculateIncomeTax(selectedStaff, financialYear, 'new');
    const oldComp = payrollDataStore.calculateIncomeTax(selectedStaff, financialYear, 'old');

    setComputation(newComp);
    setOldRegimeComp(oldComp);

    if (newComp) {
      toast.success('Tax calculated successfully');
    } else {
      toast.error('Failed to calculate tax');
    }
  };

  const handleSaveDeclaration = () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    const result = payrollDataStore.submitTaxDeclaration({
      staffId: selectedStaff,
      financialYear,
      ...declaration
    });

    if (result.success) {
      toast.success('Tax declaration saved');
      handleCalculateTax(); // Recalculate
    }
  };

  const handleGenerateForm16 = (staffId) => {
    const result = payrollDataStore.generateForm16(staffId, financialYear);

    if (result.success) {
      toast.success('Form 16 generated successfully');
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleBulkGenerateForm16 = () => {
    let successCount = 0;
    let errorCount = 0;

    staff.forEach(s => {
      const result = payrollDataStore.generateForm16(s.id, financialYear);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    });

    toast.success(`Generated Form 16 for ${successCount} staff members`);
    if (errorCount > 0) {
      toast.error(`Failed for ${errorCount} staff members`);
    }

    loadData();
  };

  const getStaffName = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Management</h1>
          <p className="text-gray-600 mt-1">Income tax calculator, declarations, and Form 16</p>
        </div>
        <div className="flex gap-3">
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="input"
          >
            {(() => {
              const now = new Date();
              const currentYear = now.getFullYear();
              const startYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
              const years = [];
              for (let y = startYear - 2; y <= startYear + 1; y++) {
                years.push(`${y}-${y + 1}`);
              }
              return years.map(fy => (
                <option key={fy} value={fy}>FY {fy.split('-')[0]}-{String(fy.split('-')[1]).slice(-2)}</option>
              ));
            })()}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['calculator', 'declarations', 'form16'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tax Calculator Tab */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator size={20} />
              Income Tax Calculator
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Select Staff</label>
                  <select
                    className="input"
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                  >
                    <option value="">Choose staff member</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Tax Regime</label>
                  <select
                    className="input"
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value)}
                  >
                    <option value="new">New Tax Regime</option>
                    <option value="old">Old Tax Regime</option>
                  </select>
                </div>
              </div>

              <button onClick={handleCalculateTax} className="btn-primary">
                Calculate Tax
              </button>
            </div>
          </div>

          {/* Comparison */}
          {computation && oldRegimeComp && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Regime */}
              <div className="card border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">New Tax Regime</h4>
                  {computation.totalTax <= oldRegimeComp.totalTax && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Recommended</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Annual</span>
                    <span className="font-medium">₹{computation.grossAnnual.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Standard Deduction</span>
                    <span className="font-medium">₹{computation.deductions.standardDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 font-medium">Taxable Income</span>
                    <span className="font-semibold">₹{computation.taxableIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹{computation.taxBeforeCess.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cess (4%)</span>
                    <span className="font-medium">₹{computation.cess.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 font-semibold">Total Tax</span>
                    <span className="font-bold text-blue-600 text-xl">₹{computation.totalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly TDS</span>
                    <span className="font-medium">₹{computation.monthlyTDS.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective Rate</span>
                    <span className="font-medium">{computation.effectiveTaxRate}</span>
                  </div>
                </div>
              </div>

              {/* Old Regime */}
              <div className="card border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Old Tax Regime</h4>
                  {oldRegimeComp.totalTax < computation.totalTax && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Recommended</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Annual</span>
                    <span className="font-medium">₹{oldRegimeComp.grossAnnual.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Deductions</span>
                    <span className="font-medium">₹{oldRegimeComp.deductions.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 font-medium">Taxable Income</span>
                    <span className="font-semibold">₹{oldRegimeComp.taxableIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹{oldRegimeComp.taxBeforeCess.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cess (4%)</span>
                    <span className="font-medium">₹{oldRegimeComp.cess.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 font-semibold">Total Tax</span>
                    <span className="font-bold text-gray-900 text-xl">₹{oldRegimeComp.totalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly TDS</span>
                    <span className="font-medium">₹{oldRegimeComp.monthlyTDS.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective Rate</span>
                    <span className="font-medium">{oldRegimeComp.effectiveTaxRate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Savings Comparison */}
          {computation && oldRegimeComp && (
            <div className="card bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Tax Savings with Optimal Regime</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{Math.abs(computation.totalTax - oldRegimeComp.totalTax).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {computation.totalTax < oldRegimeComp.totalTax ? 'Save with New Regime' : 'Save with Old Regime'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Declarations Tab */}
      {activeTab === 'declarations' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Tax Declaration (80C/80D)</h3>

          <div className="space-y-4">
            <div>
              <label className="label">Select Staff</label>
              <select
                className="input max-w-md"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="">Choose staff member</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Section 80C (Max ₹1.5L)</label>
                <input
                  type="number"
                  className="input"
                  value={declaration.section80C}
                  onChange={(e) => setDeclaration({ ...declaration, section80C: parseFloat(e.target.value) || 0 })}
                  placeholder="PPF, LIC, ELSS, etc."
                />
              </div>

              <div>
                <label className="label">Section 80D (Max ₹25K)</label>
                <input
                  type="number"
                  className="input"
                  value={declaration.section80D}
                  onChange={(e) => setDeclaration({ ...declaration, section80D: parseFloat(e.target.value) || 0 })}
                  placeholder="Health Insurance"
                />
              </div>

              <div>
                <label className="label">HRA Exemption</label>
                <input
                  type="number"
                  className="input"
                  value={declaration.hra}
                  onChange={(e) => setDeclaration({ ...declaration, hra: parseFloat(e.target.value) || 0 })}
                  placeholder="House Rent Allowance"
                />
              </div>

              <div>
                <label className="label">Home Loan Interest (Max ₹2L)</label>
                <input
                  type="number"
                  className="input"
                  value={declaration.homeLoanInterest}
                  onChange={(e) => setDeclaration({ ...declaration, homeLoanInterest: parseFloat(e.target.value) || 0 })}
                  placeholder="Under Section 24"
                />
              </div>

              <div>
                <label className="label">Other Deductions</label>
                <input
                  type="number"
                  className="input"
                  value={declaration.otherDeductions}
                  onChange={(e) => setDeclaration({ ...declaration, otherDeductions: parseFloat(e.target.value) || 0 })}
                  placeholder="80E, 80G, etc."
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm font-medium">
                Total Deductions: ₹{(declaration.section80C + declaration.section80D + declaration.hra + declaration.homeLoanInterest + declaration.otherDeductions).toLocaleString('en-IN')}
              </p>
            </div>

            <button onClick={handleSaveDeclaration} className="btn-primary">
              Save Declaration
            </button>
          </div>
        </div>
      )}

      {/* Form 16 Tab */}
      {activeTab === 'form16' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Form 16 Records</h3>
            <button onClick={handleBulkGenerateForm16} className="btn-primary flex items-center gap-2">
              <FileText size={18} />
              Generate for All Staff
            </button>
          </div>

          <div className="card">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Staff Name</th>
                  <th className="text-left py-3 px-4">PAN</th>
                  <th className="text-left py-3 px-4">Gross Salary</th>
                  <th className="text-left py-3 px-4">Tax Payable</th>
                  <th className="text-left py-3 px-4">Regime</th>
                  <th className="text-left py-3 px-4">Generated</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {form16Records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No Form 16 records for {financialYear}
                    </td>
                  </tr>
                ) : (
                  form16Records.map(form => (
                    <tr key={form.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{form.staffName}</td>
                      <td className="py-3 px-4">{form.pan}</td>
                      <td className="py-3 px-4">₹{form.grossSalary.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 font-semibold">₹{form.taxPayable.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          form.taxRegime === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {form.taxRegime.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(form.generatedAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleGenerateForm16(form.staffId)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Download size={16} /> Download
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <FileText className="text-yellow-600 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">About Form 16</h4>
                <p className="text-sm text-yellow-800">
                  Form 16 is a certificate of TDS deduction on salary. It shows annual salary, tax deducted, and investment declarations.
                  Employees need this to file their income tax returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxManagement;
