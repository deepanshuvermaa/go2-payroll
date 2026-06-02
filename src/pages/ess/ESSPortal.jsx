import React, { useState, useEffect } from 'react';
import { Clock, FileText, Calendar, TrendingUp, Download, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { essAPI } from '../../services/api';
import payrollDataStore from '../../services/payrollDataStore';

const ESSPortal = () => {
  const [tab, setTab] = useState('overview');
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, leave: 0, late: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Try API first
      const dashboard = await essAPI.getDashboard();
      if (dashboard.data) {
        setLeaveBalance(dashboard.data.leaveBalances || []);
      }
    } catch {
      // Fallback to localStorage
      const staff = payrollDataStore.getStaff();
      const me = staff.find(s => s.email === user?.email);
      if (me) {
        const bal = payrollDataStore.getLeaveBalance?.(me.id) || [];
        setLeaveBalance(bal);
        const att = payrollDataStore.getStaffAttendanceSummary?.(me.id, new Date().getMonth() + 1, new Date().getFullYear()) || {};
        setAttendance({ present: att.present || 0, absent: att.absent || 0, leave: att.onLeave || 0, late: att.lateMarks || 0 });
      }
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'payslips', label: 'Payslips', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'tax', label: 'Tax', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2B2B2B]">Employee Self-Service</h1>
        <p className="text-[#9C9C9C] mt-1">Welcome, {user?.ownerName || user?.name || user?.email}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-[#2B2B2B] text-white' : 'bg-white text-[#9C9C9C] border border-[#E7E2D8] hover:bg-[#F5F1E6]'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card"><p className="text-sm text-[#9C9C9C]">Present This Month</p><p className="text-2xl font-bold text-[#2B2B2B] mt-1">{attendance.present} days</p></div>
          <div className="card"><p className="text-sm text-[#9C9C9C]">Leave Taken</p><p className="text-2xl font-bold text-[#2B2B2B] mt-1">{attendance.leave} days</p></div>
          <div className="card"><p className="text-sm text-[#9C9C9C]">Late Marks</p><p className="text-2xl font-bold text-amber-600 mt-1">{attendance.late}</p></div>
          <div className="card"><p className="text-sm text-[#9C9C9C]">Leave Balance</p><p className="text-2xl font-bold text-emerald-600 mt-1">{leaveBalance.reduce?.((s, b) => s + (b.balance || 0), 0) || 0} days</p></div>
        </div>
      )}

      {/* Payslips */}
      {tab === 'payslips' && (
        <div className="card">
          <h3 className="text-base font-semibold text-[#2B2B2B] mb-4">Your Payslips</h3>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              return (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]">
                  <div>
                    <p className="text-sm font-medium text-[#2B2B2B]">{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    <p className="text-xs text-[#9C9C9C]">Processed on {d.getDate()}/{d.getMonth()+1}/{d.getFullYear()}</p>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2B2B2B] text-white text-xs font-medium hover:scale-105 transition-transform">
                    <Download size={12} /> Download PDF
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <div className="card">
          <h3 className="text-base font-semibold text-[#2B2B2B] mb-4">This Month's Attendance</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-center text-[10px] text-[#9C9C9C] font-medium">{d}</div>)}
            {[...Array(30)].map((_, i) => (
              <div key={i} className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-medium ${i < new Date().getDate() ? (i % 7 === 6 ? 'bg-[#F5F1E6] text-[#9C9C9C]' : 'bg-emerald-100 text-emerald-700') : 'bg-white border border-[#E7E2D8] text-[#9C9C9C]'}`}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-100" /> Present</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100" /> Absent</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#F5F1E6]" /> Week Off</span>
          </div>
        </div>
      )}

      {/* Leave */}
      {tab === 'leave' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ type: 'Casual Leave', total: 12, used: 4 }, { type: 'Sick Leave', total: 12, used: 2 }, { type: 'Earned Leave', total: 15, used: 3 }].map((l, i) => (
              <div key={i} className="card">
                <p className="text-sm text-[#9C9C9C]">{l.type}</p>
                <p className="text-2xl font-bold text-[#2B2B2B] mt-1">{l.total - l.used} <span className="text-sm font-normal text-[#9C9C9C]">/ {l.total}</span></p>
                <div className="h-2 rounded-full bg-[#E7E2D8] mt-3"><div className="h-full rounded-full bg-[#F3CC4D]" style={{ width: `${((l.total - l.used) / l.total) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary">Apply for Leave</button>
        </div>
      )}

      {/* Tax */}
      {tab === 'tax' && (
        <div className="card">
          <h3 className="text-base font-semibold text-[#2B2B2B] mb-4">Tax Summary (FY 2025-26)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]"><p className="text-xs text-[#9C9C9C]">Taxable Income</p><p className="text-xl font-bold text-[#2B2B2B]">₹12,00,000</p></div>
            <div className="p-4 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]"><p className="text-xs text-[#9C9C9C]">Total Tax (New Regime)</p><p className="text-xl font-bold text-[#2B2B2B]">₹93,600</p></div>
            <div className="p-4 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]"><p className="text-xs text-[#9C9C9C]">Monthly TDS</p><p className="text-xl font-bold text-[#2B2B2B]">₹7,800</p></div>
            <div className="p-4 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]"><p className="text-xs text-[#9C9C9C]">Declarations</p><p className="text-xl font-bold text-emerald-600">Submitted ✓</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ESSPortal;
