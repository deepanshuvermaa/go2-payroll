import { useState, useEffect } from 'react';
import {
  Star, Heart, Crown, Trophy, Target, Lightbulb, Users, TrendingUp,
  CheckCircle, Send, ChevronRight, Calendar, Award, Smile, BarChart2,
  Cake, ArrowUp, X
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { engagementAPI } from '../../services/api';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  'Aarav Singh', 'Priya Sharma', 'Rahul Mehta', 'Sneha Patel',
  'Vikram Nair', 'Anjali Gupta', 'Rohan Das', 'Kavya Reddy',
  'Arjun Kumar', 'Meera Iyer',
];

const BADGE_TYPES = [
  { id: 'star', icon: '⭐', label: 'Star Performer', desc: 'exceptional results', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'team', icon: '🤝', label: 'Team Player', desc: 'went above and beyond', color: 'bg-blue-50 border-blue-200' },
  { id: 'innovator', icon: '💡', label: 'Innovator', desc: 'creative solution', color: 'bg-purple-50 border-purple-200' },
  { id: 'goal', icon: '🎯', label: 'Goal Crusher', desc: 'smashed their targets', color: 'bg-red-50 border-red-200' },
  { id: 'rising', icon: '🌟', label: 'Rising Star', desc: 'learning fast', color: 'bg-green-50 border-green-200' },
  { id: 'culture', icon: '❤️', label: 'Culture Champion', desc: 'living our values', color: 'bg-pink-50 border-pink-200' },
];

const MOCK_FEED = [
  { id: 1, sender: 'Priya Sharma', recipient: 'Aarav Singh', badge: '⭐ Star Performer', message: 'Delivered the entire migration project ahead of schedule. Truly exceptional work!', time: '2h ago', likes: 7, liked: false, special: null },
  { id: 2, sender: 'Vikram Nair', recipient: 'Sneha Patel', badge: '💡 Innovator', message: 'The new onboarding flow idea was brilliant — reduced drop-off by 30%.', time: '5h ago', likes: 12, liked: false, special: null },
  { id: 3, sender: 'System', recipient: 'Rohan Das', badge: '🎂 Birthday', message: 'Wishing Rohan a very happy birthday! 🎉', time: '8h ago', likes: 22, liked: false, special: 'birthday' },
  { id: 4, sender: 'Anjali Gupta', recipient: 'Rahul Mehta', badge: '🤝 Team Player', message: 'Stayed late three nights straight to help the team hit the deadline. Hero!', time: '1d ago', likes: 9, liked: false, special: null },
  { id: 5, sender: 'System', recipient: 'Kavya Reddy', badge: '🎂 Work Anniversary', message: 'Kavya completes 3 years with us today! Thank you for your dedication.', time: '1d ago', likes: 18, liked: false, special: 'anniversary' },
  { id: 6, sender: 'Rohan Das', recipient: 'Meera Iyer', badge: '🌟 Rising Star', message: "Meera's growth this quarter has been incredible — from intern to leading a module!", time: '2d ago', likes: 14, liked: false, special: null },
];

const LEADERBOARD_DATA = [
  { rank: 1, name: 'Priya Sharma', dept: 'Engineering', kudos: 18, attendance: 98, goals: 95, score: 96, avatar: 'PS' },
  { rank: 2, name: 'Aarav Singh', dept: 'Product', kudos: 15, attendance: 97, goals: 92, score: 93, avatar: 'AS' },
  { rank: 3, name: 'Kavya Reddy', dept: 'Design', kudos: 13, attendance: 100, goals: 88, score: 90, avatar: 'KR' },
  { rank: 4, name: 'Rahul Mehta', dept: 'Engineering', kudos: 11, attendance: 95, goals: 91, score: 88, avatar: 'RM' },
  { rank: 5, name: 'Meera Iyer', dept: 'Marketing', kudos: 10, attendance: 96, goals: 85, score: 85, avatar: 'MI' },
  { rank: 6, name: 'Vikram Nair', dept: 'Sales', kudos: 9, attendance: 93, goals: 90, score: 83, avatar: 'VN' },
  { rank: 7, name: 'Anjali Gupta', dept: 'HR', kudos: 8, attendance: 99, goals: 82, score: 81, avatar: 'AG' },
  { rank: 8, name: 'Rohan Das', dept: 'Engineering', kudos: 7, attendance: 94, goals: 80, score: 78, avatar: 'RD' },
  { rank: 9, name: 'Sneha Patel', dept: 'Finance', kudos: 6, attendance: 92, goals: 78, score: 75, avatar: 'SP' },
  { rank: 10, name: 'Arjun Kumar', dept: 'Operations', kudos: 4, attendance: 90, goals: 75, score: 71, avatar: 'AK' },
];

