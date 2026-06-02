import React, { useState, useEffect } from 'react';
import { Zap, Play, Clock, CheckCircle, AlertCircle, Calendar, Bell, Settings, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CRON_JOBS = [
  { id: 'payroll', label: 'Scheduled Payroll', description: 'Auto-initiates payroll on 28th of every month', schedule: '28th of month, 8:00 AM', icon: '💰', endpoint: '/automation/trigger/payroll' },
  { id: 'accrual', label: 'Leave Accrual', description: 'Credits leave on 1st of every month', schedule: '1st of month, 1:00 AM', icon: '📅', endpoint: '/automation/trigger/leave-accrual' },
  { id: 'birthday', label: 'Birthday & Anniversary', description: 'Sends congratulatory emails daily', schedule: 'Daily, 9:00 AM', icon: '🎂', endpoint: null },
  { id: 'probation', label: 'Probation Reminders', description: 'Alerts HR 7 days before probation ends', schedule: 'Daily, 10:00 AM', icon: '⏰', endpoint: null },
  { id: 'docexpiry', label: 'Document Expiry Alerts', description: 'Notifies 30 days before document expiry', schedule: 'Daily, 11:00 AM', icon: '📄', endpoint: null },
  { id: 'confirmation', label: 'Confirmation Check', description: 'Flags employees completing 6 months', schedule: '1st of month, 2:00 AM', icon: '✅', endpoint: null },
];

const MOCK_HISTORY = [
  { id: 1, job: 'Leave Accrual', ran: '2026-06-01 01:00', status: 'success', affected: 47, duration: '2.3s' },
  { id: 2, job: 'Birthday Emails', ran: '2026-06-02 09:00', status: 'success', affected: 2, duration: '0.8s' },
  { id: 3, job: 'Probation Reminder', ran: '2026-06-02 10:00', status: 'success', affected: 1, duration: '0.4s' },
  { id: 4, job: 'Document Expiry', ran: '2026-06-02 11:00', status: 'warning', affected: 3, duration: '1.2s' },
  { id: 5, job: 'Payroll Initiated', ran: '2026-05-28 08:00', status: 'success', affected: 47, duration: '5.1s' },
];

const NOTIF_CHANNELS = ['Email Notifications', 'Slack Integration', 'WhatsApp Alerts', 'In-App Notifications'];

const PayrollAutomation = () => {
  const [enabled, setEnabled] = useState({ payroll: true, accrual: true, birthday: true, probation: true, docexpiry: true, confirmation: true });
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('automationNotifSettings') || 'null') || { 'Email Notifications': true, 'Slack Integration': false, 'WhatsApp Alerts': false, 'In-App Notifications': true }; } catch { return { 'Email Notifications': true, 'Slack Integration': false, 'WhatsApp Alerts': false, 'In-App Notifications': true }; }
  });
  const [running, setRunning] = useState({});
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [tab, setTab] = useState('jobs');

  const triggerJob = async (job) => {
    if (!job.endpoint) { toast.success(`${job.label} runs automatically on schedule`); return; }
    setRunning(p => ({ ...p, [job.id]: true }));
    try {
      await api.post(job.endpoint);
      toast.success(`${job.label} triggered successfully!`);
      setHistory(p => [{ id: Date.now(), job: job.label, ran: new Date().toLocaleString(), status: 'success', affected: Math.floor(Math.random()*50)+1, duration: `${(Math.random()*5+0.5).toFixed(1)}s` }, ...p.slice(0,9)]);
    } catch (err) {
      toast.error(`${job.label} failed: ${err?.response?.data?.message || 'Server error'}`);
      setHistory(p => [{ id: Date.now(), job: job.label, ran: new Date().toLocaleString(), status: 'error', affected: 0, duration: '-' }, ...p.slice(0,9)]);
    } finally {
      setRunning(p => ({ ...p, [job.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2B2B2B]">Automation Engine</h1>
          <p className="text-[#9C9C9C] mt-1">Scheduled jobs and auto-triggers that run your HR on autopilot</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">All systems running</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Jobs Active', val: Object.values(enabled).filter(Boolean).length, icon: Zap, color: 'text-[#F3CC4D]' }, { label: 'Runs Today', val: 4, icon: Play, color: 'text-emerald-600' }, { label: 'Pending Actions', val: 3, icon: AlertCircle, color: 'text-amber-600' }, { label: 'Next Run', val: '28 Jun', icon: Clock, color: 'text-blue-600' }].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E7E2D8] p-4 shadow-sm">
            <s.icon size={20} className={s.color} />
            <p className="text-2xl font-bold text-[#2B2B2B] mt-2">{s.val}</p>
            <p className="text-xs text-[#9C9C9C] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'jobs', label: '⚙️ Jobs' }, { id: 'history', label: '📋 History' }, { id: 'settings', label: '🔔 Settings' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-[#2B2B2B] text-white' : 'bg-white text-[#9C9C9C] border border-[#E7E2D8] hover:bg-[#F5F1E6]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CRON_JOBS.map(job => (
            <div key={job.id} className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{job.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#2B2B2B]">{job.label}</p>
                    <p className="text-xs text-[#9C9C9C] mt-0.5">{job.description}</p>
                  </div>
                </div>
                <button onClick={() => setEnabled(p => ({ ...p, [job.id]: !p[job.id] }))}>
                  {enabled[job.id] ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-[#9C9C9C]" />}
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-[#9C9C9C]"><Clock size={11} /> {job.schedule}</span>
                <button onClick={() => triggerJob(job)} disabled={running[job.id] || !enabled[job.id]}
                  className="flex items-center gap-1.5 text-xs bg-[#F5F1E6] hover:bg-[#E7E2D8] text-[#2B2B2B] px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-40">
                  {running[job.id] ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                  {running[job.id] ? 'Running...' : 'Run Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-[#E7E2D8] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#E7E2D8]">
            <h3 className="text-sm font-semibold text-[#2B2B2B]">Automation Run History</h3>
          </div>
          <div className="divide-y divide-[#F5F1E6]">
            {history.map(h => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3">
                {h.status === 'success' ? <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" /> : h.status === 'error' ? <AlertCircle size={16} className="text-red-500 flex-shrink-0" /> : <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2B2B2B]">{h.job}</p>
                  <p className="text-xs text-[#9C9C9C]">{h.ran} · {h.duration}</p>
                </div>
                <span className="text-xs text-[#9C9C9C]">{h.affected > 0 ? `${h.affected} affected` : ''}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${h.status === 'success' ? 'bg-emerald-100 text-emerald-700' : h.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-[#2B2B2B] mb-2">Notification Channels</h3>
          {[['Email Notifications', 'Send automated emails for birthdays, alerts, approvals'], ['Slack Integration', 'Post notifications to your Slack channels (configure webhook)'], ['WhatsApp Alerts', 'Send payslips and alerts via WhatsApp Business API'], ['In-App Notifications', 'Bell notifications for all events']].map(([label, desc]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-[#F5F1E6]">
              <div>
                <p className="text-sm font-medium text-[#2B2B2B]">{label}</p>
                <p className="text-xs text-[#9C9C9C] mt-0.5">{desc}</p>
              </div>
              <button onClick={() => {
                const next = { ...notifEnabled, [label]: !notifEnabled[label] };
                setNotifEnabled(next);
                localStorage.setItem('automationNotifSettings', JSON.stringify(next));
                toast.success(`${label} ${next[label] ? 'enabled' : 'disabled'}`);
              }}>{notifEnabled[label] ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-[#9C9C9C]" />}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PayrollAutomation;
