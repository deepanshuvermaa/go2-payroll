import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Users, Calendar, Save, X, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatTime, formatDate, getMonthDates, getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' or 'roster'
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [searchTerm, setSearchTerm] = useState('');

  // Shift Form State
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    graceTime: 15, // minutes
    halfDayHours: 4,
    fullDayHours: 8,
    weeklyOffs: ['Sunday'],
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setShifts(payrollDataStore.getShifts());
    setRosters(payrollDataStore.getRosters());
    setStaff(payrollDataStore.getStaff());
  };

  const handleShiftFormChange = (field, value) => {
    setShiftForm(prev => ({ ...prev, [field]: value }));
  };

  const handleWeeklyOffToggle = (day) => {
    setShiftForm(prev => ({
      ...prev,
      weeklyOffs: prev.weeklyOffs.includes(day)
        ? prev.weeklyOffs.filter(d => d !== day)
        : [...prev.weeklyOffs, day]
    }));
  };

  const handleSaveShift = () => {
    // Validation
    if (!shiftForm.name.trim()) {
      toast.error('Please enter shift name');
      return;
    }

    if (!shiftForm.startTime || !shiftForm.endTime) {
      toast.error('Please enter shift timings');
      return;
    }

    try {
      if (editingShift) {
        payrollDataStore.updateShift(editingShift.id, shiftForm);
        toast.success('Shift updated successfully');
      } else {
        payrollDataStore.addShift(shiftForm);
        toast.success('Shift created successfully');
      }

      loadData();
      handleCloseShiftModal();
    } catch (error) {
      toast.error('Failed to save shift');
    }
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setShiftForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      graceTime: shift.graceTime,
      halfDayHours: shift.halfDayHours,
      fullDayHours: shift.fullDayHours,
      weeklyOffs: shift.weeklyOffs || ['Sunday'],
      description: shift.description || ''
    });
    setShowShiftModal(true);
  };

  const handleDeleteShift = (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      payrollDataStore.deleteShift(shiftId);
      toast.success('Shift deleted successfully');
      loadData();
    }
  };

  const handleCloseShiftModal = () => {
    setShowShiftModal(false);
    setEditingShift(null);
    setShiftForm({
      name: '',
      startTime: '09:00',
      endTime: '18:00',
      graceTime: 15,
      halfDayHours: 4,
      fullDayHours: 8,
      weeklyOffs: ['Sunday'],
      description: ''
    });
  };

  const handleAssignShiftToStaff = (staffId, date, shiftId) => {
    const existingRoster = rosters.find(
      r => r.staffId === staffId && r.date === date
    );

    try {
      if (existingRoster) {
        payrollDataStore.updateRoster(existingRoster.id, { shiftId });
      } else {
        payrollDataStore.addRoster({
          staffId,
          date,
          shiftId
        });
      }
      loadData();
      toast.success('Shift assigned successfully');
    } catch (error) {
      toast.error('Failed to assign shift');
    }
  };

  const getStaffRosterForDate = (staffId, date) => {
    return rosters.find(r => r.staffId === staffId && r.date === date);
  };

  const getShiftById = (shiftId) => {
    return shifts.find(s => s.id === shiftId);
  };

  const monthDates = getMonthDates(selectedMonth, selectedYear);

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredShifts = shifts.filter(shift =>
    shift.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = staff.filter(s =>
    s.status === 'active' &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-600 mt-1">Manage work shifts and staff rosters</p>
        </div>
        {activeTab === 'shifts' && (
          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Create Shift
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'shifts'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Shifts
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'roster'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Staff Roster
        </button>
      </div>

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search shifts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Shifts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShifts.map(shift => (
              <div key={shift.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                    <div className="flex items-center gap-2 mt-2 text-gray-600">
                      <Clock size={16} />
                      <span className="text-sm">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditShift(shift)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteShift(shift.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grace Time:</span>
                    <span className="font-medium">{shift.graceTime} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Day Hours:</span>
                    <span className="font-medium">{shift.fullDayHours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Half Day Hours:</span>
                    <span className="font-medium">{shift.halfDayHours} hrs</span>
                  </div>
                  {shift.weeklyOffs && shift.weeklyOffs.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-gray-600 text-xs">Weekly Offs:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {shift.weeklyOffs.map(day => (
                          <span key={day} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {day.substring(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {shift.description && (
                  <p className="mt-3 pt-3 border-t text-sm text-gray-600">{shift.description}</p>
                )}

                <div className="mt-4 pt-4 border-t">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    shift.status === 'active'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {shift.status || 'active'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredShifts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No shifts found</p>
              <button
                onClick={() => setShowShiftModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Create your first shift
              </button>
            </div>
          )}
        </div>
      )}

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Month/Year Selector */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
            <button
              onClick={() => {
                if (selectedMonth === 1) {
                  setSelectedMonth(12);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = getCurrentYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={() => {
                if (selectedMonth === 12) {
                  setSelectedMonth(1);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Search Staff */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Roster Grid */}
          {shifts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Please create shifts first before assigning roster</p>
              <button
                onClick={() => setActiveTab('shifts')}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Go to Shifts
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    {monthDates.map(date => {
                      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNum = new Date(date).getDate();
                      return (
                        <th key={date} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          <div>{dayName}</div>
                          <div className="font-bold text-gray-900">{dayNum}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map(staffMember => (
                    <tr key={staffMember.id}>
                      <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                            <div className="text-xs text-gray-500">{staffMember.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      {monthDates.map(date => {
                        const dateStr = formatDate(date);
                        const roster = getStaffRosterForDate(staffMember.id, dateStr);
                        const assignedShift = roster ? getShiftById(roster.shiftId) : null;

                        return (
                          <td key={date} className="px-3 py-4 text-center">
                            <select
                              value={roster?.shiftId || ''}
                              onChange={(e) => handleAssignShiftToStaff(staffMember.id, dateStr, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="">-</option>
                              {shifts.map(shift => (
                                <option key={shift.id} value={shift.id}>
                                  {shift.name.substring(0, 1)}
                                </option>
                              ))}
                            </select>
                            {assignedShift && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTime(assignedShift.startTime).substring(0, 5)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No staff found</p>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          {shifts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Shift Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {shifts.map(shift => (
                  <div key={shift.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                      {shift.name.substring(0, 1)}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{shift.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingShift ? 'Edit Shift' : 'Create New Shift'}
              </h3>
              <button onClick={handleCloseShiftModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Shift Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Name *
                </label>
                <input
                  type="text"
                  value={shiftForm.name}
                  onChange={(e) => handleShiftFormChange('name', e.target.value)}
                  placeholder="e.g., Morning Shift, Night Shift"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => handleShiftFormChange('startTime', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => handleShiftFormChange('endTime', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Grace Time & Hours */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grace Time (mins)
                  </label>
                  <input
                    type="number"
                    value={shiftForm.graceTime}
                    onChange={(e) => handleShiftFormChange('graceTime', parseInt(e.target.value))}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Day Hours
                  </label>
                  <input
                    type="number"
                    value={shiftForm.fullDayHours}
                    onChange={(e) => handleShiftFormChange('fullDayHours', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Half Day Hours
                  </label>
                  <input
                    type="number"
                    value={shiftForm.halfDayHours}
                    onChange={(e) => handleShiftFormChange('halfDayHours', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Weekly Offs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Offs
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleWeeklyOffToggle(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        shiftForm.weeklyOffs.includes(day)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={shiftForm.description}
                  onChange={(e) => handleShiftFormChange('description', e.target.value)}
                  placeholder="Optional shift description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={handleCloseShiftModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShift}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Save size={18} />
                {editingShift ? 'Update Shift' : 'Create Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
