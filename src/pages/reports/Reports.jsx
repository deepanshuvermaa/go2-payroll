import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { reportAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const Reports = () => {
  const [reportType, setReportType] = useState('salary');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    generateReport();
  }, [reportType, selectedMonth, selectedYear]);

  const generateReport = () => {
    switch (reportType) {
      case 'salary':
        generateSalaryReport();
        break;
      case 'attendance':
        generateAttendanceReport();
        break;
      case 'leave':
        generateLeaveReport();
        break;
      case 'staff':
        generateStaffReport();
        break;
      default:
        setReportData([]);
        setSummary({});
    }
  };

  const generateSalaryReport = async () => {
    try {
      const res = await reportAPI.salaryRegister({ month: selectedMonth, year: selectedYear });
      const records = res?.data || res || [];
      if (records.length > 0) {
        setSummary({
          totalRecords: records.length,
          totalGross: records.reduce((s, r) => s + (r.grossSalary || r.gross || 0), 0),
          totalDeductions: records.reduce((s, r) => s + (r.totalDeductions || r.deductions || 0), 0),
          totalNet: records.reduce((s, r) => s + (r.netSalary || r.net || 0), 0),
        });
        setReportData(records);
        return;
      }
    } catch { /* fallback */ }
    const records = payrollDataStore.getSalaryRecords(selectedMonth, selectedYear);

    const totalGross = records.reduce((sum, r) => sum + r.grossSalary, 0);
    const totalDeductions = records.reduce((sum, r) => sum + r.totalDeductions, 0);
    const totalNet = records.reduce((sum, r) => sum + r.netSalary, 0);

    setSummary({
      totalRecords: records.length,
      totalGross,
      totalDeductions,
      totalNet,
    });

    setReportData(records);
  };

  const generateAttendanceReport = async () => {
    try {
      const res = await reportAPI.attendanceRegister({ month: selectedMonth, year: selectedYear });
      const records = res?.data || res || [];
      if (records.length > 0) {
        setSummary({
          totalStaff: records.length,
          avgAttendance: (records.reduce((s, r) => s + (r.attendancePercentage || 0), 0) / records.length || 0).toFixed(2),
          totalOvertimeHours: records.reduce((s, r) => s + (r.overtimeHours || 0), 0),
        });
        setReportData(records);
        return;
      }
    } catch { /* fallback */ }
    const attendance = payrollDataStore.getAttendance(selectedMonth, selectedYear);
    const staff = payrollDataStore.getStaff();

    const staffAttendanceMap = {};

    staff.forEach(s => {
      const staffAttendance = attendance.filter(a => a.staffId === s.id);
      const present = staffAttendance.filter(a => a.status === 'present').length;
      const halfDay = staffAttendance.filter(a => a.status === 'halfDay').length;
      const absent = staffAttendance.filter(a => a.status === 'absent').length;
      const leave = staffAttendance.filter(a => a.status === 'leave').length;
      const overtimeHours = staffAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

      staffAttendanceMap[s.id] = {
        id: s.id,
        employeeId: s.employeeId,
        name: s.name,
        department: s.department,
        present,
        halfDay,
        absent,
        leave,
        overtimeHours,
        attendancePercentage: ((present + halfDay * 0.5) / (present + halfDay + absent + leave) * 100 || 0).toFixed(2),
      };
    });

    const reportData = Object.values(staffAttendanceMap);

    setSummary({
      totalStaff: reportData.length,
      avgAttendance: (reportData.reduce((sum, s) => sum + parseFloat(s.attendancePercentage), 0) / reportData.length || 0).toFixed(2),
      totalOvertimeHours: reportData.reduce((sum, s) => sum + s.overtimeHours, 0),
    });

    setReportData(reportData);
  };

  const generateLeaveReport = async () => {
    try {
      const res = await reportAPI.attrition({ month: selectedMonth, year: selectedYear });
      const records = res?.data || res || [];
      if (records.length > 0) { setReportData(records); setSummary({ total: records.length }); return; }
    } catch { /* fallback */ }
    const leaves = payrollDataStore.getLeaveApplications();
    const filteredLeaves = leaves.filter(l => {
      const date = new Date(l.appliedDate);
      return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
    });

    const approved = filteredLeaves.filter(l => l.status === 'approved').length;
    const rejected = filteredLeaves.filter(l => l.status === 'rejected').length;
    const pending = filteredLeaves.filter(l => l.status === 'pending').length;
    const totalDays = filteredLeaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.leaveDays, 0);

    setSummary({
      total: filteredLeaves.length,
      approved,
      rejected,
      pending,
      totalDays,
    });

    setReportData(filteredLeaves);
  };

  const generateStaffReport = async () => {
    try {
      const res = await reportAPI.headcount();
      const records = res?.data || res || [];
      if (records.length > 0) {
        setSummary({ total: records.length, active: records.filter(r => r.status === 'ACTIVE').length, inactive: records.filter(r => r.status !== 'ACTIVE').length });
        setReportData(records);
        return;
      }
    } catch { /* fallback */ }
    const staff = payrollDataStore.getStaff();

    const activeStaff = staff.filter(s => s.status === 'active').length;
    const inactiveStaff = staff.filter(s => s.status === 'inactive').length;
    const totalSalary = staff.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.salary?.basic || 0), 0);

    setSummary({
      total: staff.length,
      active: activeStaff,
      inactive: inactiveStaff,
      totalSalary,
    });

    setReportData(staff);
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    let worksheetData = [];
    let filename = '';

    switch (reportType) {
      case 'salary':
        filename = `Salary_Report_${selectedMonth}_${selectedYear}.xlsx`;
        worksheetData = reportData.map(r => ({
          'Employee ID': r.employeeId,
          'Name': r.staffName,
          'Department': r.department,
          'Designation': r.designation,
          'Working Days': r.workingDays,
          'Present': r.attendance.present,
          'Absent': r.attendance.absent,
          'Gross Salary': r.grossSalary,
          'Total Deductions': r.totalDeductions,
          'Net Salary': r.netSalary,
          'Status': r.paymentStatus,
        }));
        break;

      case 'attendance':
        filename = `Attendance_Report_${selectedMonth}_${selectedYear}.xlsx`;
        worksheetData = reportData.map(r => ({
          'Employee ID': r.employeeId,
          'Name': r.name,
          'Department': r.department,
          'Present': r.present,
          'Half Day': r.halfDay,
          'Absent': r.absent,
          'Leave': r.leave,
          'Overtime Hours': r.overtimeHours,
          'Attendance %': r.attendancePercentage,
        }));
        break;

      case 'leave':
        filename = `Leave_Report_${selectedMonth}_${selectedYear}.xlsx`;
        worksheetData = reportData.map(r => ({
          'Employee ID': r.employeeId,
          'Name': r.staffName,
          'Leave Type': r.leaveType,
          'Start Date': formatDate(new Date(r.startDate), 'yyyy-MM-dd'),
          'End Date': formatDate(new Date(r.endDate), 'yyyy-MM-dd'),
          'Days': r.leaveDays,
          'Reason': r.reason,
          'Status': r.status,
          'Applied On': formatDate(new Date(r.appliedDate), 'yyyy-MM-dd'),
        }));
        break;

      case 'staff':
        filename = `Staff_Report_${selectedYear}.xlsx`;
        worksheetData = reportData.map(s => ({
          'Employee ID': s.employeeId,
          'Name': s.name,
          'Email': s.email,
          'Phone': s.phone,
          'Department': s.department,
          'Designation': s.designation,
          'Joining Date': formatDate(new Date(s.joiningDate), 'yyyy-MM-dd'),
          'Basic Salary': s.salary?.basic || 0,
          'Status': s.status,
        }));
        break;
    }

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, filename);

    toast.success('Report exported to Excel');
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const doc = new jsPDF();
    let title = '';
    let headers = [];
    let data = [];

    switch (reportType) {
      case 'salary':
        title = `Salary Report - ${getMonthName(selectedMonth)} ${selectedYear}`;
        headers = [['Emp ID', 'Name', 'Department', 'Working Days', 'Present', 'Gross', 'Deductions', 'Net Salary']];
        data = reportData.map(r => [
          r.employeeId,
          r.staffName,
          r.department,
          r.workingDays,
          r.attendance.present,
          formatCurrency(r.grossSalary),
          formatCurrency(r.totalDeductions),
          formatCurrency(r.netSalary),
        ]);
        break;

      case 'attendance':
        title = `Attendance Report - ${getMonthName(selectedMonth)} ${selectedYear}`;
        headers = [['Emp ID', 'Name', 'Department', 'Present', 'Half Day', 'Absent', 'Leave', 'Attendance %']];
        data = reportData.map(r => [
          r.employeeId,
          r.name,
          r.department,
          r.present,
          r.halfDay,
          r.absent,
          r.leave,
          r.attendancePercentage + '%',
        ]);
        break;

      case 'leave':
        title = `Leave Report - ${getMonthName(selectedMonth)} ${selectedYear}`;
        headers = [['Emp ID', 'Name', 'Type', 'Start Date', 'End Date', 'Days', 'Status']];
        data = reportData.map(r => [
          r.employeeId,
          r.staffName,
          r.leaveType,
          formatDate(new Date(r.startDate), 'MMM dd'),
          formatDate(new Date(r.endDate), 'MMM dd'),
          r.leaveDays,
          r.status,
        ]);
        break;

      case 'staff':
        title = `Staff Report - ${selectedYear}`;
        headers = [['Emp ID', 'Name', 'Department', 'Designation', 'Joining Date', 'Basic Salary', 'Status']];
        data = reportData.map(s => [
          s.employeeId,
          s.name,
          s.department,
          s.designation,
          formatDate(new Date(s.joiningDate), 'MMM dd, yyyy'),
          formatCurrency(s.salary?.basic || 0),
          s.status,
        ]);
        break;
    }

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 15, { align: 'center' });

    // Table
    doc.autoTable({
      head: headers,
      body: data,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const filename = `${reportType}_report_${selectedMonth}_${selectedYear}.pdf`;
    doc.save(filename);

    toast.success('Report exported to PDF');
  };

  const getMonthName = (month) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and export payroll reports</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Report Type</label>
            <select
              className="form-input"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="salary">Salary Report</option>
              <option value="attendance">Attendance Report</option>
              <option value="leave">Leave Report</option>
              <option value="staff">Staff Report</option>
            </select>
          </div>

          <div>
            <label className="form-label">Month</label>
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

          <div>
            <label className="form-label">Year</label>
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

          <div className="flex items-end gap-2">
            <button
              onClick={exportToExcel}
              className="btn btn-success flex-1 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="btn btn-danger flex-1 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportType === 'salary' && (
          <>
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalRecords || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <FileText className="text-primary-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Gross</p>
                  <p className="text-2xl font-bold text-success-600">{formatCurrency(summary.totalGross || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-success-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                  <p className="text-2xl font-bold text-danger-600">{formatCurrency(summary.totalDeductions || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-danger-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Net</p>
                  <p className="text-2xl font-bold text-info-600">{formatCurrency(summary.totalNet || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-info-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-info-600" size={24} />
                </div>
              </div>
            </div>
          </>
        )}

        {reportType === 'attendance' && (
          <>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Total Staff</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalStaff || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
              <p className="text-3xl font-bold text-success-600">{summary.avgAttendance || 0}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Total Overtime</p>
              <p className="text-3xl font-bold text-warning-600">{summary.totalOvertimeHours || 0} hrs</p>
            </div>
          </>
        )}

        {reportType === 'leave' && (
          <>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-success-600">{summary.approved || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-warning-600">{summary.pending || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Total Days</p>
              <p className="text-3xl font-bold text-info-600">{summary.totalDays || 0}</p>
            </div>
          </>
        )}

        {reportType === 'staff' && (
          <>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Total Staff</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-success-600">{summary.active || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-warning-600">{summary.inactive || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Total Salary</p>
              <p className="text-2xl font-bold text-info-600">{formatCurrency(summary.totalSalary || 0)}</p>
            </div>
          </>
        )}
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>

        {reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="text-sm text-gray-600 mb-4">
              Showing {reportData.length} record(s)
            </div>

            {/* Salary Report Table */}
            {reportType === 'salary' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Working Days</th>
                    <th>Present</th>
                    <th>Gross Salary</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="font-mono text-sm">{r.employeeId}</td>
                      <td>{r.staffName}</td>
                      <td>{r.department}</td>
                      <td className="text-center">{r.workingDays}</td>
                      <td className="text-center">{r.attendance.present}</td>
                      <td className="font-semibold">{formatCurrency(r.grossSalary)}</td>
                      <td className="text-danger-600">{formatCurrency(r.totalDeductions)}</td>
                      <td className="font-bold text-success-600">{formatCurrency(r.netSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Attendance Report Table */}
            {reportType === 'attendance' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Present</th>
                    <th>Half Day</th>
                    <th>Absent</th>
                    <th>Leave</th>
                    <th>Overtime</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="font-mono text-sm">{r.employeeId}</td>
                      <td>{r.name}</td>
                      <td>{r.department}</td>
                      <td className="text-center text-success-600">{r.present}</td>
                      <td className="text-center text-warning-600">{r.halfDay}</td>
                      <td className="text-center text-danger-600">{r.absent}</td>
                      <td className="text-center text-info-600">{r.leave}</td>
                      <td className="text-center">{r.overtimeHours} hrs</td>
                      <td className="text-center font-semibold">{r.attendancePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Leave Report Table */}
            {reportType === 'leave' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="font-mono text-sm">{r.employeeId}</td>
                      <td>{r.staffName}</td>
                      <td>{r.leaveType}</td>
                      <td>{formatDate(new Date(r.startDate), 'MMM dd, yyyy')}</td>
                      <td>{formatDate(new Date(r.endDate), 'MMM dd, yyyy')}</td>
                      <td className="text-center">{r.leaveDays}</td>
                      <td className="max-w-xs truncate">{r.reason}</td>
                      <td>
                        <span className={`badge ${
                          r.status === 'approved' ? 'badge-success' :
                          r.status === 'rejected' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Staff Report Table */}
            {reportType === 'staff' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joining Date</th>
                    <th>Basic Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((s, i) => (
                    <tr key={i}>
                      <td className="font-mono text-sm">{s.employeeId}</td>
                      <td>{s.name}</td>
                      <td className="text-sm">{s.email}</td>
                      <td>{s.phone}</td>
                      <td>{s.department}</td>
                      <td>{s.designation}</td>
                      <td>{formatDate(new Date(s.joiningDate), 'MMM dd, yyyy')}</td>
                      <td className="font-semibold">{formatCurrency(s.salary?.basic || 0)}</td>
                      <td>
                        <span className={`badge ${
                          s.status === 'active' ? 'badge-success' :
                          s.status === 'inactive' ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
