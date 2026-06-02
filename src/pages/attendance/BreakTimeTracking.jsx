import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, Clock, User, Calendar, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatDate, formatTime, formatDisplayDate, getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';

const BreakTimeTracking = () => {
  const [breaks, setBreaks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBreak, setExpandedBreak] = useState({});
  const [activeBreaks, setActiveBreaks] = useState({});

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedStaffId]);

  const loadData = () => {
    const allBreaks = payrollDataStore.getBreakRecords();
    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);

    // Filter breaks
    let filtered = allBreaks.filter(b => b.date === selectedDate);
    if (selectedStaffId !== 'all') {
      filtered = filtered.filter(b => b.staffId === selectedStaffId);
    }

    setBreaks(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    // Track active breaks
    const active = {};
    filtered.forEach(b => {
      if (b.status === 'in-progress') {
        active[b.staffId] = b;
      }
    });
    setActiveBreaks(active);
  };

  const handleStartBreak = (staffId) => {
    const activeBreak = activeBreaks[staffId];
    if (activeBreak) {
      toast.error('This staff member already has an active break');
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    try {
      payrollDataStore.addBreakRecord({
        staffId,
        date: selectedDate,
        startTime: currentTime,
        breakType: 'regular', // regular, lunch, tea
        remarks: ''
      });

      toast.success('Break started');
      loadData();
    } catch (error) {
      toast.error('Failed to start break');
    }
  };

  const handleEndBreak = (breakId) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    try {
      payrollDataStore.endBreak(breakId, currentTime);
      toast.success('Break ended');
      loadData();
    } catch (error) {
      toast.error('Failed to end break');
    }
  };

  const toggleExpanded = (breakId) => {
    setExpandedBreak(prev => ({
      ...prev,
      [breakId]: !prev[breakId]
    }));
  };

  const getStaffById = (staffId) => {
    return staff.find(s => s.id === staffId);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateStaffStats = (staffId) => {
    const staffBreaks = breaks.filter(b => b.staffId === staffId && b.status === 'completed');
    const totalBreaks = staffBreaks.length;
    const totalMinutes = staffBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    return {
      totalBreaks,
      totalMinutes,
      totalFormatted: formatDuration(totalMinutes)
    };
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = {
    totalBreaks: breaks.filter(b => b.status === 'completed').length,
    activeBreaks: Object.keys(activeBreaks).length,
    totalMinutes: breaks
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.durationMinutes || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Break Time Tracking</h1>
        <p className="text-gray-600 mt-1">Track employee break times and monitor productivity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Coffee size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Breaks Today</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalBreaks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Play size={24} className="text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Breaks</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.activeBreaks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-info-100 rounded-lg">
              <Clock size={24} className="text-info-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Break Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalStats.totalMinutes)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Staff</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Staff Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Break Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(staffMember => {
            const activeBreak = activeBreaks[staffMember.id];
            const stats = calculateStaffStats(staffMember.id);

            return (
              <div key={staffMember.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{staffMember.name}</h4>
                    <p className="text-xs text-gray-600">{staffMember.employeeId}</p>
                  </div>
                  {activeBreak && (
                    <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded-full animate-pulse">
                      On Break
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span>Breaks today:</span>
                    <span className="font-medium">{stats.totalBreaks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total time:</span>
                    <span className="font-medium">{stats.totalFormatted}</span>
                  </div>
                </div>

                {activeBreak ? (
                  <button
                    onClick={() => handleEndBreak(activeBreak.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Square size={18} />
                    End Break ({formatTime(activeBreak.startTime)})
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartBreak(staffMember.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-success-100 text-success-700 rounded-lg hover:bg-success-200 transition-colors"
                  >
                    <Play size={18} />
                    Start Break
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            No staff members found
          </div>
        )}
      </div>

      {/* Break History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Break History - {formatDisplayDate(selectedDate)}
        </h3>

        <div className="space-y-3">
          {breaks.map(breakRecord => {
            const staffMember = getStaffById(breakRecord.staffId);
            const isExpanded = expandedBreak[breakRecord.id];

            return (
              <div key={breakRecord.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {staffMember?.name || 'Unknown Staff'}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{staffMember?.employeeId}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTime(breakRecord.startTime)}
                          {breakRecord.endTime && ` - ${formatTime(breakRecord.endTime)}`}
                        </span>
                        {breakRecord.status === 'completed' && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-primary-600">
                              {formatDuration(breakRecord.durationMinutes)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      breakRecord.status === 'in-progress'
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-success-100 text-success-700'
                    }`}>
                      {breakRecord.status === 'in-progress' ? 'Active' : 'Completed'}
                    </span>

                    {breakRecord.status === 'in-progress' && (
                      <button
                        onClick={() => handleEndBreak(breakRecord.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        <Square size={14} />
                        End
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpanded(breakRecord.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Break Type</p>
                      <p className="font-medium text-gray-900 capitalize">{breakRecord.breakType || 'Regular'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Started At</p>
                      <p className="font-medium text-gray-900">{new Date(breakRecord.createdAt).toLocaleTimeString()}</p>
                    </div>
                    {breakRecord.remarks && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Remarks</p>
                        <p className="font-medium text-gray-900">{breakRecord.remarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {breaks.length === 0 && (
            <div className="text-center py-12">
              <Coffee size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No break records for selected date</p>
            </div>
          )}
        </div>
      </div>

      {/* Break Time Analytics */}
      {breaks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Break Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staff
              .filter(s => breaks.some(b => b.staffId === s.id))
              .map(staffMember => {
                const staffBreaks = breaks.filter(b => b.staffId === staffMember.id);
                const completedBreaks = staffBreaks.filter(b => b.status === 'completed');
                const totalMinutes = completedBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
                const avgMinutes = completedBreaks.length > 0 ? Math.round(totalMinutes / completedBreaks.length) : 0;

                return (
                  <div key={staffMember.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{staffMember.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Breaks:</span>
                        <span className="font-medium">{staffBreaks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium">{completedBreaks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Time:</span>
                        <span className="font-medium text-primary-600">{formatDuration(totalMinutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Duration:</span>
                        <span className="font-medium">{formatDuration(avgMinutes)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakTimeTracking;
