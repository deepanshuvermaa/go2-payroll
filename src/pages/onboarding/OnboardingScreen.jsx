import React, { useState } from 'react';
import { UserPlus, UserMinus, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingScreen = () => {
  const [tab, setTab] = useState('onboarding');
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Collect KYC Documents', assignee: 'HR', status: 'completed', employee: 'Rahul Kumar' },
    { id: 2, name: 'IT Asset Allocation', assignee: 'IT Admin', status: 'completed', employee: 'Rahul Kumar' },
    { id: 3, name: 'Bank Account Verification', assignee: 'Finance', status: 'pending', employee: 'Rahul Kumar' },
    { id: 4, name: 'Buddy Assignment', assignee: 'Manager', status: 'pending', employee: 'Rahul Kumar' },
    { id: 5, name: 'Policy Acknowledgement', assignee: 'Employee', status: 'pending', employee: 'Rahul Kumar' },
  ]);

  const [exits, setExits] = useState([
    { id: 1, name: 'Vikram Joshi', designation: 'Sr. Developer', lwd: '2026-07-15', reason: 'Better opportunity', status: 'fnf_pending', fnf: 285000 },
  ]);

  const completeTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    toast.success('Task completed');
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-[#2B2B2B]">Onboarding & Offboarding</h1><p className="text-[#9C9C9C] mt-1">Manage employee lifecycle</p></div>

      <div className="flex gap-2">
        <button onClick={() => setTab('onboarding')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${tab === 'onboarding' ? 'bg-[#2B2B2B] text-white' : 'bg-white text-[#9C9C9C] border border-[#E7E2D8]'}`}><UserPlus size={15} /> Onboarding</button>
        <button onClick={() => setTab('offboarding')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${tab === 'offboarding' ? 'bg-[#2B2B2B] text-white' : 'bg-white text-[#9C9C9C] border border-[#E7E2D8]'}`}><UserMinus size={15} /> Offboarding</button>
      </div>

      {tab === 'onboarding' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#2B2B2B]">Onboarding: Rahul Kumar (Software Engineer)</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">{tasks.filter(t => t.status === 'completed').length}/{tasks.length} Complete</span>
          </div>
          <div className="h-2 rounded-full bg-[#E7E2D8] mb-6"><div className="h-full rounded-full bg-[#F3CC4D] transition-all" style={{ width: `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%` }} /></div>
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-[#E7E2D8] hover:bg-[#F5F1E6] transition-colors">
                <div className="flex items-center gap-3">
                  {t.status === 'completed' ? <CheckCircle size={18} className="text-emerald-500" /> : <Clock size={18} className="text-[#9C9C9C]" />}
                  <div>
                    <p className={`text-sm font-medium ${t.status === 'completed' ? 'text-[#9C9C9C] line-through' : 'text-[#2B2B2B]'}`}>{t.name}</p>
                    <p className="text-[11px] text-[#9C9C9C]">Assigned to: {t.assignee}</p>
                  </div>
                </div>
                {t.status === 'pending' && <button onClick={() => completeTask(t.id)} className="px-3 py-1.5 rounded-lg bg-[#2B2B2B] text-white text-xs font-medium hover:scale-105 transition-transform">Complete</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'offboarding' && (
        <div className="card">
          <h3 className="text-base font-semibold text-[#2B2B2B] mb-4">Exit Processing</h3>
          {exits.map(e => (
            <div key={e.id} className="p-4 rounded-xl border border-[#E7E2D8]">
              <div className="flex items-center justify-between mb-3">
                <div><p className="font-medium text-[#2B2B2B]">{e.name}</p><p className="text-xs text-[#9C9C9C]">{e.designation} • LWD: {e.lwd}</p></div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">FnF Pending</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="p-3 rounded-lg bg-[#F5F1E6]"><p className="text-[10px] text-[#9C9C9C]">Basic Dues</p><p className="text-sm font-bold text-[#2B2B2B]">₹1,42,000</p></div>
                <div className="p-3 rounded-lg bg-[#F5F1E6]"><p className="text-[10px] text-[#9C9C9C]">Leave Encash</p><p className="text-sm font-bold text-[#2B2B2B]">₹48,000</p></div>
                <div className="p-3 rounded-lg bg-[#F5F1E6]"><p className="text-[10px] text-[#9C9C9C]">Gratuity</p><p className="text-sm font-bold text-[#2B2B2B]">₹95,000</p></div>
                <div className="p-3 rounded-lg bg-emerald-50"><p className="text-[10px] text-[#9C9C9C]">Net Payable</p><p className="text-sm font-bold text-emerald-600">₹{e.fnf.toLocaleString()}</p></div>
              </div>
              <button onClick={() => toast.success('FnF processed')} className="btn btn-primary mt-4">Process FnF</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingScreen;
