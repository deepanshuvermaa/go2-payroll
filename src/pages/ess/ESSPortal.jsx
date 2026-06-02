import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Clock, FileText, Calendar, Users, FolderOpen, MessageSquare, Inbox,
  Download, Upload, ChevronRight, MapPin, Bell, Lightbulb, Briefcase,
  Monitor, DollarSign, RefreshCw, CheckCircle, XCircle, AlertCircle,
  Cake, Trophy, Star, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subMonths, isWednesday, isThursday, parseISO } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import { essAPI, attendanceAPI, leaveAPI, approvalAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

// ── helpers ──────────────────────────────────────────────────────────────────

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const avatarColor = (name = '') => {
  const colors = ['#F3CC4D','#10b981','#3b82f6','#8b5cf6','#ef4444','#f97316','#06b6d4','#ec4899'];
  let hash = 0;
  for (let c of name) hash = (hash << 5) - hash + c.charCodeAt(0);
  return colors[Math.abs(hash) % colors.length];
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtHMS = (secs) => {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// ── mock data ─────────────────────────────────────────────────────────────────

const MOCK_TEAM = [
  { name: 'Priya Sharma', designation: 'Senior Developer', status: 'Present' },
  { name: 'Rahul Gupta', designation: 'Product Manager', status: 'On Leave' },
  { name: 'Anjali Mehta', designation: 'UI Designer', status: 'WFH' },
  { name: 'Vikram Singh', designation: 'DevOps Engineer', status: 'Present' },
  { name: 'Neha Kapoor', designation: 'QA Engineer', status: 'Absent' },
  { name: 'Arjun Reddy', designation: 'Backend Developer', status: 'Present' },
];

const MOCK_HOLIDAYS = [
  { name: 'Independence Day', date: '2025-08-15' },
  { name: 'Gandhi Jayanti', date: '2025-10-02' },
  { name: 'Diwali', date: '2025-10-20' },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: 'Q3 All-Hands Meeting', body: 'Join us for the quarterly all-hands on July 15th at 3 PM. Leadership will share company updates, financial highlights, and the roadmap for Q4.', date: '2025-07-08', author: 'HR Team', category: 'Event', read: false },
  { id: 2, title: 'Updated Leave Policy', body: 'Effective August 1st, the casual leave entitlement increases from 12 to 15 days per annum. Please review the updated policy document in your HR portal.', date: '2025-07-05', author: 'Policy Team', category: 'Policy', read: false },
  { id: 3, title: '🎂 Birthday Wishes — Priya Sharma', body: "Today is Priya's birthday! Drop by her desk or send a message to wish her. The team is gathering at 5 PM for cake.", date: '2025-07-09', author: 'People Team', category: 'Birthday', read: true },
  { id: 4, title: '🏆 Rahul Gupta wins Employee of the Month', body: "Congratulations to Rahul for outstanding contributions this quarter. His work on the new onboarding flow reduced drop-off by 40%.", date: '2025-07-01', author: 'Leadership', category: 'Achievement', read: true },
  { id: 5, title: 'Office Closure — July 21', body: "The office will remain closed on July 21st for scheduled maintenance. Please coordinate with your managers for WFH arrangements.", date: '2025-06-28', author: 'Admin', category: 'Policy', read: true },
];

const MOCK_LEAVE_HISTORY = [
  { id: 1, type: 'Casual Leave', from: '2025-06-10', to: '2025-06-11', days: 2, reason: 'Personal work', status: 'Approved' },
  { id: 2, type: 'Sick Leave', from: '2025-05-22', to: '2025-05-22', days: 1, reason: 'Fever', status: 'Approved' },
  { id: 3, type: 'Earned Leave', from: '2025-07-14', to: '2025-07-18', days: 5, reason: 'Family vacation', status: 'Pending' },
  { id: 4, type: 'Comp-Off', from: '2025-04-18', to: '2025-04-18', days: 1, reason: 'Worked on weekend', status: 'Rejected' },
  { id: 5, type: 'Casual Leave', from: '2025-03-05', to: '2025-03-05', days: 1, reason: 'Birthday', status: 'Approved' },
];

const MOCK_REQUESTS = [
  { id: 1, type: 'Salary Advance', details: '₹25,000 advance requested', date: '2025-07-01', status: 'Pending' },
  { id: 2, type: 'Reimbursement', details: '₹3,450 travel expense', date: '2025-06-15', status: 'Approved' },
  { id: 3, type: 'WFH Request', details: 'July 10–12, Remote work', date: '2025-07-08', status: 'Approved' },
];

const MOCK_DOCUMENTS = [
  { id: 1, category: 'Identity', name: 'PAN Card', date: '2024-01-10', status: 'Verified' },
  { id: 2, category: 'Identity', name: 'Aadhaar Card', date: '2024-01-10', status: 'Verified' },
  { id: 3, category: 'Employment', name: 'Offer Letter', date: '2024-01-15', status: 'Verified' },
  { id: 4, category: 'Employment', name: 'Appointment Letter', date: '2024-02-01', status: 'Verified' },
  { id: 5, category: 'Tax', name: 'Form 16 FY 2024-25', date: '2025-06-10', status: 'Verified' },
  { id: 6, category: 'Tax', name: 'Form 12BB', date: '2025-01-20', status: 'Pending' },
];

const STATUS_COLORS = {
  Present: 'bg-emerald-100 text-emerald-700',
  'On Leave': 'bg-amber-100 text-amber-700',
  WFH: 'bg-blue-100 text-blue-700',
  Absent: 'bg-red-100 text-red-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-red-100 text-red-700',
  Processed: 'bg-emerald-100 text-emerald-700',
  Verified: 'bg-emerald-100 text-emerald-700',
};

const CAT_COLORS = {
  Policy: 'bg-blue-100 text-blue-700',
  Event: 'bg-purple-100 text-purple-700',
  Birthday: 'bg-pink-100 text-pink-700',
  Achievement: 'bg-amber-100 text-amber-700',
};

// ── sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

const LeaveRing = ({ label, used, total, color, size = 80 }) => {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const remaining = total - used;
  const data = [{ value: pct, fill: color }];
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <RadialBarChart
          width={size} height={size}
          cx={size / 2} cy={size / 2}
          innerRadius={size * 0.35} outerRadius={size * 0.48}
          barSize={size * 0.13}
          data={data}
          startAngle={90} endAngle={-270}
        >
          <RadialBar background={{ fill: '#E7E2D8' }} dataKey="value" cornerRadius={4} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-[#2B2B2B]">{remaining}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-[#2B2B2B] text-center leading-tight">{label}</p>
      <p className="text-[10px] text-[#9C9C9C]">{used} / {total} days</p>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const ESSPortal = () => {
  const authUser = useAuthStore(s => s.user);
  const localUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const user = authUser || localUser;
  const firstName = (user?.ownerName || user?.name || user?.email || 'there').split(' ')[0];

  const [tab, setTab] = useState('home');
  const [now, setNow] = useState(new Date());

  // Dashboard data
  const [leaveBalances, setLeaveBalances] = useState({ casual: { used: 4, total: 12 }, sick: { used: 2, total: 12 }, earned: { used: 3, total: 15 } });
  const [attSummary, setAttSummary] = useState({ present: 18, workingDays: 22, streak: 7, pending: 2 });
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [payslipList, setPayslipList] = useState([]);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const unreadCount = announcements.filter(a => !a.read).length;

  // Punch state
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [workedSecs, setWorkedSecs] = useState(0);
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | verifying | verified | denied

  // Location preference: 'ip' | 'gps' | 'none'
  const [locPref, setLocPref] = useState(() => localStorage.getItem('locPref') || 'ip');
  const [ipLocation, setIpLocation] = useState(null);
  const [ipStatus, setIpStatus] = useState('idle'); // idle | loading | loaded | error
  const [recentAtt, setRecentAtt] = useState([
    { date: '2025-07-08', in: '09:05', out: '18:12', hours: '9:07' },
    { date: '2025-07-07', in: '09:22', out: '18:45', hours: '9:23' },
    { date: '2025-07-04', in: '08:58', out: '17:55', hours: '8:57' },
    { date: '2025-07-03', in: '09:10', out: '18:30', hours: '9:20' },
    { date: '2025-07-02', in: '09:00', out: '18:00', hours: '9:00' },
  ]);

  // Leave form
  const [leaveForm, setLeaveForm] = useState({ type: 'Casual Leave', from: '', to: '', reason: '' });
  const [leaveHistory, setLeaveHistory] = useState(MOCK_LEAVE_HISTORY);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Team
  const [teamMembers, setTeamMembers] = useState(MOCK_TEAM);

  // Documents
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);

  // Requests
  const [activeRequest, setActiveRequest] = useState(null);
  const [reqForms, setReqForms] = useState({ advance: { amount: '', reason: '' }, reimburse: { type: '', amount: '', date: '', desc: '' }, wfh: { from: '', to: '', reason: '' }, asset: { type: '', justification: '' } });
  const [myRequests, setMyRequests] = useState(MOCK_REQUESTS);

  const clockRef = useRef(null);
  const workerRef = useRef(null);

  // Clock
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  // Worked seconds counter
  useEffect(() => {
    if (punchedIn && punchInTime) {
      workerRef.current = setInterval(() => {
        setWorkedSecs(Math.floor((Date.now() - punchInTime) / 1000));
      }, 1000);
    } else {
      clearInterval(workerRef.current);
    }
    return () => clearInterval(workerRef.current);
  }, [punchedIn, punchInTime]);

  // Auto-detect IP location when pref is ip
  useEffect(() => {
    if (locPref === 'none') { setIpStatus('idle'); return; }
    setIpStatus('loading');
    attendanceAPI.getIpLocation()
      .then(r => { setIpLocation(r.data || r); setIpStatus('loaded'); })
      .catch(() => setIpStatus('error'));
  }, [locPref]);

  // Load data on mount
  useEffect(() => {
    (async () => {
      try {
        const dash = await essAPI.getDashboard();
        if (dash?.data?.leaveBalances) {
          const b = dash.data.leaveBalances;
          setLeaveBalances({
            casual: b.find(x => x.type === 'Casual Leave') || leaveBalances.casual,
            sick: b.find(x => x.type === 'Sick Leave') || leaveBalances.sick,
            earned: b.find(x => x.type === 'Earned Leave') || leaveBalances.earned,
          });
        }
      } catch { /* offline – keep defaults */ }

      try {
        const lb = await leaveAPI.getBalance();
        if (lb?.data) {
          const b = lb.data;
          setLeaveBalances({
            casual: b.find(x => x.leaveType === 'Casual Leave') || leaveBalances.casual,
            sick: b.find(x => x.leaveType === 'Sick Leave') || leaveBalances.sick,
            earned: b.find(x => x.leaveType === 'Earned Leave') || leaveBalances.earned,
          });
        }
      } catch { /* offline */ }

      // Build salary trend from mock data
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return { month: format(d, 'MMM'), net: 72000 + Math.round((Math.random() - 0.3) * 8000) };
      });
      setSalaryHistory(months);

      const ps = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return { month: format(d, 'MMMM yyyy'), net: 72000 + Math.round((Math.random() - 0.3) * 8000), status: i === 0 ? 'Pending' : 'Processed', id: `ps_${i}` };
      });
      setPayslipList(ps);
    })();
  }, []);

  const handlePunch = async () => {
    if (!punchedIn) {
      if (locPref === 'gps') {
        setGeoStatus('verifying');
        navigator.geolocation?.getCurrentPosition(
          async (pos) => {
            const coords = { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) };
            setGeoCoords(coords);
            setGeoStatus('verified');
            try { await attendanceAPI.checkIn({ location: `${coords.lat},${coords.lng}`, locationSource: 'gps' }); } catch { /* offline */ }
            setPunchedIn(true);
            setPunchInTime(Date.now());
            toast.success('Punched in with GPS!');
          },
          () => {
            setGeoStatus('denied');
            setPunchedIn(true);
            setPunchInTime(Date.now());
            toast.success('Punched in (GPS unavailable)');
          },
          { timeout: 6000 }
        );
      } else if (locPref === 'ip') {
        const locStr = ipLocation?.city
          ? `${ipLocation.city}${ipLocation.region ? ', ' + ipLocation.region : ''}, ${ipLocation.country} (${ipLocation.ip})`
          : undefined;
        try { await attendanceAPI.checkIn({ location: locStr, locationSource: 'ip' }); } catch { /* offline */ }
        setGeoStatus('verified');
        setPunchedIn(true);
        setPunchInTime(Date.now());
        toast.success(`Punched in from ${ipLocation?.city || 'your location'}!`);
      } else {
        try { await attendanceAPI.checkIn({ locationSource: 'none' }); } catch { /* offline */ }
        setPunchedIn(true);
        setPunchInTime(Date.now());
        toast.success('Punched in (location tracking off)');
      }
    } else {
      const locStr = locPref === 'gps' && geoCoords
        ? `${geoCoords.lat},${geoCoords.lng}`
        : locPref === 'ip' && ipLocation?.city
          ? `${ipLocation.city}, ${ipLocation.country} (${ipLocation.ip})`
          : undefined;
      try { await attendanceAPI.checkOut({ location: locStr }); } catch { /* offline */ }
      setPunchedIn(false);
      setWorkedSecs(0);
      setPunchInTime(null);
      setGeoStatus('idle');
      toast.success('Punched out. Have a great evening!');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.from || !leaveForm.to || !leaveForm.reason) { toast.error('Please fill all fields'); return; }
    setLeaveSubmitting(true);
    try {
      await leaveAPI.apply({ leaveType: leaveForm.type, startDate: leaveForm.from, endDate: leaveForm.to, reason: leaveForm.reason });
      toast.success('Leave application submitted!');
    } catch { toast.success('Leave application submitted (queued)!'); }
    const newLeave = { id: Date.now(), type: leaveForm.type, from: leaveForm.from, to: leaveForm.to, days: 1, reason: leaveForm.reason, status: 'Pending' };
    setLeaveHistory(prev => [newLeave, ...prev]);
    setLeaveForm({ type: 'Casual Leave', from: '', to: '', reason: '' });
    setLeaveSubmitting(false);
  };

  const handleRequestSubmit = async (type) => {
    try {
      await approvalAPI.trigger({ module: 'ess_request', type, data: reqForms });
      toast.success('Request submitted successfully!');
    } catch { toast.success('Request submitted (queued)!'); }
    const labels = { advance: 'Salary Advance', reimburse: 'Reimbursement', wfh: 'WFH Request', asset: 'IT Asset' };
    setMyRequests(prev => [{ id: Date.now(), type: labels[type], details: 'New request', date: format(new Date(), 'yyyy-MM-dd'), status: 'Pending' }, ...prev]);
    setActiveRequest(null);
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'punch', label: 'Punch', icon: Clock },
    { id: 'payslips', label: 'Payslips', icon: FileText },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'requests', label: 'Requests', icon: Inbox },
    { id: 'announcements', label: 'Announcements', icon: Bell, badge: unreadCount },
  ];

  const isLongWeekendDay = isWednesday(now) || isThursday(now);

  return (
    <div className="space-y-4 pb-10">
      <style>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .punch-pulse { animation: pulseRing 1.5s infinite; }
      `}</style>

      {/* Tab Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab === t.id ? 'bg-[#2B2B2B] text-white' : 'bg-white text-[#9C9C9C] border border-[#E7E2D8] hover:bg-[#F5F1E6]'}`}
          >
            <t.icon size={14} />
            {t.label}
            {t.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: HOME ─────────────────────────────────────────── */}
      {tab === 'home' && (
        <div className="space-y-4">
          {/* Greeting header */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #2B2B2B 0%, #4a4a4a 100%)' }}>
            <p className="text-2xl font-bold">{greeting()}, {firstName} 👋</p>
            <p className="text-sm mt-1 opacity-70">{format(now, 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-3xl font-mono font-light mt-2">{format(now, 'hh:mm a')}</p>
          </div>

          {/* Stats 2x2 / 4-col */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Attendance Streak', value: `${attSummary.streak} days 🔥`, color: 'text-orange-500' },
              { label: 'Leave Balance', value: `${(leaveBalances.casual.total - leaveBalances.casual.used) + (leaveBalances.sick.total - leaveBalances.sick.used) + (leaveBalances.earned.total - leaveBalances.earned.used)} days`, color: 'text-emerald-600' },
              { label: 'This Month', value: `${attSummary.present} / ${attSummary.workingDays}`, color: 'text-[#2B2B2B]' },
              { label: 'Pending', value: `${attSummary.pending} items`, color: 'text-amber-600' },
            ].map((s, i) => (
              <div key={i} className="card">
                <p className="text-xs text-[#9C9C9C]">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Leave ring charts */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-4">Leave Balance</p>
            <div className="flex justify-around">
              <LeaveRing label="Casual" used={leaveBalances.casual.used} total={leaveBalances.casual.total} color="#F3CC4D" />
              <LeaveRing label="Sick" used={leaveBalances.sick.used} total={leaveBalances.sick.total} color="#ef4444" />
              <LeaveRing label="Earned" used={leaveBalances.earned.used} total={leaveBalances.earned.total} color="#10b981" />
            </div>
          </div>

          {/* Upcoming holidays */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">Upcoming Holidays</p>
            <div className="space-y-2">
              {MOCK_HOLIDAYS.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F1E6]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎉</span>
                    <span className="text-sm font-medium text-[#2B2B2B]">{h.name}</span>
                  </div>
                  <span className="text-xs text-[#9C9C9C]">{format(parseISO(h.date), 'MMM d, yyyy')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">Quick Actions</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Clock, label: 'Mark Attendance', action: () => setTab('punch') },
                { icon: Calendar, label: 'Apply Leave', action: () => setTab('leave') },
                { icon: FileText, label: 'View Payslip', action: () => setTab('payslips') },
                { icon: Inbox, label: 'Raise Request', action: () => setTab('requests') },
                { icon: FolderOpen, label: 'My Documents', action: () => setTab('documents') },
                { icon: Users, label: 'My Team', action: () => setTab('team') },
              ].map((a, i) => (
                <button key={i} onClick={a.action} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8] hover:bg-[#ede8db] transition-all text-center">
                  <div className="w-9 h-9 rounded-xl bg-[#2B2B2B] flex items-center justify-center">
                    <a.icon size={16} className="text-[#F3CC4D]" />
                  </div>
                  <span className="text-[11px] font-medium text-[#2B2B2B] leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PUNCH ────────────────────────────────────────── */}
      {tab === 'punch' && (
        <div className="space-y-4">
          <div className="card flex flex-col items-center gap-6 py-8">
            {/* Live clock */}
            <p className="text-5xl font-mono font-light text-[#2B2B2B]">{format(now, 'hh:mm:ss')}</p>
            <p className="text-sm text-[#9C9C9C]">{format(now, 'EEEE, MMM d')}</p>

            {/* Punch button */}
            <button
              onClick={handlePunch}
              disabled={geoStatus === 'verifying'}
              style={{ width: 180, height: 180, borderRadius: '50%', fontSize: 18, fontWeight: 700, letterSpacing: 2, border: 'none', cursor: geoStatus === 'verifying' ? 'not-allowed' : 'pointer', background: punchedIn ? '#ef4444' : '#10b981', color: '#fff' }}
              className={punchedIn ? 'punch-pulse' : ''}
            >
              {geoStatus === 'verifying' ? 'Locating...' : punchedIn ? 'PUNCH OUT' : 'PUNCH IN'}
            </button>

            {/* Hours worked */}
            <div className="text-center">
              <p className="text-xs text-[#9C9C9C] uppercase tracking-wide">Hours worked today</p>
              <p className="text-2xl font-mono font-semibold text-[#2B2B2B] mt-1">{fmtHMS(workedSecs)}</p>
            </div>
          </div>

          {/* Location preference card */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#9C9C9C]" />
                <p className="text-sm font-semibold text-[#2B2B2B]">Location Tracking</p>
              </div>
              <div className="flex gap-1 p-1 bg-[#F5F1E6] rounded-xl">
                {[{ id: 'ip', label: 'IP' }, { id: 'gps', label: 'GPS' }, { id: 'none', label: 'Off' }].map(opt => (
                  <button key={opt.id}
                    onClick={() => { setLocPref(opt.id); localStorage.setItem('locPref', opt.id); }}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${locPref === opt.id ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-[#9C9C9C] hover:text-[#2B2B2B]'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {locPref === 'ip' && (
              <div className="rounded-xl bg-[#F5F1E6] p-3">
                {ipStatus === 'loading' && (
                  <div className="flex items-center gap-2">
                    <RefreshCw size={13} className="text-amber-500 animate-spin" />
                    <p className="text-xs text-amber-600">Detecting your location via IP...</p>
                  </div>
                )}
                {ipStatus === 'loaded' && ipLocation && (
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#2B2B2B]">{[ipLocation.city, ipLocation.region, ipLocation.country].filter(Boolean).join(', ')}</p>
                      <p className="text-[10px] text-[#9C9C9C] mt-0.5">IP: {ipLocation.ip} · City-level accuracy (~5–50 km)</p>
                    </div>
                  </div>
                )}
                {ipStatus === 'error' && (
                  <div className="flex items-center gap-2">
                    <AlertCircle size={13} className="text-red-400" />
                    <p className="text-xs text-red-500">Could not resolve location. Check will still be recorded.</p>
                  </div>
                )}
                {ipStatus === 'idle' && <p className="text-xs text-[#9C9C9C]">IP location will be detected on next punch.</p>}
              </div>
            )}

            {locPref === 'gps' && (
              <div className="rounded-xl bg-[#F5F1E6] p-3">
                {geoStatus === 'idle' && <p className="text-xs text-[#9C9C9C]">GPS coordinates captured on punch-in. Requires browser permission.</p>}
                {geoStatus === 'verifying' && (
                  <div className="flex items-center gap-2">
                    <RefreshCw size={13} className="text-amber-500 animate-spin" />
                    <p className="text-xs text-amber-600">Acquiring GPS signal...</p>
                  </div>
                )}
                {geoStatus === 'verified' && geoCoords && (
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-emerald-700">GPS verified — {geoCoords.lat}, {geoCoords.lng}</p>
                      <p className="text-[10px] text-[#9C9C9C] mt-0.5">High accuracy (~10–20 m)</p>
                    </div>
                  </div>
                )}
                {geoStatus === 'denied' && (
                  <div className="flex items-center gap-2">
                    <XCircle size={13} className="text-red-400" />
                    <p className="text-xs text-red-500">GPS permission denied. Switch to IP or Off.</p>
                  </div>
                )}
              </div>
            )}

            {locPref === 'none' && (
              <p className="text-xs text-[#9C9C9C] px-1">Location tracking is disabled. Punch-in will be recorded without any location data.</p>
            )}
          </div>

          {/* Recent attendance */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">Recent Attendance</p>
            <div className="space-y-2">
              {recentAtt.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F1E6]">
                  <div>
                    <p className="text-xs font-medium text-[#2B2B2B]">{format(parseISO(r.date), 'EEE, MMM d')}</p>
                    <p className="text-[10px] text-[#9C9C9C] mt-0.5">In: {r.in} · Out: {r.out}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-emerald-600">{r.hours}</span>
                    <p className="text-[10px] text-[#9C9C9C]">hrs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PAYSLIPS ─────────────────────────────────────── */}
      {tab === 'payslips' && (
        <div className="space-y-4">
          {/* Tax tip */}
          <div className="card border-l-4 border-[#F3CC4D] bg-amber-50 flex items-start gap-3">
            <Lightbulb size={18} className="text-[#F3CC4D] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#2B2B2B]"><span className="font-semibold">Tax Tip:</span> Declare your HRA and 80C investments to save up to ₹46,800 in taxes this year.</p>
          </div>

          {/* Salary trend chart */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-4">Net Salary Trend (Last 6 Months)</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={salaryHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F3CC4D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F3CC4D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9C9C9C' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9C9C9C' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Net Pay']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E7E2D8' }} />
                <Area type="monotone" dataKey="net" stroke="#F3CC4D" strokeWidth={2} fill="url(#salGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Payslip list */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">Payslip History</p>
            <div className="space-y-2">
              {payslipList.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]">
                  <div>
                    <p className="text-sm font-medium text-[#2B2B2B]">{p.month}</p>
                    <p className="text-xs text-[#9C9C9C] mt-0.5">{formatCurrency(p.net)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <button
                      onClick={() => toast.success(`Downloading ${p.month} payslip...`)}
                      className="p-1.5 rounded-lg bg-[#2B2B2B] text-white hover:bg-[#3d3d3d] transition-all"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LEAVE ────────────────────────────────────────── */}
      {tab === 'leave' && (
        <div className="space-y-4">
          {/* Long weekend banner */}
          {isLongWeekendDay && (
            <div className="rounded-2xl p-4 border border-[#F3CC4D] bg-amber-50 flex items-start gap-2">
              <span className="text-lg">✨</span>
              <p className="text-sm text-[#2B2B2B] font-medium">Long weekend alert! Take Friday off and enjoy a 3-day weekend.</p>
            </div>
          )}

          {/* Balance rings large */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-4">Leave Balances</p>
            <div className="flex justify-around">
              <LeaveRing label="Casual Leave" used={leaveBalances.casual.used} total={leaveBalances.casual.total} color="#F3CC4D" size={100} />
              <LeaveRing label="Sick Leave" used={leaveBalances.sick.used} total={leaveBalances.sick.total} color="#ef4444" size={100} />
              <LeaveRing label="Earned Leave" used={leaveBalances.earned.used} total={leaveBalances.earned.total} color="#10b981" size={100} />
            </div>
          </div>

          {/* Apply form */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-4">Apply for Leave</p>
            <form onSubmit={handleLeaveSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Leave Type</label>
                <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]">
                  {['Casual Leave', 'Sick Leave', 'Earned Leave', 'Comp-Off'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9C9C9C] mb-1 block">From</label>
                  <input type="date" value={leaveForm.from} onChange={e => setLeaveForm(p => ({ ...p, from: e.target.value }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
                </div>
                <div>
                  <label className="text-xs text-[#9C9C9C] mb-1 block">To</label>
                  <input type="date" value={leaveForm.to} onChange={e => setLeaveForm(p => ({ ...p, to: e.target.value }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Reason</label>
                <textarea rows={3} value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Brief reason for leave..." className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none" />
              </div>
              <button type="submit" disabled={leaveSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {leaveSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
                Submit Application
              </button>
            </form>
          </div>

          {/* Leave history */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">Recent Applications</p>
            <div className="space-y-2">
              {leaveHistory.slice(0, 5).map((l, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#2B2B2B]">{l.type}</p>
                      <p className="text-xs text-[#9C9C9C] mt-0.5">{l.from} → {l.to} · {l.days} day{l.days > 1 ? 's' : ''}</p>
                      <p className="text-xs text-[#9C9C9C]">{l.reason}</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TEAM ─────────────────────────────────────────── */}
      {tab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2B2B2B]">Your Team</h2>
              <p className="text-xs text-[#9C9C9C]">{teamMembers.length} members</p>
            </div>
            <button onClick={() => toast.success('Org chart coming soon!')} className="btn-primary flex items-center gap-2 text-xs px-3 py-2">
              <Building2 size={13} /> View Org Chart
            </button>
          </div>

          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">Today's Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F1E6] border border-[#E7E2D8]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: avatarColor(m.name) }}>
                    {initials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2B2B2B] truncate">{m.name}</p>
                    <p className="text-xs text-[#9C9C9C] truncate">{m.designation}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Who's online now */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">Online Now</p>
            <div className="flex flex-wrap gap-3">
              {teamMembers.filter(m => m.status === 'Present' || m.status === 'WFH').map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: avatarColor(m.name) }}>
                      {initials(m.name)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <span className="text-xs text-[#2B2B2B]">{m.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DOCUMENTS ────────────────────────────────────── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#2B2B2B]">My Documents</h2>
            <button onClick={() => toast.success('Upload feature coming soon!')} className="btn-primary flex items-center gap-2 text-xs px-3 py-2">
              <Upload size={13} /> Upload
            </button>
          </div>

          {['Identity', 'Employment', 'Tax', 'Others'].map(cat => {
            const docs = documents.filter(d => d.category === cat);
            return (
              <div key={cat} className="card">
                <p className="text-sm font-semibold text-[#2B2B2B] mb-3">{cat}</p>
                {docs.length === 0 ? (
                  <div className="text-center py-6">
                    <FolderOpen size={32} className="text-[#E7E2D8] mx-auto mb-2" />
                    <p className="text-xs text-[#9C9C9C]">No documents uploaded yet.</p>
                    <button onClick={() => toast.success('Upload feature coming soon!')} className="mt-2 text-xs text-[#2B2B2B] underline font-medium">Upload now</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docs.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F1E6]">
                        <FileText size={16} className="text-[#9C9C9C] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2B2B2B]">{d.name}</p>
                          <p className="text-xs text-[#9C9C9C]">{format(parseISO(d.date), 'MMM d, yyyy')}</p>
                        </div>
                        <StatusBadge status={d.status} />
                        <button onClick={() => toast.success(`Downloading ${d.name}...`)} className="p-1.5 rounded-lg bg-[#2B2B2B] text-white hover:bg-[#3d3d3d] transition-all">
                          <Download size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: REQUESTS ─────────────────────────────────────── */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#2B2B2B]">Raise a Request</h2>

          {/* Request type cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'advance', icon: DollarSign, title: 'Salary Advance', desc: 'Request up to 50% of your salary', color: '#F3CC4D' },
              { key: 'reimburse', icon: RefreshCw, title: 'Reimbursement', desc: 'Submit expense for reimbursement', color: '#10b981' },
              { key: 'wfh', icon: Monitor, title: 'WFH Request', desc: 'Request to work from home', color: '#3b82f6' },
              { key: 'asset', icon: Briefcase, title: 'IT Asset', desc: 'Request laptop, mouse, keyboard etc.', color: '#8b5cf6' },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setActiveRequest(activeRequest === r.key ? null : r.key)}
                className={`card text-left transition-all ${activeRequest === r.key ? 'ring-2 ring-[#2B2B2B]' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: r.color + '22' }}>
                  <r.icon size={18} style={{ color: r.color }} />
                </div>
                <p className="text-sm font-semibold text-[#2B2B2B]">{r.title}</p>
                <p className="text-[11px] text-[#9C9C9C] mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          {/* Expanded forms */}
          {activeRequest === 'advance' && (
            <div className="card space-y-3">
              <p className="text-sm font-semibold text-[#2B2B2B]">Salary Advance Request</p>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Amount (₹)</label>
                <input type="number" value={reqForms.advance.amount} onChange={e => setReqForms(p => ({ ...p, advance: { ...p.advance, amount: e.target.value } }))} placeholder="25000" className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
              </div>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Reason</label>
                <textarea rows={3} value={reqForms.advance.reason} onChange={e => setReqForms(p => ({ ...p, advance: { ...p.advance, reason: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none" />
              </div>
              <button onClick={() => handleRequestSubmit('advance')} className="btn-primary w-full">Submit Request</button>
            </div>
          )}

          {activeRequest === 'reimburse' && (
            <div className="card space-y-3">
              <p className="text-sm font-semibold text-[#2B2B2B]">Reimbursement Request</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9C9C9C] mb-1 block">Expense Type</label>
                  <select value={reqForms.reimburse.type} onChange={e => setReqForms(p => ({ ...p, reimburse: { ...p.reimburse, type: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]">
                    <option value="">Select...</option>
                    {['Travel', 'Meals', 'Accommodation', 'Equipment', 'Training', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9C9C9C] mb-1 block">Amount (₹)</label>
                  <input type="number" value={reqForms.reimburse.amount} onChange={e => setReqForms(p => ({ ...p, reimburse: { ...p.reimburse, amount: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Date</label>
                <input type="date" value={reqForms.reimburse.date} onChange={e => setReqForms(p => ({ ...p, reimburse: { ...p.reimburse, date: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
              </div>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Description</label>
                <textarea rows={2} value={reqForms.reimburse.desc} onChange={e => setReqForms(p => ({ ...p, reimburse: { ...p.reimburse, desc: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none" />
              </div>
              <button onClick={() => handleRequestSubmit('reimburse')} className="btn-primary w-full">Submit Request</button>
            </div>
          )}

          {activeRequest === 'wfh' && (
            <div className="card space-y-3">
              <p className="text-sm font-semibold text-[#2B2B2B]">WFH Request</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9C9C9C] mb-1 block">From</label>
                  <input type="date" value={reqForms.wfh.from} onChange={e => setReqForms(p => ({ ...p, wfh: { ...p.wfh, from: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
                </div>
                <div>
                  <label className="text-xs text-[#9C9C9C] mb-1 block">To</label>
                  <input type="date" value={reqForms.wfh.to} onChange={e => setReqForms(p => ({ ...p, wfh: { ...p.wfh, to: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Reason</label>
                <textarea rows={3} value={reqForms.wfh.reason} onChange={e => setReqForms(p => ({ ...p, wfh: { ...p.wfh, reason: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none" />
              </div>
              <button onClick={() => handleRequestSubmit('wfh')} className="btn-primary w-full">Submit Request</button>
            </div>
          )}

          {activeRequest === 'asset' && (
            <div className="card space-y-3">
              <p className="text-sm font-semibold text-[#2B2B2B]">IT Asset Request</p>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Asset Type</label>
                <select value={reqForms.asset.type} onChange={e => setReqForms(p => ({ ...p, asset: { ...p.asset, type: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]">
                  <option value="">Select asset...</option>
                  {['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones', 'Webcam', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#9C9C9C] mb-1 block">Justification</label>
                <textarea rows={3} value={reqForms.asset.justification} onChange={e => setReqForms(p => ({ ...p, asset: { ...p.asset, justification: e.target.value } }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none" />
              </div>
              <button onClick={() => handleRequestSubmit('asset')} className="btn-primary w-full">Submit Request</button>
            </div>
          )}

          {/* My requests */}
          <div className="card">
            <p className="text-sm font-semibold text-[#2B2B2B] mb-3">My Requests</p>
            {myRequests.length === 0 ? (
              <p className="text-sm text-[#9C9C9C] text-center py-4">No requests yet.</p>
            ) : (
              <div className="space-y-2">
                {myRequests.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F1E6]">
                    <div>
                      <p className="text-sm font-medium text-[#2B2B2B]">{r.type}</p>
                      <p className="text-xs text-[#9C9C9C]">{r.details} · {r.date}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: ANNOUNCEMENTS ────────────────────────────────── */}
      {tab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#2B2B2B]">Announcements</h2>
            {unreadCount > 0 && (
              <button
                onClick={() => setAnnouncements(prev => prev.map(a => ({ ...a, read: true })))}
                className="text-xs text-[#9C9C9C] hover:text-[#2B2B2B] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className={`card transition-all ${!a.read ? 'border-l-4 border-[#F3CC4D]' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[a.category] || 'bg-gray-100 text-gray-600'}`}>
                      {a.category === 'Birthday' ? '🎂 ' : a.category === 'Achievement' ? '🏆 ' : ''}{a.category}
                    </span>
                    {!a.read && <span className="w-2 h-2 rounded-full bg-[#F3CC4D] flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-[#9C9C9C] flex-shrink-0">{format(parseISO(a.date), 'MMM d')}</span>
                </div>
                <p className="text-sm font-semibold text-[#2B2B2B] mb-1">{a.title}</p>
                <p className="text-xs text-[#9C9C9C] line-clamp-2 mb-2">{a.body}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#9C9C9C]">By {a.author}</span>
                  <button
                    onClick={() => {
                      setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, read: true } : x));
                      toast.success(a.title);
                    }}
                    className="text-xs font-medium text-[#2B2B2B] flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    Read more <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ESSPortal;