const MOOD_PULSE_DATA = [
  { week: 'Wk 18', score: 3.8 }, { week: 'Wk 19', score: 4.0 },
  { week: 'Wk 20', score: 3.6 }, { week: 'Wk 21', score: 4.2 },
  { week: 'Wk 22', score: 4.1 }, { week: 'Wk 23', score: 4.2 },
];

const ENPS_TREND = [
  { month: 'Jan', score: 28 }, { month: 'Feb', score: 33 },
  { month: 'Mar', score: 30 }, { month: 'Apr', score: 38 },
  { month: 'May', score: 40 }, { month: 'Jun', score: 42 },
];

const ENPS_BREAKDOWN = [
  { name: 'Promoters', value: 62, fill: '#22c55e' },
  { name: 'Passives', value: 18, fill: '#f59e0b' },
  { name: 'Detractors', value: 20, fill: '#ef4444' },
];

const NPS_COMMENTS = [
  { text: 'The culture here is genuinely supportive. I feel heard and valued.', tag: 'Culture' },
  { text: 'Growth opportunities are great but the compensation could be more competitive.', tag: 'Compensation' },
  { text: 'My manager is excellent — gives clear feedback and celebrates wins.', tag: 'Management' },
  { text: 'Would love more structured learning & development programs.', tag: 'Growth' },
  { text: "Work-life balance is better than anywhere I've worked before.", tag: 'Culture' },
];

const MOOD_BREAKDOWN = [
  { mood: '😫 Terrible', pct: 5, color: '#ef4444' },
  { mood: '😕 Bad', pct: 8, color: '#f97316' },
  { mood: '😐 Okay', pct: 22, color: '#f59e0b' },
  { mood: '🙂 Good', pct: 45, color: '#84cc16' },
  { mood: '🤩 Amazing', pct: 20, color: '#22c55e' },
];

const WEEK_MOOD_BAR = [
  { day: 'Mon', avg: 3.9 }, { day: 'Tue', avg: 4.1 },
  { day: 'Wed', avg: 3.7 }, { day: 'Thu', avg: 4.3 }, { day: 'Fri', avg: 4.5 },
];

// Generate 30-day heatmap mock data
const HEATMAP_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  score: +(2.5 + Math.random() * 2.5).toFixed(1),
}));

function moodColor(score) {
  if (score >= 4.5) return 'bg-green-500';
  if (score >= 3.5) return 'bg-green-300';
  if (score >= 2.5) return 'bg-yellow-300';
  if (score >= 1.5) return 'bg-orange-400';
  return 'bg-red-500';
}

function enpsLabel(score) {
  if (score > 70) return { text: 'Excellent', color: 'text-green-600' };
  if (score > 30) return { text: 'Good', color: 'text-green-500' };
  if (score >= 0) return { text: 'Needs Work', color: 'text-amber-500' };
  return { text: 'Critical', color: 'text-red-500' };
}

// ─── Tab: Pulse ───────────────────────────────────────────────────────────────

