import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, PieChart, BarChart3, Calculator, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const AdvancedAnalytics = () => {
  const [deptCosts, setDeptCosts] = useState({});
  const [salaryTrends, setSalaryTrends] = useState([]);
  const [attrition, setAttrition] = useState(null);
  const [headcountTrend, setHeadcountTrend] = useState([]);
  const [tenureAnalysis, setTenureAnalysis] = useState({});
  const [ageDemographics, setAgeDemographics] = useState({});
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [ctcResult, setCtcResult] = useState(null);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    try {
      // Load all analytics data
      const deptData = payrollDataStore.getDepartmentWiseCostAnalysis();
      setDeptCosts(deptData);

      const trends = payrollDataStore.getSalaryTrendAnalysis(12);
      setSalaryTrends(trends);

      const attritionData = payrollDataStore.getAttritionAnalysis(new Date().getFullYear());
      setAttrition(attritionData);

      const headcount = payrollDataStore.getHeadcountTrend(12);
      setHeadcountTrend(headcount);

      const tenure = payrollDataStore.getTenureAnalysis();
      setTenureAnalysis(tenure);

      const age = payrollDataStore.getAgeDemographics();
      setAgeDemographics(age);

      const allStaff = payrollDataStore.getStaff();
      setStaff(allStaff);
    } catch (error) {
      toast.error('Failed to load analytics data');
    }
  };

  const calculateStaffCTC = () => {
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    const result = payrollDataStore.calculateCTC(selectedStaffId);
    if (result) {
      setCtcResult(result);
      toast.success('CTC calculated successfully');
    } else {
      toast.error('Failed to calculate CTC');
    }
  };

  const exportAnalytics = () => {
    const data = {
      departmentCosts: deptCosts,
      salaryTrends,
      attrition,
      headcountTrend,
      tenureAnalysis,
      ageDemographics,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  // Calculate summary metrics
  const totalPayrollCost = Object.values(deptCosts).reduce((sum, dept) => sum + dept.totalCost, 0);
  const totalEmployees = Object.values(deptCosts).reduce((sum, dept) => sum + dept.count, 0);
  const avgCostPerEmployee = totalEmployees > 0 ? totalPayrollCost / totalEmployees : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive payroll analytics & insights</p>
        </div>
        <button onClick={exportAnalytics} className="btn-primary flex items-center gap-2">
          <Download size={20} />
          Export Analytics
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Payroll Cost (Annual)</p>
              <p className="text-2xl font-bold mt-1">₹{(totalPayrollCost / 100000).toFixed(2)}L</p>
            </div>
            <DollarSign size={40} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Employees</p>
              <p className="text-2xl font-bold mt-1">{totalEmployees}</p>
            </div>
            <Users size={40} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Cost/Employee (Annual)</p>
              <p className="text-2xl font-bold mt-1">₹{(avgCostPerEmployee / 100000).toFixed(2)}L</p>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Attrition Rate</p>
              <p className="text-2xl font-bold mt-1">{attrition?.attritionRate || '0%'}</p>
            </div>
            <PieChart size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Department-wise Cost Analysis */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Department-wise Cost Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Department</th>
                <th className="text-right py-2 px-2">Employee Count</th>
                <th className="text-right py-2 px-2">Total Annual Cost</th>
                <th className="text-right py-2 px-2">Avg Salary/Employee</th>
                <th className="text-right py-2 px-2">% of Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(deptCosts).map(([dept, data]) => {
                const percentOfTotal = ((data.totalCost / totalPayrollCost) * 100).toFixed(1);
                return (
                  <tr key={dept} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">{dept}</td>
                    <td className="py-2 px-2 text-right">{data.count}</td>
                    <td className="py-2 px-2 text-right">₹{(data.totalCost / 100000).toFixed(2)}L</td>
                    <td className="py-2 px-2 text-right">₹{(data.avgSalary / 100000).toFixed(2)}L</td>
                    <td className="py-2 px-2 text-right">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {percentOfTotal}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Trend Analysis */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Salary Trend Analysis (Last 12 Months)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Month</th>
                <th className="text-right py-2 px-2">Total Salary Paid</th>
                <th className="text-right py-2 px-2">Employees Paid</th>
                <th className="text-right py-2 px-2">Avg Salary</th>
              </tr>
            </thead>
            <tbody>
              {salaryTrends.map((trend, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium">{trend.month || 'N/A'}</td>
                  <td className="py-2 px-2 text-right">₹{(trend.totalSalary || 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right">{trend.count || 0}</td>
                  <td className="py-2 px-2 text-right">₹{Math.round(trend.avgSalary || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attrition Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart size={20} />
            Attrition Analysis
          </h3>
          {attrition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold">{attrition.totalStaff}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Left This Year</p>
                  <p className="text-2xl font-bold">{attrition.leftThisYear}</p>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm text-gray-600">Attrition Rate</p>
                <p className="text-3xl font-bold text-red-600">{attrition.attritionRate}</p>
              </div>
              {attrition.reasonBreakdown && Object.keys(attrition.reasonBreakdown).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Exit Reasons:</p>
                  <div className="space-y-2">
                    {Object.entries(attrition.reasonBreakdown).map(([reason, count]) => (
                      <div key={reason} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{reason || 'Not specified'}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Headcount Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} />
            Headcount Trend (Last 12 Months)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Month</th>
                  <th className="text-right py-2 px-2">Headcount</th>
                  <th className="text-right py-2 px-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {headcountTrend.map((item, idx) => {
                  const change = idx > 0 ? item.count - headcountTrend[idx - 1].count : 0;
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium">{item.month}</td>
                      <td className="py-2 px-2 text-right">{item.count}</td>
                      <td className="py-2 px-2 text-right">
                        {change !== 0 && (
                          <span className={`px-2 py-1 rounded text-xs ${change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {change > 0 ? '+' : ''}{change}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tenure and Age Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Tenure Analysis
          </h3>
          <div className="space-y-3">
            {Object.entries(tenureAnalysis).map(([range, count]) => {
              const percentage = ((count / totalEmployees) * 100).toFixed(1);
              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{range}</span>
                    <span className="font-semibold">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart size={20} />
            Age Demographics
          </h3>
          <div className="space-y-3">
            {Object.entries(ageDemographics).map(([range, count]) => {
              const percentage = ((count / totalEmployees) * 100).toFixed(1);
              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{range}</span>
                    <span className="font-semibold">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTC Calculator */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator size={20} />
          CTC Calculator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Employee</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="input mb-4"
            >
              <option value="">Choose an employee...</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.employeeId}
                </option>
              ))}
            </select>
            <button onClick={calculateStaffCTC} className="btn-primary">
              Calculate CTC
            </button>
          </div>

          {ctcResult && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Monthly CTC</p>
                <p className="text-2xl font-bold text-blue-600">₹{ctcResult.monthlyCTC.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Annual CTC</p>
                <p className="text-2xl font-bold text-green-600">₹{ctcResult.annualCTC.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-sm text-gray-600">Employer Contributions (PF + ESI)</p>
                <p className="text-xl font-bold text-purple-600">₹{ctcResult.employerContributions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded border-2 border-orange-200">
                <p className="text-sm text-gray-600">Total CTC (including employer contributions)</p>
                <p className="text-3xl font-bold text-orange-600">₹{ctcResult.totalCTC.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
