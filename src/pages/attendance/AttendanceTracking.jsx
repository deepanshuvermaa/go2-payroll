import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Clock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatDate, getCurrentMonthYear, getWorkingDaysInMonth } from '../../utils/dateHelpers';

const AttendanceTracking = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    loadData();
  }, [currentDate, selectedDate]);

  const loadData = () => {
    // Load active staff
    const allStaff = payrollDataStore.getStaff().filter(s => s.status === 'active');
    setStaff(allStaff);

    // Load attendance for current month
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const monthAttendance = payrollDataStore.getAttendance(month, year);
    setAttendance(monthAttendance);

    // Load attendance for selected date
    const dateAttendance = monthAttendance.filter(a => a.date === selectedDate);
    setTodayAttendance(dateAttendance);

    // Create attendance map for calendar view
    const map = {};
    monthAttendance.forEach(record => {
      if (!map[record.staffId]) {
        map[record.staffId] = {};
      }
      map[record.staffId][record.date] = record.status;
    });
    setAttendanceMap(map);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleMarkAttendance = (staffMember, status) => {
    const existingRecord = todayAttendance.find(a => a.staffId === staffMember.id);

    if (existingRecord) {
      // Update existing record
      const updated = {
        ...existingRecord,
        status,
        clockIn: status === 'present' || status === 'half-day' ? (existingRecord.clockIn || '09:00') : '',
        clockOut: status === 'present' || status === 'half-day' ? (existingRecord.clockOut || '18:00') : '',
      };

      const allRecords = attendance.map(a => a.id === existingRecord.id ? updated : a);
      payrollDataStore.saveData(payrollDataStore.STORAGE_KEYS.ATTENDANCE, allRecords);
      toast.success(`Attendance updated for ${staffMember.name}`);
    } else {
      // Add new record
      const newRecord = {
        staffId: staffMember.id,
        staffName: staffMember.name,
        date: selectedDate,
        status,
        clockIn: status === 'present' || status === 'half-day' ? '09:00' : '',
        clockOut: status === 'present' || status === 'half-day' ? '18:00' : '',
        overtimeHours: 0,
        lateMarks: 0,
        notes: '',
      };
      payrollDataStore.addAttendance(newRecord);
      toast.success(`Attendance marked for ${staffMember.name}`);
    }

    loadData();
  };

  const handleBulkMarkAttendance = (status) => {
    const unmarkedStaff = staff.filter(s =>
      !todayAttendance.find(a => a.staffId === s.id)
    );

    if (unmarkedStaff.length === 0) {
      toast.error('All staff attendance already marked');
      return;
    }

    unmarkedStaff.forEach(staffMember => {
      const newRecord = {
        staffId: staffMember.id,
        staffName: staffMember.name,
        date: selectedDate,
        status,
        clockIn: status === 'present' ? '09:00' : '',
        clockOut: status === 'present' ? '18:00' : '',
        overtimeHours: 0,
        lateMarks: 0,
        notes: '',
      };
      payrollDataStore.addAttendance(newRecord);
    });

    toast.success(`Marked ${unmarkedStaff.length} staff as ${status}`);
    loadData();
  };

  const getAttendanceStatus = (staffId, date) => {
    return attendanceMap[staffId]?.[date] || null;
  };

  const getStaffAttendanceSummary = (staffId) => {
    const staffAttendance = attendance.filter(a => a.staffId === staffId);
    const present = staffAttendance.filter(a => a.status === 'present').length;
    const halfDay = staffAttendance.filter(a => a.status === 'half-day').length;
    const absent = staffAttendance.filter(a => a.status === 'absent').length;
    const leave = staffAttendance.filter(a => a.status === 'leave').length;

    return { present, halfDay, absent, leave };
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = formatDate(date, 'yyyy-MM-dd');
      const isToday = dateString === formatDate(new Date(), 'yyyy-MM-dd');
      const isSelected = dateString === selectedDate;

      const dayAttendance = attendance.filter(a => a.date === dateString);
      const presentCount = dayAttendance.filter(a => a.status === 'present' || a.status === 'half-day').length;
      const totalStaff = staff.length;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateString)}
          className={`h-24 border p-2 cursor-pointer transition-colors ${
            isToday ? 'bg-primary-50 border-primary-300' :
            isSelected ? 'bg-primary-100 border-primary-400' :
            'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${
              isToday ? 'text-primary-600' : 'text-gray-700'
            }`}>
              {day}
            </span>
            {isToday && <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">Today</span>}
          </div>
          {totalStaff > 0 && (
            <div className="text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <UserCheck size={12} />
                <span>{presentCount}/{totalStaff}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="text-gray-600 mt-1">Mark and manage employee attendance</p>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow-card p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn btn-secondary text-sm"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-10 flex items-center justify-center font-semibold text-gray-700 bg-gray-100">
              {day}
            </div>
          ))}
          {/* Calendar Days */}
          {renderCalendar()}
        </div>
      </div>

      {/* Daily Attendance Marking */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Attendance for {formatDate(new Date(selectedDate), 'MMM dd, yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkMarkAttendance('present')}
              className="btn btn-success text-sm flex items-center gap-2"
            >
              <Check size={16} />
              Mark All Present
            </button>
          </div>
        </div>

        {/* Staff List */}
        {staff.length > 0 ? (
          <div className="space-y-3">
            {staff.map(staffMember => {
              const record = todayAttendance.find(a => a.staffId === staffMember.id);
              const summary = getStaffAttendanceSummary(staffMember.id);

              return (
                <div key={staffMember.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{staffMember.name}</p>
                        <p className="text-sm text-gray-500">{staffMember.employeeId} • {staffMember.department}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Month Summary */}
                    <div className="text-xs text-gray-600 hidden lg:flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                        P: {summary.present}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
                        H: {summary.halfDay}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-danger-500 rounded-full"></span>
                        A: {summary.absent}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-info-500 rounded-full"></span>
                        L: {summary.leave}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {record && (
                      <span className={`badge ${
                        record.status === 'present' ? 'badge-success' :
                        record.status === 'half-day' ? 'badge-warning' :
                        record.status === 'leave' ? 'badge-info' :
                        'badge-danger'
                      }`}>
                        {record.status}
                      </span>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkAttendance(staffMember, 'present')}
                        className={`p-2 rounded-lg transition-colors ${
                          record?.status === 'present'
                            ? 'bg-success-500 text-white'
                            : 'bg-success-100 text-success-600 hover:bg-success-200'
                        }`}
                        title="Present"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(staffMember, 'half-day')}
                        className={`p-2 rounded-lg transition-colors ${
                          record?.status === 'half-day'
                            ? 'bg-warning-500 text-white'
                            : 'bg-warning-100 text-warning-600 hover:bg-warning-200'
                        }`}
                        title="Half Day"
                      >
                        <Clock size={18} />
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(staffMember, 'absent')}
                        className={`p-2 rounded-lg transition-colors ${
                          record?.status === 'absent'
                            ? 'bg-danger-500 text-white'
                            : 'bg-danger-100 text-danger-600 hover:bg-danger-200'
                        }`}
                        title="Absent"
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(staffMember, 'leave')}
                        className={`p-2 rounded-lg transition-colors ${
                          record?.status === 'leave'
                            ? 'bg-info-500 text-white'
                            : 'bg-info-100 text-info-600 hover:bg-info-200'
                        }`}
                        title="Leave"
                      >
                        <CalendarIcon size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <UserCheck size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No active staff members found</p>
            <p className="text-sm mt-2">Add staff members to start tracking attendance</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracking;