function PulseTab({ trend }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [stars, setStars] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emojis = ['😫', '😕', '😐', '🙂', '🤩'];

  const handleSubmit = async () => {
    if (!selectedMood || !stars) return;
    try {
      await engagementAPI.submitPulse({ mood: selectedMood + 1, energy: stars, productivity: stars });
    } catch { /* offline fallback */ }
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {submitted ? (
        <div className="card flex items-center gap-4 border-green-200 bg-green-50">
          <CheckCircle className="text-green-500 shrink-0" size={28} />
          <div>
            <p className="font-semibold text-green-800">Thanks for sharing! 🙏</p>
            <p className="text-sm text-green-600">Your response has been recorded anonymously.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E7E2D8] p-6 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #2B2B2B 0%, #444 100%)' }}>
          <span className="text-xs font-semibold text-[#F3CC4D] uppercase tracking-widest">Week 23 Check-in</span>
          <h3 className="text-white text-lg font-bold mt-1 mb-5">How's the team doing?</h3>

          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <p className="text-white font-medium mb-3">1. How are you feeling this week?</p>
            <div className="flex gap-3 justify-center">
              {emojis.map((e, i) => (
                <button key={i} onClick={() => setSelectedMood(i)}
                  className={`text-3xl p-2 rounded-xl transition-all ${selectedMood === i ? 'bg-[#F3CC4D] scale-110 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <p className="text-white font-medium mb-3">2. How productive have you been?</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setStars(s)}
                  className="transition-all">
                  <Star size={28} fill={(hoverStar || stars) >= s ? '#F3CC4D' : 'transparent'}
                    color={(hoverStar || stars) >= s ? '#F3CC4D' : '#ffffff80'} />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 mb-5">
            <p className="text-white font-medium mb-2">3. Anything on your mind? <span className="text-white/50 text-sm font-normal">(optional)</span></p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Share anonymously..."
              className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:border-[#F3CC4D]"
              rows={3} />
          </div>

          <button onClick={handleSubmit}
            disabled={!selectedMood || !stars}
            className="w-full bg-[#F3CC4D] text-[#2B2B2B] rounded-xl py-3 font-semibold text-sm hover:bg-yellow-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Submit Pulse Check
          </button>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-4">Team Mood Trend — Last 6 Weeks</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend || MOOD_PULSE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9C9C9C' }} />
            <YAxis domain={[1, 5]} tick={{ fontSize: 12, fill: '#9C9C9C' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E7E2D8', fontSize: 13 }} />
            <Line type="monotone" dataKey="score" stroke="#F3CC4D" strokeWidth={3}
              dot={{ r: 5, fill: '#F3CC4D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-4">Response Breakdown — This Week</h3>
        <div className="space-y-3">
          {MOOD_BREAKDOWN.map(({ mood, pct, color }) => (
            <div key={mood} className="flex items-center gap-3">
              <span className="text-sm w-32 shrink-0">{mood}</span>
              <div className="flex-1 bg-[#F5F1E6] rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-sm text-[#9C9C9C] w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Recognition ─────────────────────────────────────────────────────────

function RecognitionTab({ feed, setFeed }) {
  const [search, setSearch] = useState('');
  const [recipient, setRecipient] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [badge, setBadge] = useState(null);
  const [message, setMessage] = useState('');
  const filtered = TEAM_MEMBERS.filter(m => m.toLowerCase().includes(search.toLowerCase()) && search);

  const handleSend = async () => {
    if (!recipient || !badge || !message.trim()) return;
    try {
      await engagementAPI.sendKudos({ toId: recipient, badge, message, points: 10 });
    } catch {}
    setFeed(prev => [{ id: Date.now(), sender: 'You', recipient, badge, message, time: 'just now', likes: 0, liked: false }, ...prev]);
    setRecipient(''); setSearch(''); setBadge(null); setMessage('');
    toast.success('Kudos sent!');
  };

  const toggleLike = (id) => {
    setFeed(feed.map(f => f.id === id
      ? { ...f, likes: f.liked ? f.likes - 1 : f.likes + 1, liked: !f.liked }
      : f));
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-4">Give a Kudos 🎉</h3>

        <div className="relative mb-4">
          <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide mb-1 block">To</label>
          <input value={recipient || search}
            onChange={e => { setSearch(e.target.value); setRecipient(''); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search team member..."
            className="w-full border border-[#E7E2D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2B2B2B]" />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-[#E7E2D8] rounded-xl shadow-lg overflow-hidden">
              {filtered.map(m => (
                <button key={m} onMouseDown={() => { setRecipient(m); setSearch(m); setShowSuggestions(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F5F1E6] transition-colors">
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide mb-2 block">Badge</label>
          <div className="grid grid-cols-3 gap-2">
            {BADGE_TYPES.map(bt => (
              <button key={bt.id} onClick={() => setBadge(bt.id)}
                className={`border rounded-xl p-3 text-left transition-all ${badge === bt.id ? 'border-[#2B2B2B] bg-[#2B2B2B] text-white' : `${bt.color} border hover:border-[#2B2B2B]`}`}>
                <div className="text-xl mb-1">{bt.icon}</div>
                <div className="text-xs font-semibold leading-tight">{bt.label}</div>
                <div className={`text-xs mt-0.5 ${badge === bt.id ? 'text-white/60' : 'text-[#9C9C9C]'}`}>{bt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide mb-1 block">
            Message <span className="text-[#9C9C9C] normal-case font-normal">({message.length}/280)</span>
          </label>
          <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 280))}
            placeholder="What did they do?"
            className="w-full border border-[#E7E2D8] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#2B2B2B]"
            rows={3} />
        </div>

        <button onClick={handleSend}
          disabled={!recipient || !badge || !message.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          <Send size={15} /> Send Kudos 🎉
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-4">Recognition Feed</h3>
        <div className="space-y-3">
          {feed.map(item => (
            <div key={item.id}
              className={`rounded-xl border p-4 transition-all hover:shadow-md ${item.special === 'birthday' || item.special === 'anniversary' ? 'bg-yellow-50 border-yellow-200' : 'bg-[#F5F1E6] border-[#E7E2D8]'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  {(item.special) ? (
                    <div className="w-9 h-9 rounded-full bg-[#F3CC4D] flex items-center justify-center shrink-0">
                      <Cake size={16} color="#2B2B2B" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#2B2B2B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {item.sender === 'You' ? 'ME' : item.sender.split(' ').map(w => w[0]).join('')}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#2B2B2B]">
                      <span className="font-semibold">{item.sender}</span> gave{' '}
                      <span className="bg-white border border-[#E7E2D8] rounded-full px-2 py-0.5 text-xs font-semibold">{item.badge}</span>{' '}
                      to <span className="font-semibold">{item.recipient}</span>
                    </p>
                    <p className="text-sm text-[#9C9C9C] mt-1 leading-relaxed">"{item.message}"</p>
                    <p className="text-xs text-[#9C9C9C] mt-1">{item.time}</p>
                  </div>
                </div>
                <button onClick={() => toggleLike(item.id)}
                  className={`flex items-center gap-1 shrink-0 text-sm transition-all ${item.liked ? 'text-red-500' : 'text-[#9C9C9C] hover:text-red-400'}`}>
                  <Heart size={14} fill={item.liked ? 'currentColor' : 'none'} />
                  <span>{item.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Leaderboard ─────────────────────────────────────────────────────────

function LeaderboardTab({ data }) {
  const [period, setPeriod] = useState('month');
  const [category, setCategory] = useState('recognized');
  const currentUser = 'Rahul Mehta';

  const periodLabels = { month: 'This Month', quarter: 'This Quarter', year: 'This Year' };
  const catLabels = { recognized: 'Most Recognized', punctual: 'Most Punctual', goals: 'Top Goal Achievers' };

  const sorted = [...(data || LEADERBOARD_DATA)].sort((a, b) =>
    category === 'recognized' ? b.kudos - a.kudos :
    category === 'punctual' ? b.attendance - a.attendance :
    b.goals - a.goals
  );

  const top3 = sorted.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = ['h-20', 'h-28', 'h-16'];
  const podiumColors = ['bg-slate-300', 'bg-[#F3CC4D]', 'bg-amber-600'];
  const podiumLabels = ['2nd', '1st', '3rd'];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(periodLabels).map(([k, v]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === k ? 'bg-[#2B2B2B] text-white' : 'bg-white border border-[#E7E2D8] text-[#2B2B2B] hover:border-[#2B2B2B]'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-6 text-center">🏆 Top Performers — {periodLabels[period]}</h3>
        <div className="flex items-end justify-center gap-4 mb-4">
          {podiumOrder.map((emp, i) => emp && (
            <div key={emp.rank} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#2B2B2B] text-white flex items-center justify-center font-bold text-sm relative">
                {emp.avatar}
                {i === 1 && <Crown size={14} className="absolute -top-3 text-[#F3CC4D]" fill="#F3CC4D" />}
              </div>
              <p className="text-xs font-semibold text-[#2B2B2B] text-center max-w-[80px] leading-tight">{emp.name.split(' ')[0]}</p>
              <p className="text-xs text-[#9C9C9C]">{emp.score} pts</p>
              <div className={`${podiumHeights[i]} w-20 ${podiumColors[i]} rounded-t-xl flex items-start justify-center pt-2`}>
                <span className="text-white font-bold text-sm">{podiumLabels[i]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(catLabels).map(([k, v]) => (
          <button key={k} onClick={() => setCategory(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === k ? 'bg-[#F3CC4D] text-[#2B2B2B]' : 'bg-white border border-[#E7E2D8] text-[#9C9C9C] hover:text-[#2B2B2B]'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E7E2D8]">
              {['Rank', 'Employee', 'Dept', 'Kudos', 'Attend %', 'Goals %', 'Score'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9C9C9C] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(emp => (
              <tr key={emp.rank}
                className={`border-b border-[#E7E2D8] transition-colors ${emp.name === currentUser ? 'bg-yellow-50' : 'hover:bg-[#F5F1E6]'}`}>
                <td className="px-4 py-3 font-bold text-[#2B2B2B]">
                  {emp.rank <= 3 ? ['🥇', '🥈', '🥉'][emp.rank - 1] : `#${emp.rank}`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#2B2B2B] text-white text-xs flex items-center justify-center font-bold shrink-0">
                      {emp.avatar}
                    </div>
                    <span className="font-medium text-[#2B2B2B] whitespace-nowrap">{emp.name}</span>
                    {emp.name === currentUser && <span className="text-xs bg-[#F3CC4D] text-[#2B2B2B] px-1.5 py-0.5 rounded font-semibold">You</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#9C9C9C] whitespace-nowrap">{emp.dept}</td>
                <td className="px-4 py-3 font-semibold text-[#2B2B2B]">{emp.kudos}</td>
                <td className="px-4 py-3 text-[#2B2B2B]">{emp.attendance}%</td>
                <td className="px-4 py-3 text-[#2B2B2B]">{emp.goals}%</td>
                <td className="px-4 py-3">
                  <span className="bg-[#2B2B2B] text-white px-2 py-1 rounded-lg text-xs font-bold">{emp.score}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: eNPS ────────────────────────────────────────────────────────────────

function ENPSTab({ data }) {
  const [showModal, setShowModal] = useState(false);
  const [npsScore, setNpsScore] = useState(null);
  const [npsComment, setNpsComment] = useState('');
  const [npsSubmitted, setNpsSubmitted] = useState(false);
  const [commentIndex, setCommentIndex] = useState(0);

  const currentScore = data?.score ?? 42;
  const label = enpsLabel(currentScore);

  const enpsBreakdown = data
    ? [
        { name: 'Promoters', value: data.promoters, fill: '#22c55e' },
        { name: 'Passives', value: data.passives, fill: '#f59e0b' },
        { name: 'Detractors', value: data.detractors, fill: '#ef4444' },
      ]
    : ENPS_BREAKDOWN;

  const handleNpsSubmit = async () => {
    if (npsScore === null) return;
    try {
      await engagementAPI.submitENPS({ score: npsScore, comment: npsComment });
    } catch {}
    setNpsSubmitted(true);
    setTimeout(() => { setShowModal(false); setNpsSubmitted(false); setNpsScore(null); setNpsComment(''); }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="card text-center">
        <p className="text-sm font-medium text-[#9C9C9C] uppercase tracking-widest mb-1">Employee Net Promoter Score</p>
        <div className="text-7xl font-black text-[#2B2B2B] my-3">{currentScore >= 0 ? `+${currentScore}` : currentScore}</div>
        <span className={`text-lg font-bold ${label.color}`}>{label.text}</span>
        <p className="text-sm text-[#9C9C9C] mt-1">Based on {data?.total ?? 87} responses this quarter</p>
        <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto block">
          Take the NPS Survey
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-[#2B2B2B] mb-4 text-center">Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={enpsBreakdown} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={4} label={{ position: 'insideStart', fill: '#fff', fontSize: 11, fontWeight: 700 }} />
              <Legend iconType="circle" iconSize={10} formatter={(v) => <span className="text-xs text-[#2B2B2B]">{v}</span>} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7E2D8', fontSize: 12 }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-[#2B2B2B] mb-4">eNPS Trend — 6 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ENPS_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9C9C9C' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9C9C9C' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7E2D8', fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3}
                dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-4">Anonymous Comments</h3>
        <div className="relative">
          <div className="bg-[#F5F1E6] rounded-xl p-5 min-h-[100px] flex flex-col justify-between">
            <p className="text-[#2B2B2B] italic text-sm leading-relaxed">"{NPS_COMMENTS[commentIndex].text}"</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs bg-[#2B2B2B] text-white px-2 py-1 rounded-full">{NPS_COMMENTS[commentIndex].tag}</span>
              <div className="flex gap-2">
                <button onClick={() => setCommentIndex((commentIndex - 1 + NPS_COMMENTS.length) % NPS_COMMENTS.length)}
                  className="w-7 h-7 rounded-full border border-[#E7E2D8] bg-white flex items-center justify-center hover:border-[#2B2B2B] transition-colors">
                  <ChevronRight size={14} className="rotate-180" />
                </button>
                <button onClick={() => setCommentIndex((commentIndex + 1) % NPS_COMMENTS.length)}
                  className="w-7 h-7 rounded-full border border-[#E7E2D8] bg-white flex items-center justify-center hover:border-[#2B2B2B] transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {NPS_COMMENTS.map((_, i) => (
              <button key={i} onClick={() => setCommentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === commentIndex ? 'bg-[#2B2B2B] w-4' : 'bg-[#E7E2D8]'}`} />
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-[#2B2B2B] text-lg">NPS Survey</h3>
              <button onClick={() => setShowModal(false)} className="text-[#9C9C9C] hover:text-[#2B2B2B]"><X size={20} /></button>
            </div>
            {npsSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-[#2B2B2B]">Thank you! Response recorded anonymously.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#2B2B2B] mb-3">How likely are you to recommend working here to a friend?</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button key={i} onClick={() => setNpsScore(i)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${npsScore === i ? 'bg-[#2B2B2B] text-white' : 'bg-[#F5F1E6] text-[#2B2B2B] hover:bg-[#E7E2D8]'}`}>
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-[#9C9C9C] mb-4">
                  <span>Not at all likely</span><span>Extremely likely</span>
                </div>
                <textarea value={npsComment} onChange={e => setNpsComment(e.target.value)}
                  placeholder="Why did you give this score? (optional)"
                  className="w-full border border-[#E7E2D8] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#2B2B2B] mb-4"
                  rows={3} />
                <button onClick={handleNpsSubmit} disabled={npsScore === null} className="btn-primary w-full disabled:opacity-40">
                  Submit Anonymously
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Mood ────────────────────────────────────────────────────────────────

function MoodTab() {
  const { user } = useAuthStore();
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const avgMoodThisWeek = 3.9;

  const moods = [
    { emoji: '😫', label: 'Terrible', value: 1 },
    { emoji: '😕', label: 'Bad', value: 2 },
    { emoji: '😐', label: 'Okay', value: 3 },
    { emoji: '🙂', label: 'Good', value: 4 },
    { emoji: '🤩', label: 'Amazing', value: 5 },
  ];

  const handleMoodSubmit = (value) => {
    setSelectedMood(value);
    setMoodSubmitted(true);
  };

  const heatmapWeeks = [];
  for (let w = 0; w < Math.ceil(HEATMAP_DATA.length / 7); w++) {
    heatmapWeeks.push(HEATMAP_DATA.slice(w * 7, w * 7 + 7));
  }

  return (
    <div className="space-y-6">
      {isManager && avgMoodThisWeek < 3.0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-2 text-yellow-800 text-sm font-medium">
          ⚠️ Team morale appears low this week. Consider a team check-in.
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-1">Today's Mood Check</h3>
        <p className="text-sm text-[#9C9C9C] mb-5">Your response is completely anonymous 🔒</p>
        {moodSubmitted ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="text-5xl">{moods.find(m => m.value === selectedMood)?.emoji}</div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle size={16} /> Thanks! Your response is anonymous 🔒
            </div>
          </div>
        ) : (
          <div className="flex gap-3 justify-center flex-wrap">
            {moods.map(m => (
              <button key={m.value} onClick={() => handleMoodSubmit(m.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[#E7E2D8] hover:border-[#2B2B2B] hover:bg-[#F5F1E6] transition-all group">
                <span className="text-4xl group-hover:scale-110 transition-transform">{m.emoji}</span>
                <span className="text-xs font-medium text-[#9C9C9C] group-hover:text-[#2B2B2B]">{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-1">Team Mood Heatmap — Last 30 Days</h3>
        <p className="text-xs text-[#9C9C9C] mb-4">Red = low morale · Green = high morale</p>
        <div className="space-y-1.5">
          {heatmapWeeks.map((week, wi) => (
            <div key={wi} className="flex gap-1.5">
              {week.map((day) => (
                <div key={day.day} title={`Day ${day.day}: ${day.score}`}
                  className={`w-8 h-8 rounded-md ${moodColor(day.score)} flex items-center justify-center text-white text-xs font-bold opacity-90 hover:opacity-100 cursor-default`}>
                  {day.day}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-4">Mood Distribution — This Week</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={WEEK_MOOD_BAR} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9C9C9C' }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#9C9C9C' }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7E2D8', fontSize: 12 }}
              formatter={(v) => [`${v} / 5`, 'Avg Mood']} />
            <Bar dataKey="avg" fill="#F3CC4D" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmployeeEngagement() {
  const [tab, setTab] = useState('pulse');
  const [kudosFeed, setKudosFeed] = useState(MOCK_FEED);
  const [leaderboard, setLeaderboard] = useState(LEADERBOARD_DATA);
  const [enpsData, setEnpsData] = useState(null);
  const [pulseTrend, setPulseTrend] = useState(MOOD_PULSE_DATA);

  useEffect(() => {
    engagementAPI.getKudosFeed().then(r => { if (r?.data?.length) setKudosFeed(r.data); }).catch(() => {});
    engagementAPI.getLeaderboard().then(r => { if (r?.data?.length) setLeaderboard(r.data); }).catch(() => {});
    engagementAPI.getENPS().then(r => { if (r?.data) setEnpsData(r.data); }).catch(() => {});
    engagementAPI.getPulseTrend().then(r => { if (r?.data?.length) setPulseTrend(r.data); }).catch(() => {});
  }, []);

  const tabs = [
    { id: 'pulse', label: 'Pulse', icon: TrendingUp },
    { id: 'recognition', label: 'Recognition', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'enps', label: 'eNPS', icon: BarChart2 },
    { id: 'mood', label: 'Mood', icon: Smile },
  ];

  const stats = [
    { label: 'Team Morale Score', value: '4.2 / 5', sub: '↑ from last week', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    { label: 'eNPS Score', value: '+42', sub: 'Good', color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
    { label: 'Recognitions This Month', value: '18', sub: '↑ 3 vs last month', color: 'text-[#2B2B2B]', bg: 'bg-white border-[#E7E2D8]' },
    { label: 'Survey Response Rate', value: '87%', sub: '87 of 100 responded', color: 'text-[#2B2B2B]', bg: 'bg-white border-[#E7E2D8]' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E6] p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-[#2B2B2B]">Employee Engagement</h1>
          <p className="text-sm text-[#9C9C9C] mt-0.5">Pulse checks, recognition, leaderboards & team morale at a glance.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
              <p className="text-xs text-[#9C9C9C] leading-tight mb-1">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#9C9C9C] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#E7E2D8] rounded-2xl p-1 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${tab === t.id ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-[#9C9C9C] hover:text-[#2B2B2B] hover:bg-[#F5F1E6]'}`}>
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {tab === 'pulse' && <PulseTab trend={pulseTrend} />}
        {tab === 'recognition' && <RecognitionTab feed={kudosFeed} setFeed={setKudosFeed} />}
        {tab === 'leaderboard' && <LeaderboardTab data={leaderboard} />}
        {tab === 'enps' && <ENPSTab data={enpsData} />}
        {tab === 'mood' && <MoodTab />}
      </div>
    </div>
  );
}
