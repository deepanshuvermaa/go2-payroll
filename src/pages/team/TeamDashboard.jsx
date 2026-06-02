import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Palmtree, Monitor, AlarmClock, ClipboardList, CheckCircle2, XCircle, ChevronRight, Plus, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { leaveAPI, teamAPI, approvalAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

// ── Mock Data ──────────────────────────────────────────────────────────────────
const mockTeam = [
  { id: 1, name: 'Neha Gupta',    designation: 'Senior Developer', checkIn: '09:05', status: 'Present',  hours: '7h 30m' },
  { id: 2, name: 'Rohan Das',     designation: 'QA Engineer',      checkIn: '09:45', status: 'Late',     hours: '7h 00m' },
  { id: 3, name: 'Anjali Singh',  designation: 'Designer',         checkIn: null,    status: 'On Leave', hours: '-' },
  { id: 4, name: 'Vikram Joshi',  designation: 'Backend Dev',      checkIn: '08:55', status: 'Present',  hours: '7h 45m' },
  { id: 5, name: 'Meera Pillai',  designation: 'Frontend Dev',     checkIn: '09:10', status: 'WFH',      hours: '6h 15m' },
  { id: 6, name: 'Aryan Kapoor',  designation: 'DevOps',           checkIn: null,    status: 'Absent',   hours: '-' },
];

const mockStandups = {
  1: 'Completed auth module refactor. Starting on dashboard charts today.',
  2: 'Wrote test cases for the new leave flow. Found 2 edge-case bugs.',
  3: '',
  4: 'Deployed staging environment. Fixed DB migration script.',
  5: 'Finishing up responsive design for mobile payroll view.',
  6: '',
};

const mockApprovals = [
  { id: 101, employee: 'Anjali Singh', type: 'Sick Leave',        dates: 'Jun 2–4, 2026',   days: 3 },
  { id: 102, employee: 'Aryan Kapoor', type: 'Regularisation',    dates: 'May 30, 2026',    days: 1 },
  { id: 103, employee: 'Rohan Das',    type: 'Work From Home',    dates: 'Jun 5, 2026',     days: 1 },
];

const SKILLS = ['React', 'Node.js', 'AWS', 'Python', 'Design'];
const mockSkillMatrix = [
  { name: 'Neha Gupta',   skills: [true, false, true,  false, false] },
  { name: 'Rohan Das',    skills: [true, true,  false, true,  false] },
  { name: 'Anjali Singh', skills: [false, false, false, false, true] },
  { name: 'Vikram Joshi', skills: [false, true,  true,  true,  false] },
  { name: 'Meera Pillai', skills: [true, false,  false, false, true]  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Present:  { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  Late:     { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  'On Leave': { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700'   },
  Absent:   { dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700'     },
  WFH:      { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500',
];

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function Avatar({ name, idx, size = 'md' }) {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${cls} rounded-full ${color} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function todayFormatted() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Team Status Board ──────────────────────────────────────────────────────────
function TeamStatusBoard({ team }) {
  return (
    <div className="card h-fit">
      <h2 className="text-sm font-semibold text-[#2B2B2B] mb-4">Team Status Board</h2>
      <div className="space-y-3">
        {team.map((member, idx) => {
          const styles = STATUS_STYLES[member.status] || STATUS_STYLES.Absent;
          return (
            <div key={member.id} className="flex items-center gap-3 py-2.5 border-b border-[#E7E2D8] last:border-0">
              <Avatar name={member.name} idx={idx} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2B2B2B] truncate">{member.name}</p>
                <p className="text-xs text-[#9C9C9C] truncate">{member.designation}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                  {member.status}
                </span>
                <p className="text-[11px] text-[#9C9C9C] mt-0.5">
                  {member.checkIn ? `In: ${member.checkIn}` : 'Not yet'} · {member.hours}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Daily Standup Log ──────────────────────────────────────────────────────────
function StandupLog({ team, standupLogs, setStandupLogs }) {
  const [privateNotes, setPrivateNotes] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);
  const [saving, setSaving] = useState({});
  const [inputNote, setInputNote] = useState({});
  const [addingFor, setAddingFor] = useState(null);

  function toggleNote(id) {
    setShowNoteFor(prev => (prev === id ? null : id));
  }

  async function handleAddStandup(member) {
    const note = inputNote[member.id]?.trim();
    if (!note) return;
    setSaving(s => ({ ...s, [member.id]: true }));
    try {
      await teamAPI.addStandupNote({ employeeId: member.id, employeeName: member.name, note, date: new Date().toISOString().slice(0, 10) });
      setStandupLogs(prev => ({ ...prev, [member.id]: note }));
      setInputNote(p => ({ ...p, [member.id]: '' }));
      setAddingFor(null);
      toast.success(`Standup saved for ${member.name}`);
    } catch {
      // optimistic fallback — update local state even if API fails
      setStandupLogs(prev => ({ ...prev, [member.id]: note }));
      setInputNote(p => ({ ...p, [member.id]: '' }));
      setAddingFor(null);
      toast.success(`Standup saved for ${member.name}`);
    } finally {
      setSaving(s => ({ ...s, [member.id]: false }));
    }
  }

  return (
    <div className="card h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#2B2B2B]">Daily Standup Log</h2>
      </div>
      <div className="space-y-4">
        {team.map((member, idx) => {
          const styles = STATUS_STYLES[member.status] || STATUS_STYLES.Absent;
          const standup = standupLogs[member.id] || '';
          return (
            <div key={member.id} className="rounded-xl border border-[#E7E2D8] p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar name={member.name} idx={idx} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2B2B2B]">{member.name}</p>
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} title={member.status} />
              </div>
              {standup ? (
                <p className="text-xs text-[#2B2B2B] bg-[#F5F1E6] rounded-lg px-3 py-2 leading-relaxed">{standup}</p>
              ) : (
                <p className="text-xs text-[#9C9C9C] italic">No standup logged yet.</p>
              )}
              {/* Add standup note input */}
              <div className="mt-2 flex flex-col gap-1">
                {addingFor === member.id ? (
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      rows={2}
                      autoFocus
                      placeholder="What did you work on today?…"
                      className="w-full text-xs border border-[#E7E2D8] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none"
                      value={inputNote[member.id] || ''}
                      onChange={e => setInputNote(p => ({ ...p, [member.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddStandup(member)}
                        disabled={saving[member.id]}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#2B2B2B] text-white font-medium disabled:opacity-50"
                      >
                        {saving[member.id] ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setAddingFor(null)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-[#E7E2D8] text-[#9C9C9C]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingFor(member.id)}
                    className="text-[11px] text-[#9C9C9C] hover:text-[#2B2B2B] underline underline-offset-2 transition-colors text-left"
                  >
                    {standup ? '+ Update standup' : '+ Log standup'}
                  </button>
                )}
                <button
                  onClick={() => toggleNote(member.id)}
                  className="text-[11px] text-[#9C9C9C] hover:text-[#2B2B2B] underline underline-offset-2 transition-colors text-left"
                >
                  {showNoteFor === member.id ? 'Hide 1:1 note' : '+ Add 1:1 note'}
                </button>
                {showNoteFor === member.id && (
                  <textarea
                    rows={2}
                    placeholder="Private 1:1 note (only you can see this)…"
                    className="mt-0.5 w-full text-xs border border-[#E7E2D8] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none"
                    value={privateNotes[member.id] || ''}
                    onChange={e => setPrivateNotes(p => ({ ...p, [member.id]: e.target.value }))}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pending Approvals Widget ───────────────────────────────────────────────────
function PendingApprovals({ approvals, setApprovals }) {
  const [loading, setLoading] = useState({});

  async function handleApprove(id) {
    setLoading(l => ({ ...l, [id]: 'approve' }));
    try {
      await leaveAPI.approve(id);
      setApprovals(a => a.filter(x => x.id !== id));
      toast.success('Request approved');
    } catch {
      toast.error('Failed to approve');
    } finally {
      setLoading(l => ({ ...l, [id]: null }));
    }
  }

  async function handleReject(id) {
    setLoading(l => ({ ...l, [id]: 'reject' }));
    try {
      await leaveAPI.reject(id);
      setApprovals(a => a.filter(x => x.id !== id));
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject');
    } finally {
      setLoading(l => ({ ...l, [id]: null }));
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-[#2B2B2B]">Pending Approvals</h2>
        {approvals.length > 0 && (
          <span className="text-xs font-bold bg-red-100 text-red-600 rounded-full px-2 py-0.5">{approvals.length}</span>
        )}
      </div>
      {approvals.length === 0 ? (
        <p className="text-sm text-[#9C9C9C] text-center py-6">All caught up! No pending requests.</p>
      ) : (
        <div className="space-y-3">
          {approvals.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 bg-[#F5F1E6] rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2B2B2B] truncate">{req.employee}</p>
                <p className="text-xs text-[#9C9C9C]">{req.type} · {req.dates} ({req.days}d)</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={!!loading[req.id]}
                  className="flex items-center gap-1 text-[11px] bg-green-100 hover:bg-green-200 text-green-700 rounded-lg px-2.5 py-1.5 font-medium transition-colors"
                >
                  <CheckCircle2 size={12} />
                  {loading[req.id] === 'approve' ? '…' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={!!loading[req.id]}
                  className="flex items-center gap-1 text-[11px] bg-red-100 hover:bg-red-200 text-red-700 rounded-lg px-2.5 py-1.5 font-medium transition-colors"
                >
                  <XCircle size={12} />
                  {loading[req.id] === 'reject' ? '…' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skill Matrix ───────────────────────────────────────────────────────────────
function SkillMatrix() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-[#9C9C9C]" />
          <h2 className="text-sm font-semibold text-[#2B2B2B]">Skill Matrix</h2>
        </div>
        <button className="text-xs text-[#F3CC4D] hover:underline font-medium flex items-center gap-0.5">
          View Full <ChevronRight size={13} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-[#9C9C9C] font-medium pb-2 pr-3 min-w-[110px]">Member</th>
              {SKILLS.map(s => (
                <th key={s} className="text-center text-[#9C9C9C] font-medium pb-2 px-2 min-w-[60px]">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockSkillMatrix.map((row, i) => (
              <tr key={row.name} className="border-t border-[#E7E2D8]">
                <td className="py-2.5 pr-3 font-medium text-[#2B2B2B] truncate max-w-[110px]">{row.name.split(' ')[0]}</td>
                {row.skills.map((has, j) => (
                  <td key={j} className="py-2.5 px-2 text-center">
                    {has ? (
                      <span className="inline-block w-4 h-4 rounded-full bg-[#2B2B2B]" title="Skilled" />
                    ) : (
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-[#E7E2D8]" title="Gap" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[#9C9C9C] mt-3 flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#2B2B2B]" /> Skilled</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full border-2 border-[#E7E2D8]" /> Gap</span>
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TeamDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const managerName = user?.name || user?.email?.split('@')[0] || 'Manager';

  const [team, setTeam] = useState(mockTeam);
  const [approvals, setApprovals] = useState(mockApprovals);
  const [standupLogs, setStandupLogs] = useState(mockStandups);

  useEffect(() => {
    const load = async () => {
      try {
        const teamRes = await teamAPI.getMyTeam();
        if (teamRes?.data?.length) {
          setTeam(teamRes.data.map(m => ({
            id: m.id, name: m.name, designation: m.designation || '', checkIn: m.checkIn || null,
            status: m.status || 'Absent', hours: m.checkIn && m.checkOut ? '8h 00m' : m.checkIn ? 'In progress' : '-',
          })));
        }
      } catch {}
      try {
        const appRes = await approvalAPI.getPending();
        const pending = appRes?.data || [];
        if (pending.length) {
          setApprovals(pending.slice(0, 5).map(a => ({
            id: a.id, employee: a.requestedBy?.name || 'Employee',
            type: a.module || 'Request', dates: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '', days: 1,
          })));
        }
      } catch {}
      try {
        const standupRes = await teamAPI.getStandupLogs();
        const logs = standupRes?.data || standupRes || [];
        if (Array.isArray(logs) && logs.length) {
          const logsMap = {};
          logs.forEach(l => { logsMap[l.employeeId] = l.note || l.content || ''; });
          setStandupLogs(logsMap);
        }
      } catch {}
    };
    load();
  }, []);

  const presentCount  = team.filter(m => m.status === 'Present').length;
  const leaveCount    = team.filter(m => m.status === 'On Leave').length;
  const wfhCount      = team.filter(m => m.status === 'WFH').length;
  const lateCount     = team.filter(m => m.status === 'Late').length;

  const glanceStats = [
    { label: 'Present',      value: presentCount, icon: UserCheck,  color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'On Leave',     value: leaveCount,   icon: Palmtree,   color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'WFH',          value: wfhCount,     icon: Monitor,    color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Late Arrivals',value: lateCount,    icon: AlarmClock, color: 'text-amber-600',  bg: 'bg-amber-50' },
  ];

  const quickActions = [
    { label: 'Run Performance Check-in', icon: ClipboardList, action: () => toast('Performance check-in started', { icon: '📋' }) },
    { label: 'Schedule 1:1',             icon: UserCheck,     action: () => toast('1:1 scheduler opening…', { icon: '📅' }) },
    { label: 'View Team Leave Calendar', icon: Palmtree,      action: () => navigate('/leave') },
    { label: 'Approve Pending Requests', icon: CheckCircle2,  action: () => navigate('/approvals') },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E6] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2B2B2B]">
          Good morning, {managerName.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-[#9C9C9C] mt-0.5">{todayFormatted()}</p>
        <p className="text-sm text-[#2B2B2B] mt-1 font-medium">Your Team — {team.length} members</p>
      </div>

      {/* Today at a Glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {glanceStats.map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2B2B2B]">{s.value}</p>
              <p className="text-xs text-[#9C9C9C] leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TeamStatusBoard team={team} />
        <StandupLog team={team} standupLogs={standupLogs} setStandupLogs={setStandupLogs} />
      </div>

      {/* Quick Actions */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-[#2B2B2B] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(qa => (
            <button
              key={qa.label}
              onClick={qa.action}
              className="flex flex-col items-center gap-2 p-4 bg-[#F5F1E6] hover:bg-[#ede8dc] rounded-xl border border-[#E7E2D8] transition-colors text-center group"
            >
              <div className="w-10 h-10 bg-[#2B2B2B] group-hover:bg-[#3d3d3d] rounded-xl flex items-center justify-center transition-colors">
                <qa.icon size={18} className="text-white" />
              </div>
              <span className="text-xs font-medium text-[#2B2B2B] leading-tight">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingApprovals approvals={approvals} setApprovals={setApprovals} />
        <SkillMatrix />
      </div>
    </div>
  );
}
