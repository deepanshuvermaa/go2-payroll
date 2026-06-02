import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const ApprovalInbox = () => {
  const [filter, setFilter] = useState('pending');
  const [approvals, setApprovals] = useState([
    { id: 1, type: 'Leave', employee: 'Priya Sharma', detail: 'Casual Leave: 5 Jun - 7 Jun (3 days)', status: 'pending', date: '2026-06-01' },
    { id: 2, type: 'Leave', employee: 'Rahul Singh', detail: 'Sick Leave: 3 Jun (1 day)', status: 'pending', date: '2026-06-01' },
    { id: 3, type: 'Comp-Off', employee: 'Anita Patel', detail: 'Worked on Sunday 25 May (1 day)', status: 'pending', date: '2026-05-26' },
    { id: 4, type: 'Expense', employee: 'Vikram Joshi', detail: 'Travel Reimbursement: ₹12,500', status: 'pending', date: '2026-05-28' },
    { id: 5, type: 'Regularization', employee: 'Deepanshu Verma', detail: 'Mark Present for 28 May (missed punch)', status: 'pending', date: '2026-05-29' },
    { id: 6, type: 'Leave', employee: 'Rohit Mehra', detail: 'Earned Leave: 10 Jun - 15 Jun (5 days)', status: 'approved', date: '2026-05-25' },
    { id: 7, type: 'Advance', employee: 'Sneha Gupta', detail: 'Salary Advance: ₹25,000', status: 'rejected', date: '2026-05-20' },
  ]);

  const handleAction = (id, action) => {
    setApprovals(approvals.map(a => a.id === id ? { ...a, status: action } : a));
    toast.success(`Request ${action}`);
  };

  const filtered = approvals.filter(a => filter === 'all' ? true : a.status === filter);
  const typeColors = { Leave: '#3b82f6', 'Comp-Off': '#f59e0b', Expense: '#10b981', Regularization: '#8b5cf6', Advance: '#ef4444' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-[#2B2B2B]">Approval Inbox</h1><p className="text-[#9C9C9C] mt-1">{approvals.filter(a => a.status === 'pending').length} pending approvals</p></div>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#2B2B2B] text-white' : 'bg-white text-[#9C9C9C] border border-[#E7E2D8] hover:bg-[#F5F1E6]'}`}>{f} {f === 'pending' && `(${approvals.filter(a => a.status === 'pending').length})`}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(a => (
          <div key={a.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: typeColors[a.type] || '#9C9C9C' }} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: (typeColors[a.type] || '#9C9C9C') + '15', color: typeColors[a.type] }}>{a.type}</span>
                  <span className="text-xs text-[#9C9C9C]">{a.date}</span>
                </div>
                <p className="text-sm font-medium text-[#2B2B2B] mt-1">{a.employee}</p>
                <p className="text-xs text-[#9C9C9C]">{a.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {a.status === 'pending' ? (
                <>
                  <button onClick={() => handleAction(a.id, 'approved')} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"><CheckCircle size={14} /> Approve</button>
                  <button onClick={() => handleAction(a.id, 'rejected')} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"><XCircle size={14} /> Reject</button>
                </>
              ) : (
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${a.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="card text-center py-12"><p className="text-[#9C9C9C]">No {filter} approvals</p></div>}
      </div>
    </div>
  );
};

export default ApprovalInbox;
