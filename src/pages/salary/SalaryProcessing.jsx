import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Eye, ChevronDown, ChevronUp, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import payrollDataStore from '../../services/payrollDataStore';
import { calculateEarnings, calculateDeductions, calculateNetSalary, finalizeSalaryDeductions } from '../../utils/salaryCalculations';
import { formatCurrency, formatDate, getCurrentMonthYear, getWorkingDaysInMonth } from '../../utils/dateHelpers';

const SalaryProcessing = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [staff, setStaff] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [expandedStaff, setExpandedStaff] = useState(null);
  const [processingAll, setProcessingAll] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = () => {
    // Load active staff
    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);

    // Load salary records for selected month
    const records = payrollDataStore.getSalaryRecords(selectedMonth, selectedYear);
    setSalaryRecords(records);
  };

  const getAttendanceSummary = (staffId) => {
    const attendance = payrollDataStore.getAttendance(selectedMonth, selectedYear);
    const staffAttendance = attendance.filter(a => a.staffId === staffId);

    const present = staffAttendance.filter(a => a.status === 'present').length;
    const halfDay = staffAttendance.filter(a => a.status === 'halfDay').length;
    const absent = staffAttendance.filter(a => a.status === 'absent').length;
    const leave = staffAttendance.filter(a => a.status === 'leave').length;
    const overtimeHours = staffAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const lateMarks = staffAttendance.reduce((sum, a) => sum + (a.lateMarks || 0), 0);

    return { present, halfDay, absent, leave, overtimeHours, lateMarks, month: selectedMonth, year: selectedYear };
  };

  const calculateSalary = (staffMember) => {
    const attendance = getAttendanceSummary(staffMember.id);
    const workingDays = getWorkingDaysInMonth(selectedMonth, selectedYear);

    const earnings = calculateEarnings(staffMember, attendance, workingDays);
    const deductions = calculateDeductions(staffMember, attendance, earnings.totalEarnings);
    const netSalary = calculateNetSalary(earnings, deductions);

    return {
      attendance,
      workingDays,
      earnings,
      deductions,
      netSalary,
    };
  };

  const handleProcessSalary = (staffMember) => {
    // Prevent duplicate processing for the same month
    const existing = payrollDataStore.getSalaryByStaff(staffMember.id, selectedMonth, selectedYear);
    if (existing) {
      toast.error(`Salary already processed for ${staffMember.name} this month`);
      return;
    }

    const salaryData = calculateSalary(staffMember);

    const salaryRecord = {
      staffId: staffMember.id,
      staffName: staffMember.name,
      employeeId: staffMember.employeeId,
      department: staffMember.department,
      designation: staffMember.designation,
      month: selectedMonth,
      year: selectedYear,
      workingDays: salaryData.workingDays,
      attendance: salaryData.attendance,
      earnings: salaryData.earnings,
      deductions: salaryData.deductions,
      grossSalary: salaryData.netSalary.grossSalary,
      totalDeductions: salaryData.netSalary.totalDeductions,
      netSalary: salaryData.netSalary.netSalary,
      processedDate: new Date().toISOString(),
      paymentStatus: 'pending',
      paymentDate: null,
      paymentMethod: null,
      transactionId: null,
      notes: '',
    };

    const saved = payrollDataStore.addSalaryRecord(salaryRecord);
    if (saved) {
      // Only now finalize deductions (mutate advance/loan balances)
      finalizeSalaryDeductions(
        staffMember.id,
        salaryData.deductions.advanceDetails,
        salaryData.deductions.loanDetails
      );
      toast.success(`Salary processed for ${staffMember.name}`);
      loadData();
    }
  };

  const handleProcessAllSalaries = async () => {
    setProcessingAll(true);

    const unprocessedStaff = staff.filter(s =>
      !salaryRecords.find(r => r.staffId === s.id)
    );

    if (unprocessedStaff.length === 0) {
      toast.error('All staff salaries already processed for this month');
      setProcessingAll(false);
      return;
    }

    for (const staffMember of unprocessedStaff) {
      handleProcessSalary(staffMember);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    toast.success(`Processed ${unprocessedStaff.length} salaries`);
    setProcessingAll(false);
  };

  const handleDownloadSalarySlip = (staffMember, record) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Helper function to format currency for PDF (avoiding rupee symbol encoding issues)
    const formatPDFCurrency = (amount) => {
      return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Company Header with background
    doc.setFillColor(59, 130, 246); // Primary blue
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SALARY SLIP', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${getMonthName(record.month)} ${record.year}`, pageWidth / 2, 25, { align: 'center' });

    // Employee Details Box
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, 40, 180, 35);

    // Left column
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Name:', 20, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(staffMember.name, 58, 48);

    doc.setFont('helvetica', 'bold');
    doc.text('Employee ID:', 20, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(staffMember.employeeId, 58, 56);

    doc.setFont('helvetica', 'bold');
    doc.text('Department:', 20, 64);
    doc.setFont('helvetica', 'normal');
    doc.text(staffMember.department, 58, 64);

    doc.setFont('helvetica', 'bold');
    doc.text('Designation:', 20, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(staffMember.designation, 58, 72);

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Working Days:', 120, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(record.workingDays.toString(), 165, 48);

    doc.setFont('helvetica', 'bold');
    doc.text('Days Present:', 120, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(record.attendance.present.toString(), 165, 56);

    doc.setFont('helvetica', 'bold');
    doc.text('Half Days:', 120, 64);
    doc.setFont('helvetica', 'normal');
    doc.text(record.attendance.halfDay.toString(), 165, 64);

    doc.setFont('helvetica', 'bold');
    doc.text('Days Absent:', 120, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(record.attendance.absent.toString(), 165, 72);

    // Salary Breakdown Table
    let yPos = 85;

    // Earnings Column Header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos, 85, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('EARNINGS', 18, yPos + 6);

    // Deductions Column Header
    doc.rect(110, yPos, 85, 8, 'F');
    doc.text('DEDUCTIONS', 113, yPos + 6);

    yPos += 8;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Build earnings list
    const earningItems = [];
    if (record.earnings.basicPay) earningItems.push(['Basic Pay', record.earnings.basicPay]);
    if (record.earnings.hra) earningItems.push(['HRA', record.earnings.hra]);
    if (record.earnings.conveyance) earningItems.push(['Conveyance', record.earnings.conveyance]);
    if (record.earnings.medical) earningItems.push(['Medical Allowance', record.earnings.medical]);
    if (record.earnings.overtimePay) earningItems.push(['Overtime Pay', record.earnings.overtimePay]);
    if (record.earnings.bonus) earningItems.push(['Bonus', record.earnings.bonus]);
    if (record.earnings.incentive) earningItems.push(['Incentive', record.earnings.incentive]);
    if (record.deductions?.arrears) earningItems.push(['Arrears', record.deductions.arrears]);
    if (record.earnings.otherAllowances) earningItems.push(['Other Allowances', record.earnings.otherAllowances]);

    // Build deductions list
    const deductionItems = [];
    if (record.deductions.pf) deductionItems.push(['Provident Fund', record.deductions.pf]);
    if (record.deductions.esi) deductionItems.push(['ESI', record.deductions.esi]);
    if (record.deductions.pt) deductionItems.push(['Professional Tax', record.deductions.pt]);
    if (record.deductions.tds) deductionItems.push(['TDS', record.deductions.tds]);
    if (record.deductions.lateMarkPenalty) deductionItems.push(['Late Mark Penalty', record.deductions.lateMarkPenalty]);
    if (record.deductions.advance) deductionItems.push(['Salary Advance', record.deductions.advance]);
    if (record.deductions.loan) deductionItems.push(['Loan EMI', record.deductions.loan]);

    // Draw rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const maxRows = Math.max(earningItems.length, deductionItems.length);

    for (let i = 0; i < maxRows; i++) {
      const rowY = yPos + (i * 8);

      // Earnings row
      if (i < earningItems.length) {
        doc.text(earningItems[i][0], 18, rowY + 5);
        doc.text(formatPDFCurrency(earningItems[i][1]), 95, rowY + 5, { align: 'right' });
      }

      // Deductions row
      if (i < deductionItems.length) {
        doc.text(deductionItems[i][0], 113, rowY + 5);
        doc.text(formatPDFCurrency(deductionItems[i][1]), 190, rowY + 5, { align: 'right' });
      }
    }

    yPos += (maxRows * 8);

    // Draw borders
    doc.rect(15, 85, 85, yPos - 85);
    doc.rect(110, 85, 85, yPos - 85);

    // Totals row
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPos, 85, 10, 'F');
    doc.rect(110, yPos, 85, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('Total Earnings', 18, yPos + 7);
    doc.text(formatPDFCurrency(record.earnings.totalEarnings), 95, yPos + 7, { align: 'right' });

    doc.text('Total Deductions', 113, yPos + 7);
    doc.text(formatPDFCurrency(record.deductions.totalDeductions), 190, yPos + 7, { align: 'right' });

    // Net Salary Box
    yPos += 18;
    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPos, 180, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('NET SALARY PAYABLE', 20, yPos + 9);
    doc.text(formatPDFCurrency(record.netSalary), 190, yPos + 9, { align: 'right' });

    // Footer
    yPos += 25;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated salary slip. No signature required.', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${formatDate(new Date(), 'dd MMM yyyy')}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
    doc.text('Go2-Payroll Management System', pageWidth / 2, pageHeight - 3, { align: 'center' });

    // Save PDF
    const fileName = `SalarySlip_${staffMember.employeeId}_${getMonthName(record.month)}_${record.year}.pdf`;
    doc.save(fileName);
    toast.success('Salary slip downloaded');
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const toggleExpand = (staffId) => {
    setExpandedStaff(expandedStaff === staffId ? null : staffId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Processing</h1>
          <p className="text-gray-600 mt-1">Process monthly salaries and generate salary slips</p>
        </div>
        <button
          onClick={handleProcessAllSalaries}
          disabled={processingAll}
          className="btn btn-primary flex items-center gap-2"
        >
          {processingAll ? (
            <>
              <div className="spinner"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <DollarSign size={20} />
              Process All Salaries
            </>
          )}
        </button>
      </div>

      {/* Month/Year Selection */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="form-label">Select Month</label>
            <select
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="form-label">Select Year</label>
            <select
              className="form-input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Salary List */}
      <div className="space-y-4">
        {staff.length > 0 ? (
          staff.map(staffMember => {
            const record = salaryRecords.find(r => r.staffId === staffMember.id);
            const salaryData = record || calculateSalary(staffMember);
            const isExpanded = expandedStaff === staffMember.id;

            return (
              <div key={staffMember.id} className="bg-white rounded-lg shadow-card overflow-hidden">
                {/* Staff Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{staffMember.name}</h3>
                          <p className="text-sm text-gray-500">
                            {staffMember.employeeId} • {staffMember.department} • {staffMember.designation}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {record ? (
                        <>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Net Salary</p>
                            <p className="text-2xl font-bold text-success-600">
                              {formatCurrency(record.netSalary)}
                            </p>
                          </div>
                          <span className="badge badge-success">Processed</span>
                          <button
                            onClick={() => handleDownloadSalarySlip(staffMember, record)}
                            className="btn btn-secondary flex items-center gap-2"
                          >
                            <Download size={18} />
                            Download Slip
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Net Salary</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(salaryData.netSalary.netSalary)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleProcessSalary(staffMember)}
                            className="btn btn-primary flex items-center gap-2"
                          >
                            <DollarSign size={18} />
                            Process Salary
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toggleExpand(staffMember.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                      {/* Attendance Summary */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Attendance Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Working Days:</span>
                            <span className="font-medium">{salaryData.workingDays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Present:</span>
                            <span className="font-medium text-success-600">{salaryData.attendance.present}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Half Day:</span>
                            <span className="font-medium text-warning-600">{salaryData.attendance.halfDay}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Absent:</span>
                            <span className="font-medium text-danger-600">{salaryData.attendance.absent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Leave:</span>
                            <span className="font-medium text-info-600">{salaryData.attendance.leave}</span>
                          </div>
                          {salaryData.attendance.overtimeHours > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Overtime Hours:</span>
                              <span className="font-medium">{salaryData.attendance.overtimeHours}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Earnings */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Earnings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Basic Pay:</span>
                            <span className="font-medium">{formatCurrency(salaryData.earnings.basicPay)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">HRA:</span>
                            <span className="font-medium">{formatCurrency(salaryData.earnings.hra)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Conveyance:</span>
                            <span className="font-medium">{formatCurrency(salaryData.earnings.conveyance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Medical:</span>
                            <span className="font-medium">{formatCurrency(salaryData.earnings.medical)}</span>
                          </div>
                          {salaryData.earnings.overtimePay > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Overtime:</span>
                              <span className="font-medium">{formatCurrency(salaryData.earnings.overtimePay)}</span>
                            </div>
                          )}
                          {salaryData.earnings.bonus > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bonus:</span>
                              <span className="font-medium text-success-600">{formatCurrency(salaryData.earnings.bonus)}</span>
                            </div>
                          )}
                          {salaryData.earnings.incentive > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Incentive:</span>
                              <span className="font-medium text-success-600">{formatCurrency(salaryData.earnings.incentive)}</span>
                            </div>
                          )}
                          {salaryData.deductions?.arrears > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Arrears:</span>
                              <span className="font-medium text-info-600">{formatCurrency(salaryData.deductions.arrears)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t font-semibold">
                            <span>Total Earnings:</span>
                            <span className="text-success-600">{formatCurrency(salaryData.earnings.totalEarnings)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Deductions</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">PF (12%):</span>
                            <span className="font-medium">{formatCurrency(salaryData.deductions.pf)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ESI (0.75%):</span>
                            <span className="font-medium">{formatCurrency(salaryData.deductions.esi)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Professional Tax:</span>
                            <span className="font-medium">{formatCurrency(salaryData.deductions.pt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">TDS:</span>
                            <span className="font-medium">{formatCurrency(salaryData.deductions.tds)}</span>
                          </div>
                          {salaryData.deductions.lateMarkPenalty > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Late Mark Penalty:</span>
                              <span className="font-medium text-danger-600">{formatCurrency(salaryData.deductions.lateMarkPenalty)}</span>
                            </div>
                          )}
                          {salaryData.deductions.advance > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Salary Advance:</span>
                              <span className="font-medium text-danger-600">{formatCurrency(salaryData.deductions.advance)}</span>
                            </div>
                          )}
                          {salaryData.deductions.loan > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Loan EMI:</span>
                              <span className="font-medium text-danger-600">{formatCurrency(salaryData.deductions.loan)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t font-semibold">
                            <span>Total Deductions:</span>
                            <span className="text-danger-600">{formatCurrency(salaryData.deductions.totalDeductions)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No active staff members found</p>
            <p className="text-sm text-gray-500 mt-2">Add staff members to process salaries</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryProcessing;
