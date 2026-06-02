import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Clock, UserCheck, RefreshCw, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI, employeeAPI } from '../../services/api';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  PRESENT:  { label: 'Present',  bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  HALF_DAY: { label: 'Half Day', bg: 'bg-amber-500',   light: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300' },
  ABSENT:   { label: 'Absent',   bg: 'bg-red-500',     light: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-300' },
  ON_LEAVE: { label: 'On Leave', bg: 'bg-blue-500',    light: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300' },
};

const fmt = (d) => format(new Date(d), 'yyyy-MM-dd');
const todayStr = fmt(new Date());

const AttendanceTracking = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [employees, setEmployees] = useState([]);
  const [monthRecords, setMonthRecords] = useState([]);  // all attendance records for current month
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState({}); // { employeeId: boolean }

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all active employees
      const empRes = await employeeAPI.list({ status: 'ACTIVE', limit: 200 });
      const emps = empRes?.data?.employees || empRes?.data || [];
      setEmployees(emps);

      // Load attendance records for current month (use org-summary or date endpoint)
      const dateRec = await attendanceAPI.getByDate(fmt(new Date(year, month - 1, 1)));
      // Actually use attendance for entire month — use getByEmployee for each employee is too slow
      // Use the org-summary endpoint with the first day of month
      const orgSummary = await attendanceAPI.getOrgSummary({ date: fmt(new Date(year, month - 1, 15)) });
      const records = orgSummary?.data || [];
      setMonthRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Attendance load failed:', err);
      // Keep empty state — don't crash
    }
    setLoading(false);
  }, [month, year]);

  const loadDayAttendance = useCallback(async () => {
    try {
      const res = await attendanceAPI.getByDate(selectedDate);
      const records = res?.data || [];
      if (Array.isArray(records)) {
        setMonthRecords(prev => {
          // Merge selected-day records into monthRecords
          const otherDays = prev.filter(r => fmt(r.date || r.createdAt) !== selectedDate);
          return [...otherDays, ...records];
        });
      }
    } catch {}
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadDayAttendance(); }, [loadDayAttendance]);

  const getRecordForDay = (employeeId, dateStr) =>
    monthRecords.find(r => r.employeeId === employeeId && fmt(r.date || r.createdAt) === dateStr);

  const getTodayRecords = () =>
    monthRecords.filter(r => fmt(r.date || r.createdAt) === selectedDate);

  const getMonthlySummary = (employeeId) => {
    const records = monthRecords.filter(r => r.employeeId === employeeId);
    return {
      present: records.filter(r => r.status === 'PRESENT').length,
      halfDay: records.filter(r => r.status === 'HALF_DAY').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
    };
  };

  const handleMark = async (employeeId, status) => {
    setMarking(p => ({ ...p, [employeeId]: true }));
    try {
      await attendanceAPI.mark({ employeeId, date: selectedDate, status });
      // Optimistically update local state
      setMonthRecords(prev => {
        const existing = prev.find(r => r.employeeId === employeeId && fmt(r.date || r.createdAt) === selectedDate);
        if (existing) return prev.map(r => r.employeeId === employeeId && fmt(r.date || r.createdAt) === selectedDate ? { ...r, status } : r);
        return [...prev, { employeeId, date: selectedDate, status }];
      });
      const emp = employees.find(e => e.id === employeeId);
      toast.success(`${emp?.firstName || 'Employee'} marked ${STATUS_CONFIG[status]?.label || status}`);
    } catch {
      toast.error('Failed to mark attendance');
    }
    setMarking(p => ({ ...p, [employeeId]: false }));
  };

  const handleBulkPresent = async () => {
    const todayRecs = getTodayRecords();
    const unmarked = employees.filter(e => !todayRecs.find(r => r.employeeId === e.id));
    if (!unmarked.length) { toast('All employees already marked'); return; }
    try {
      await attendanceAPI.bulkMark({ date: selectedDate, employeeIds: unmarked.map(e => e.id), status: 'PRESENT' });
      const newRecs = unmarked.map(e => ({ employeeId: e.id, date: selectedDate, status: 'PRESENT' }));
      setMonthRecords(prev => [...prev.filter(r => fmt(r.date || r.createdAt) !== selectedDate || !unmarked.find(e => e.id === r.employeeId)), ...newRecs]);
      toast.success(`${unmarked.length} employees marked Present`);
    } catch {
      toast.error('Bulk mark failed');
    }
  };

  const handleAutoAbsent = async () => {
    try {
      await attendanceAPI.autoAbsent({ date: selectedDate });
      toast.success('Auto-absent applied');
      loadDayAttendance();
    } catch {
      toast.error('Auto-absent failed');
    }
  };

  // Calendar helpers
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const getDayStats = (day) => {
    const dateStr = fmt(new Date(year, month - 1, day));
    const dayRecs = monthRecords.filter(r => fmt(r.date || r.createdAt) === dateStr);
    return { present: dayRecs.filter(r => r.status === 'PRESENT' || r.status === 'HALF_DAY').length, total: employees.length };
  };

  const todayRecords = getTodayRecords();
  const presentToday = todayRecords.filter(r => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
  const absentToday = todayRecords.filter(r => r.status === 'ABSENT').length;
  const onLeaveToday = todayRecords.filter(r => r.status === 'ON_LEAVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2B2B2B]">Attendance Tracking</h1>
          <p className="text-[#9C9C9C] mt-1">Mark and manage employee attendance</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E7E2D8] rounded-xl text-sm font-medium text-[#2B2B2B] hover:bg-[#F5F1E6] transition-all disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', val: employees.length, color: 'text-[#2B2B2B]', bg: 'bg-[#F5F1E6]' },
          { label: 'Present Today', val: presentToday, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Absent Today', val: absentToday, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'On Leave', val: onLeaveToday, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-[#E7E2D8] p-4`}>
            <p className="text-xs text-[#9C9C9C] font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#2B2B2B]">
            {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 2, 1))} className="p-2 hover:bg-[#F5F1E6] rounded-lg transition-colors">
              <ChevronLeft size={16} className="text-[#9C9C9C]" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-medium bg-[#F5F1E6] hover:bg-[#E7E2D8] rounded-lg transition-colors text-[#2B2B2B]">Today</button>
            <button onClick={() => setCurrentDate(new Date(year, month, 1))} className="p-2 hover:bg-[#F5F1E6] rounded-lg transition-colors">
              <ChevronRight size={16} className="text-[#9C9C9C]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="h-9 flex items-center justify-center text-[11px] font-semibold text-[#9C9C9C] bg-[#F5F1E6] rounded-lg">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = fmt(new Date(year, month - 1, day));
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const { present, total } = getDayStats(day);
            const pct = total > 0 ? Math.round((present / total) * 100) : 0;
            return (
              <div key={day} onClick={() => setSelectedDate(dateStr)}
                className={`h-16 rounded-xl p-2 cursor-pointer transition-all border-2 ${isSelected ? 'border-[#F3CC4D] bg-[#F3CC4D]/10' : isToday ? 'border-[#2B2B2B]/20 bg-[#F5F1E6]' : 'border-transparent hover:bg-[#F5F1E6]'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isToday ? 'text-[#2B2B2B]' : 'text-[#9C9C9C]'}`}>{day}</span>
                  {isToday && <span className="text-[9px] bg-[#2B2B2B] text-white px-1 py-0.5 rounded">Today</span>}
                </div>
                {total > 0 && (
                  <div className="mt-1">
                    <div className="h-1 rounded-full bg-[#E7E2D8] overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-[#9C9C9C] mt-0.5 block">{present}/{total}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Marking */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E2D8] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#2B2B2B]">
              {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-xs text-[#9C9C9C] mt-0.5">{employees.length} employees</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAutoAbsent}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
              <AlertCircle size={13} /> Auto-Absent
            </button>
            <button onClick={handleBulkPresent}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
              <Check size={13} /> Mark All Present
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw size={24} className="animate-spin text-[#9C9C9C] mx-auto mb-2" />
              <p className="text-sm text-[#9C9C9C]">Loading attendance...</p>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck size={40} className="mx-auto mb-3 text-[#E7E2D8]" />
            <p className="text-sm text-[#9C9C9C]">No employees found. Add employees from Staff Management.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F1E6]">
            {employees.map(emp => {
              const record = getRecordForDay(emp.id, selectedDate);
              const summary = getMonthlySummary(emp.id);
              const isMarking = marking[emp.id];
              const fullName = `${emp.firstName} ${emp.lastName}`;
              return (
                <div key={emp.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F5F1E6]/50 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F3CC4D] to-[#f59e0b] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {fullName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2B2B2B] truncate">{fullName}</p>
                    <p className="text-xs text-[#9C9C9C]">{emp.employeeCode} · {emp.department?.name || emp.designation?.name || ''}</p>
                  </div>
                  {/* Month summary */}
                  <div className="hidden lg:flex items-center gap-3 text-xs text-[#9C9C9C]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{summary.present}P</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{summary.halfDay}H</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{summary.absent}A</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{summary.onLeave}L</span>
                  </div>
                  {/* Current status badge */}
                  {record && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[record.status]?.light || 'bg-gray-100'} ${STATUS_CONFIG[record.status]?.text || 'text-gray-700'}`}>
                      {STATUS_CONFIG[record.status]?.label || record.status}
                    </span>
                  )}
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { status: 'PRESENT',  icon: Check,          title: 'Present',  activeBg: 'bg-emerald-500 text-white', hoverBg: 'hover:bg-emerald-100 text-emerald-600' },
                      { status: 'HALF_DAY', icon: Clock,          title: 'Half Day', activeBg: 'bg-amber-500 text-white',   hoverBg: 'hover:bg-amber-100 text-amber-600' },
                      { status: 'ABSENT',   icon: X,              title: 'Absent',   activeBg: 'bg-red-500 text-white',     hoverBg: 'hover:bg-red-100 text-red-600' },
                      { status: 'ON_LEAVE', icon: CalendarIcon,   title: 'Leave',    activeBg: 'bg-blue-500 text-white',    hoverBg: 'hover:bg-blue-100 text-blue-600' },
                    ].map(btn => (
                      <button key={btn.status}
                        onClick={() => handleMark(emp.id, btn.status)}
                        disabled={isMarking}
                        title={btn.title}
                        className={`p-2 rounded-lg transition-all disabled:opacity-50 ${record?.status === btn.status ? btn.activeBg : `bg-[#F5F1E6] ${btn.hoverBg}`}`}>
                        <btn.icon size={15} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracking;
