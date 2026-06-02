import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit, Trash2, Download, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const ReportBuilder = () => {
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('my-reports');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    reportType: 'salary',
    description: '',
    filters: {}
  });
  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    reportId: '',
    frequency: 'monthly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    emailTo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allReports = payrollDataStore.getCustomReports();
    setReports(allReports);
    const allSchedules = payrollDataStore.getScheduledReports();
    setSchedules(allSchedules);
  };

  const handleCreateReport = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter report name');
      return;
    }

    const result = payrollDataStore.addCustomReport(formData);
    if (result.success) {
      toast.success('Report created successfully');
      loadData();
      setShowCreateModal(false);
      resetForm();
    } else {
      toast.error(result.message || 'Failed to create report');
    }
  };

  const handleRunReport = (reportId) => {
    const result = payrollDataStore.runCustomReport(reportId);
    if (result.success) {
      setReportResult(result);
      toast.success('Report generated successfully');
    } else {
      toast.error(result.message || 'Failed to run report');
    }
  };

  const handleDeleteReport = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const result = payrollDataStore.deleteCustomReport(reportId);
      if (result.success) {
        toast.success('Report deleted successfully');
        loadData();
      }
    }
  };

  const handleCreateSchedule = () => {
    if (!scheduleFormData.name.trim() || !scheduleFormData.reportId) {
      toast.error('Please fill all required fields');
      return;
    }

    const result = payrollDataStore.addScheduledReport(scheduleFormData);
    if (result.success) {
      toast.success('Schedule created successfully');
      loadData();
      setShowScheduleModal(false);
      resetScheduleForm();
    } else {
      toast.error(result.message || 'Failed to create schedule');
    }
  };

  const handleToggleSchedule = (scheduleId) => {
    const result = payrollDataStore.toggleScheduledReport(scheduleId);
    if (result.success) {
      toast.success('Schedule status updated');
      loadData();
    }
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      const result = payrollDataStore.deleteScheduledReport(scheduleId);
      if (result.success) {
        toast.success('Schedule deleted successfully');
        loadData();
      }
    }
  };

  const handleExportReport = (format) => {
    if (!reportResult) {
      toast.error('No report data to export');
      return;
    }

    const { reportName, columns, data } = reportResult;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ reportName, columns, data }, null, 2)], { type: 'application/json' });
      downloadFile(blob, `${reportName}_${Date.now()}.json`);
    } else if (format === 'csv') {
      const csvContent = [
        columns.join(','),
        ...data.map(row => columns.map(col => `"${row[col] || ''}"`).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      downloadFile(blob, `${reportName}_${Date.now()}.csv`);
    }

    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({ name: '', reportType: 'salary', description: '', filters: {} });
  };

  const resetScheduleForm = () => {
    setScheduleFormData({ name: '', reportId: '', frequency: 'monthly', dayOfWeek: 1, dayOfMonth: 1, emailTo: '' });
  };

  const reportTypes = [
    { value: 'salary', label: 'Salary Report' },
    { value: 'attendance', label: 'Attendance Report' },
    { value: 'leave', label: 'Leave Report' },
    { value: 'tax', label: 'Tax Report' },
    { value: 'department', label: 'Department Analysis' },
    { value: 'statutory', label: 'Statutory Report' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
          <p className="text-gray-600 mt-1">Create & manage custom reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScheduleModal(true)} className="btn-secondary flex items-center gap-2">
            <Clock size={20} />
            Schedule Report
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Create Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('my-reports')}
          className={`pb-2 px-4 ${activeTab === 'my-reports' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          My Reports
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`pb-2 px-4 ${activeTab === 'scheduled' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Scheduled Reports
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-2 px-4 ${activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Report Results
        </button>
      </div>

      {/* My Reports Tab */}
      {activeTab === 'my-reports' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Custom Reports</h3>
          {reports.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No custom reports created yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => (
                <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">{report.name}</h4>
                      <p className="text-sm text-gray-600">{reportTypes.find(t => t.value === report.reportType)?.label}</p>
                    </div>
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  {report.description && <p className="text-sm text-gray-600 mb-3">{report.description}</p>}
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>Runs: {report.runCount || 0}</span>
                    {report.lastRunAt && <span>Last: {new Date(report.lastRunAt).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRunReport(report.id)} className="btn-primary text-sm flex-1 flex items-center justify-center gap-1">
                      <Play size={16} />
                      Run
                    </button>
                    <button onClick={() => handleDeleteReport(report.id)} className="btn-danger text-sm px-3">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
          {schedules.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No scheduled reports</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Schedule Name</th>
                  <th className="text-left py-2 px-2">Report</th>
                  <th className="text-left py-2 px-2">Frequency</th>
                  <th className="text-left py-2 px-2">Next Run</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(schedule => {
                  const report = reports.find(r => r.id === schedule.reportId);
                  return (
                    <tr key={schedule.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium">{schedule.name}</td>
                      <td className="py-2 px-2">{report?.name || 'N/A'}</td>
                      <td className="py-2 px-2 capitalize">{schedule.frequency}</td>
                      <td className="py-2 px-2">{new Date(schedule.nextRunAt).toLocaleString()}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${schedule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleSchedule(schedule.id)} className="text-blue-600 hover:text-blue-800 text-xs">
                            {schedule.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeleteSchedule(schedule.id)} className="text-red-600 hover:text-red-800 text-xs">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Report Results Tab */}
      {activeTab === 'results' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Report Results</h3>
            {reportResult && (
              <div className="flex gap-2">
                <button onClick={() => handleExportReport('csv')} className="btn-secondary text-sm flex items-center gap-2">
                  <Download size={16} />
                  Export CSV
                </button>
                <button onClick={() => handleExportReport('json')} className="btn-secondary text-sm flex items-center gap-2">
                  <Download size={16} />
                  Export JSON
                </button>
              </div>
            )}
          </div>

          {!reportResult ? (
            <p className="text-center py-8 text-gray-500">Run a report to see results here</p>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="font-semibold">{reportResult.reportName}</p>
                <p className="text-sm text-gray-600">Type: {reportResult.reportType} | Records: {reportResult.totalRecords} | Generated: {new Date(reportResult.generatedAt).toLocaleString()}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {reportResult.columns.map((col, idx) => (
                        <th key={idx} className="text-left py-2 px-2 font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.data.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        {reportResult.columns.map((col, colIdx) => (
                          <td key={colIdx} className="py-2 px-2">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create Custom Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Report Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Monthly Salary Report"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Report Type</label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  className="input"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Describe what this report shows..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateReport} className="btn-primary flex-1">Create Report</button>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Schedule Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={scheduleFormData.name}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, name: e.target.value })}
                  className="input"
                  placeholder="Monthly Payroll Report"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Report</label>
                <select
                  value={scheduleFormData.reportId}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, reportId: e.target.value })}
                  className="input"
                >
                  <option value="">Choose a report...</option>
                  {reports.map(report => (
                    <option key={report.id} value={report.id}>{report.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  value={scheduleFormData.frequency}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, frequency: e.target.value })}
                  className="input"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {scheduleFormData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Day of Week</label>
                  <select
                    value={scheduleFormData.dayOfWeek}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, dayOfWeek: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>
              )}
              {scheduleFormData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleFormData.dayOfMonth}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, dayOfMonth: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateSchedule} className="btn-primary flex-1">Create Schedule</button>
              <button onClick={() => { setShowScheduleModal(false); resetScheduleForm(); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportBuilder;
