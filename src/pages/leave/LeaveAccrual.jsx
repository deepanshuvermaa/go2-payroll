import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Award, User, RefreshCw, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatDate, formatDisplayDate } from '../../utils/dateHelpers';

const LeaveAccrual = () => {
  const [staff, setStaff] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [expandedStaff, setExpandedStaff] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);

    // Load leave balances for all staff
    const balances = {};
    allStaff.forEach(staffMember => {
      balances[staffMember.id] = payrollDataStore.getStaffLeaveBalance(staffMember.id);
    });
    setLeaveBalances(balances);
  };

  const handleRecalculateAccrual = (staffId) => {
    setLoading(true);
    try {
      const accrual = payrollDataStore.calculateLeaveAccrual(staffId);
      if (accrual) {
        payrollDataStore.addLeaveAccrual(accrual);
        toast.success('Leave accrual recalculated successfully');
        loadData();
      } else {
        toast.error('Failed to calculate leave accrual');
      }
    } catch (error) {
      toast.error('Error calculating leave accrual');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAllAccruals = () => {
    if (!window.confirm('This will recalculate leave accruals for all active staff members. Continue?')) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      staff.forEach(staffMember => {
        try {
          const accrual = payrollDataStore.calculateLeaveAccrual(staffMember.id);
          if (accrual) {
            payrollDataStore.addLeaveAccrual(accrual);
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          // Staff accrual calculation failed, counted in failCount
        }
      });

      toast.success(`Recalculated accruals for ${successCount} staff members`);
      if (failCount > 0) {
        toast.error(`Failed for ${failCount} staff members`);
      }
      loadData();
    } catch (error) {
      toast.error('Error recalculating accruals');
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffExpanded = (staffId) => {
    setExpandedStaff(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const calculateMonthsWorked = (joiningDate) => {
    if (!joiningDate) return 0;
    const joining = new Date(joiningDate);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - joining.getFullYear()) * 12 + (today.getMonth() - joining.getMonth());
    return Math.max(0, monthsDiff);
  };

  const calculateYearsWorked = (joiningDate) => {
    const months = calculateMonthsWorked(joiningDate);
    return (months / 12).toFixed(1);
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = {
    totalStaff: filteredStaff.length,
    totalCasualLeave: 0,
    totalSickLeave: 0,
    totalEarnedLeave: 0
  };

  filteredStaff.forEach(staffMember => {
    const balance = leaveBalances[staffMember.id];
    if (balance) {
      totalStats.totalCasualLeave += balance.casualLeave || 0;
      totalStats.totalSickLeave += balance.sickLeave || 0;
      totalStats.totalEarnedLeave += balance.earnedLeave || 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Accrual System</h1>
          <p className="text-gray-600 mt-1">Automatic leave balance calculation based on tenure</p>
        </div>
        <button
          onClick={handleRecalculateAllAccruals}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          Recalculate All
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Leave Accrual Rules:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Casual Leave: 1 day per month worked</li>
            <li>Sick Leave: 0.5 days per month worked</li>
            <li>Earned Leave: 1.5 days per month worked</li>
            <li>Leave balance is calculated from joining date to current date</li>
            <li>Accruals are automatically calculated and can be manually refreshed</li>
          </ul>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <User size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success-100 rounded-lg">
              <Calendar size={24} className="text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total CL</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalCasualLeave.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning-100 rounded-lg">
              <TrendingUp size={24} className="text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total SL</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalSickLeave.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-info-100 rounded-lg">
              <Award size={24} className="text-info-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total EL</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalEarnedLeave.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <input
          type="text"
          placeholder="Search by name, employee ID, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Staff Leave Balances */}
      <div className="space-y-4">
        {filteredStaff.map(staffMember => {
          const balance = leaveBalances[staffMember.id];
          const monthsWorked = calculateMonthsWorked(staffMember.joiningDate);
          const yearsWorked = calculateYearsWorked(staffMember.joiningDate);
          const isExpanded = expandedStaff[staffMember.id];

          return (
            <div key={staffMember.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Staff Header */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{staffMember.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">{staffMember.employeeId}</span>
                        {staffMember.department && (
                          <span className="text-sm text-gray-600">• {staffMember.department}</span>
                        )}
                        {staffMember.joiningDate && (
                          <span className="text-sm text-gray-600">
                            • Joined: {formatDisplayDate(staffMember.joiningDate)}
                          </span>
                        )}
                        <span className="text-sm font-medium text-primary-600">
                          • {yearsWorked} years ({monthsWorked} months)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Leave Balance Summary */}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-success-50 rounded-lg px-4 py-3">
                      <p className="text-xs text-success-700 font-medium">Casual Leave</p>
                      <p className="text-2xl font-bold text-success-900 mt-1">
                        {balance?.casualLeave?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <div className="bg-warning-50 rounded-lg px-4 py-3">
                      <p className="text-xs text-warning-700 font-medium">Sick Leave</p>
                      <p className="text-2xl font-bold text-warning-900 mt-1">
                        {balance?.sickLeave?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <div className="bg-info-50 rounded-lg px-4 py-3">
                      <p className="text-xs text-info-700 font-medium">Earned Leave</p>
                      <p className="text-2xl font-bold text-info-900 mt-1">
                        {balance?.earnedLeave?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleRecalculateAccrual(staffMember.id)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={18} />
                    Recalculate
                  </button>
                  <button
                    onClick={() => toggleStaffExpanded(staffMember.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t px-6 py-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Accrual Calculation Details</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Casual Leave Calculation</p>
                      <div className="bg-white rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Months Worked:</span>
                          <span className="font-medium">{monthsWorked}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Accrual Rate:</span>
                          <span className="font-medium">1.0 / month</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Total CL:</span>
                          <span className="font-bold text-success-600">
                            {(monthsWorked * 1.0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Sick Leave Calculation</p>
                      <div className="bg-white rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Months Worked:</span>
                          <span className="font-medium">{monthsWorked}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Accrual Rate:</span>
                          <span className="font-medium">0.5 / month</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Total SL:</span>
                          <span className="font-bold text-warning-600">
                            {(monthsWorked * 0.5).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Earned Leave Calculation</p>
                      <div className="bg-white rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Months Worked:</span>
                          <span className="font-medium">{monthsWorked}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Accrual Rate:</span>
                          <span className="font-medium">1.5 / month</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Total EL:</span>
                          <span className="font-bold text-info-600">
                            {(monthsWorked * 1.5).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {balance?.calculatedDate && (
                    <p className="text-xs text-gray-500 mt-3">
                      Last calculated: {formatDisplayDate(balance.calculatedDate)} at {new Date(balance.calculatedDate).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredStaff.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No staff members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveAccrual;
