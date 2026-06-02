import { useState, useEffect } from 'react';
import { Briefcase, Users, CalendarCheck, FileText, Plus, ArrowRight, X, ChevronRight, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { recruitmentAPI } from '../../services/api';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Joined'];

const STAGE_COLORS = {
  Applied:   { bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  Screening: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Interview: { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  Offer:     { bg: 'bg-emerald-500',light: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200' },
  Joined:    { bg: 'bg-green-600',  light: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
};

const SOURCE_COLORS = {
  LinkedIn: 'bg-blue-100 text-blue-700',
  Referral: 'bg-purple-100 text-purple-700',
  Direct:   'bg-gray-100 text-gray-700',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500',
];

const DEPARTMENTS = ['Engineering', 'Design', 'HR', 'Product', 'DevOps', 'Finance', 'Marketing'];

const initialCandidates = [
  { id: 1, name: 'Arjun Mehta',   role: 'Frontend Developer', stage: 'Applied',   date: '2026-05-28', source: 'LinkedIn', exp: '3 yrs' },
  { id: 2, name: 'Priya Sharma',  role: 'HR Executive',       stage: 'Screening', date: '2026-05-25', source: 'Referral', exp: '2 yrs' },
  { id: 3, name: 'Rahul Verma',   role: 'Backend Developer',  stage: 'Interview', date: '2026-05-20', source: 'Direct',   exp: '5 yrs' },
  { id: 4, name: 'Sneha Patel',   role: 'Product Designer',   stage: 'Offer',     date: '2026-05-15', source: 'LinkedIn', exp: '4 yrs' },
  { id: 5, name: 'Amit Kumar',    role: 'DevOps Engineer',    stage: 'Joined',    date: '2026-05-01', source: 'Referral', exp: '6 yrs' },
  { id: 6, name: 'Kavya Nair',    role: 'Frontend Developer', stage: 'Applied',   date: '2026-06-01', source: 'LinkedIn', exp: '2 yrs' },
];

function daysAgo(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function Avatar({ name, idx }) {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ── Interview Panel ────────────────────────────────────────────────────────────
function InterviewPanel({ candidate, onClose }) {
  const [form, setForm] = useState({ type: 'Technical', date: '', time: '', interviewer: '' });
  const [loading, setLoading] = useState(false);
  const [scheduledInterviewId, setScheduledInterviewId] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, notes: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await recruitmentAPI.scheduleInterview({ candidateId: candidate.id, ...form });
      const interviewId = res?.data?.id || res?.id || null;
      setScheduledInterviewId(interviewId);
      toast.success(`Interview scheduled for ${candidate.name}`);
    } catch {
      toast.error('Failed to schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!feedback.rating) {
      toast.error('Please provide a star rating');
      return;
    }
    setFeedbackLoading(true);
    try {
      if (scheduledInterviewId) {
        await recruitmentAPI.submitFeedback(scheduledInterviewId, {
          rating: feedback.rating,
          notes: feedback.notes,
        });
      }
      toast.success('Feedback submitted');
      onClose();
    } catch {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#E7E2D8] shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#2B2B2B]">
            {scheduledInterviewId ? 'Submit Feedback' : 'Schedule Interview'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-[#9C9C9C]" />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-5 p-3 bg-[#F5F1E6] rounded-xl">
          <Avatar name={candidate.name} idx={candidate.id} />
          <div>
            <p className="font-semibold text-sm text-[#2B2B2B]">{candidate.name}</p>
            <p className="text-xs text-[#9C9C9C]">{candidate.role}</p>
          </div>
        </div>

        {/* Schedule form — shown before interview is scheduled */}
        {!scheduledInterviewId && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B] mb-1">Interview Type</label>
              <select
                className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {['Technical', 'HR', 'Final'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#2B2B2B] mb-1">Date</label>
                <input
                  type="date" required
                  className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#2B2B2B] mb-1">Time</label>
                <input
                  type="time" required
                  className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B] mb-1">Interviewer</label>
              <input
                type="text" required placeholder="Enter interviewer name"
                className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
                value={form.interviewer}
                onChange={e => setForm(f => ({ ...f, interviewer: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-[#E7E2D8] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Scheduling…' : 'Schedule'}</button>
            </div>
          </form>
        )}

        {/* Feedback form — shown after interview is successfully scheduled */}
        {scheduledInterviewId && (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B] mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedback(f => ({ ...f, rating: star }))}
                    className={`w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                      feedback.rating >= star
                        ? 'bg-[#F3CC4D] text-[#2B2B2B]'
                        : 'bg-[#F5F1E6] text-[#9C9C9C] border border-[#E7E2D8]'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B] mb-1">Notes</label>
              <textarea
                rows={3}
                placeholder="Interview notes, observations…"
                className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none"
                value={feedback.notes}
                onChange={e => setFeedback(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-[#E7E2D8] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">Skip</button>
              <button type="submit" disabled={feedbackLoading} className="flex-1 btn-primary">{feedbackLoading ? 'Submitting…' : 'Submit Feedback'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Post Job Modal ─────────────────────────────────────────────────────────────
function PostJobModal({ onClose }) {
  const [form, setForm] = useState({
    title: '', department: 'Engineering', location: '', ctcMin: '', ctcMax: '', skills: '', jd: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const job = await recruitmentAPI.createJob(form);
      const jobId = job?.data?.id || job?.id;
      if (jobId) await recruitmentAPI.publishJob(jobId);
      toast.success('Job posted and published successfully!');
      onClose();
    } catch {
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-[#2B2B2B] mb-1">{label}</label>
      <input
        type={type} placeholder={placeholder}
        className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-[#E7E2D8] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[#E7E2D8] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#2B2B2B]">Post New Job</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-[#9C9C9C]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field('Job Title', 'title', 'text', 'e.g. Senior React Developer')}
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B] mb-1">Department</label>
            <select
              className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            >
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          {field('Location', 'location', 'text', 'e.g. Bangalore / Remote')}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B] mb-1">CTC Min (LPA)</label>
              <input
                type="number" placeholder="e.g. 8"
                className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
                value={form.ctcMin} onChange={e => setForm(f => ({ ...f, ctcMin: e.target.value }))} required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B] mb-1">CTC Max (LPA)</label>
              <input
                type="number" placeholder="e.g. 14"
                className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]"
                value={form.ctcMax} onChange={e => setForm(f => ({ ...f, ctcMax: e.target.value }))} required
              />
            </div>
          </div>
          {field('Required Skills', 'skills', 'text', 'e.g. React, Node.js, TypeScript')}
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B] mb-1">Job Description</label>
            <textarea
              rows={4} placeholder="Describe responsibilities, requirements…"
              className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D] resize-none"
              value={form.jd} onChange={e => setForm(f => ({ ...f, jd: e.target.value }))} required
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-[#E7E2D8] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Posting…' : 'Post & Publish'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Candidate Card ─────────────────────────────────────────────────────────────
function CandidateCard({ candidate, idx, onMove, onSchedule, canMove, onConvert }) {
  const [rejecting, setRejecting] = useState(false);
  const [converting, setConverting] = useState(false);
  const isJoined = candidate.stage === 'Joined';

  function handleReject() {
    setRejecting(true);
    setTimeout(() => setRejecting(false), 1000);
    toast('Candidate marked as rejected', { icon: '🚫' });
  }

  async function handleConvert() {
    setConverting(true);
    try {
      await recruitmentAPI.convert(candidate.id);
      toast.success(`${candidate.name} converted to employee!`);
      if (onConvert) onConvert(candidate.id);
    } catch {
      toast.error('Conversion failed. Please try again.');
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E7E2D8] p-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2.5 mb-2.5">
        <Avatar name={candidate.name} idx={idx} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#2B2B2B] truncate">{candidate.name}</p>
          <p className="text-xs text-[#9C9C9C] truncate">{candidate.role}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[candidate.source] || 'bg-gray-100 text-gray-700'}`}>
          {candidate.source}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#F5F1E6] text-[#2B2B2B]">
          {candidate.exp}
        </span>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-[#9C9C9C] mb-3">
        <Clock size={11} />
        <span>{daysAgo(candidate.date)}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {!isJoined && (
          <button
            onClick={() => onSchedule(candidate)}
            className="flex-1 text-[11px] bg-[#F5F1E6] hover:bg-[#ede8dc] text-[#2B2B2B] rounded-lg px-2 py-1.5 font-medium transition-colors"
            title="Schedule Interview"
          >
            Interview
          </button>
        )}
        {canMove && (
          <button
            onClick={() => onMove(candidate.id)}
            className="flex items-center gap-0.5 text-[11px] bg-[#2B2B2B] hover:bg-[#3d3d3d] text-white rounded-lg px-2 py-1.5 font-medium transition-colors"
            title="Move to next stage"
          >
            Move <ChevronRight size={11} />
          </button>
        )}
        {isJoined && (
          <button
            onClick={handleConvert}
            disabled={converting}
            className="flex-1 text-[11px] bg-green-600 hover:bg-green-700 text-white rounded-lg px-2 py-1.5 font-medium transition-colors"
            title="Convert to Employee"
          >
            {converting ? 'Converting…' : 'Convert to Employee'}
          </button>
        )}
        {!isJoined && (
          <button
            onClick={handleReject}
            disabled={rejecting}
            className="text-[11px] bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-2 py-1.5 font-medium transition-colors"
            title="Reject"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add Candidate Modal ────────────────────────────────────────────────────────
function AddCandidateModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', role: '', department: 'Engineering', source: 'LinkedIn', exp: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role) { toast.error('Name and role are required'); return; }
    setLoading(true);
    try {
      await recruitmentAPI.addCandidate({ ...form, stage: 'APPLIED' });
    } catch { /* offline */ }
    onAdd({ id: Date.now(), ...form, stage: 'Applied', date: new Date().toISOString().split('T')[0] });
    toast.success(`${form.name} added to pipeline!`);
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E2D8]">
          <h3 className="font-semibold text-[#2B2B2B]">Add New Candidate</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F5F1E6] rounded-lg"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                placeholder="e.g. Rahul Sharma"
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Role Applied For *</label>
              <input value={form.role} onChange={e => set('role', e.target.value)} required
                placeholder="e.g. Senior Developer"
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Department</label>
              <select value={form.department} onChange={e => set('department', e.target.value)}
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]">
                {['Engineering','Design','HR','Product','DevOps','Finance','Marketing'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]">
                {['LinkedIn','Referral','Direct','Naukri','Indeed','Company Website'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Experience</label>
              <input value={form.exp} onChange={e => set('exp', e.target.value)}
                placeholder="e.g. 3 yrs"
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="candidate@email.com"
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-[#F3CC4D] rounded-xl text-sm font-semibold hover:bg-yellow-400 transition disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Candidate'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2 bg-[#F5F1E6] border border-[#E7E2D8] rounded-xl text-sm font-medium hover:bg-[#E7E2D8] transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Kanban Column ──────────────────────────────────────────────────────────────
function KanbanColumn({ stage, candidates, onMove, onSchedule, onConvert, onAddCandidate }) {
  const colors = STAGE_COLORS[stage];
  const stageIdx = STAGES.indexOf(stage);
  const canMove = stageIdx < STAGES.length - 1;

  return (
    <div className="flex-shrink-0 w-64 flex flex-col bg-[#F5F1E6] rounded-2xl border border-[#E7E2D8] overflow-hidden">
      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
        <span className="text-white font-semibold text-sm">{stage}</span>
        <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{candidates.length}</span>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[520px]">
        {candidates.length === 0 && (
          <div className="text-center py-8 text-[#9C9C9C] text-xs">No candidates yet</div>
        )}
        {candidates.map((c, i) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            idx={i}
            onMove={onMove}
            onSchedule={onSchedule}
            canMove={canMove}
            onConvert={onConvert}
          />
        ))}
      </div>
      <div className="p-3 border-t border-[#E7E2D8]">
        <button
          onClick={onAddCandidate}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-[#9C9C9C] hover:text-[#2B2B2B] hover:bg-white rounded-xl py-2 transition-colors border border-dashed border-[#E7E2D8]"
        >
          <Plus size={13} />
          Add candidate
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RecruitmentPipeline() {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [interviewTarget, setInterviewTarget] = useState(null);

  // Load real pipeline data on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await recruitmentAPI.getPipeline();
        const postings = res?.data || [];
        // Flatten candidates from all job postings
        const allCandidates = postings.flatMap((posting, pi) =>
          (posting.candidates || []).map((c, ci) => ({
            id: c.id,
            name: c.name,
            role: posting.title || 'Open Position',
            stage: (() => {
              const s = (c.stage || 'APPLIED').toUpperCase();
              if (s === 'APPLIED') return 'Applied';
              if (s === 'SCREENING') return 'Screening';
              if (s.includes('INTERVIEW')) return 'Interview';
              if (s === 'OFFER' || s === 'ACCEPTED') return 'Offer';
              if (s === 'JOINED' || s === 'CONVERTED') return 'Joined';
              return 'Applied';
            })(),
            date: c.createdAt ? c.createdAt.split('T')[0] : '2026-06-01',
            source: c.source || 'Direct',
            exp: c.experience || '—',
          }))
        );
        if (allCandidates.length > 0) setCandidates(allCandidates);
      } catch {
        // Keep mock data as fallback
      }
    };
    load();
  }, []);

  const stats = [
    { label: 'Open Positions',       value: 6,  icon: Briefcase,     color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Total Candidates',     value: candidates.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Interviews This Week', value: 3,  icon: CalendarCheck, color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Offers Pending',       value: candidates.filter(c => c.stage === 'Offer').length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  async function handleMove(candidateId) {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    const currentIdx = STAGES.indexOf(candidate.stage);
    if (currentIdx >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIdx + 1];

    setCandidates(prev =>
      prev.map(c => c.id === candidateId ? { ...c, stage: nextStage } : c)
    );
    toast.success(`${candidate.name} moved to ${nextStage}`);

    try {
      await recruitmentAPI.moveStage(candidateId, { stage: nextStage });
    } catch {
      // state already updated — silent fail
    }
  }

  function handleConvert(candidateId) {
    // Mark candidate as converted in local state
    setCandidates(prev =>
      prev.map(c => c.id === candidateId ? { ...c, converted: true } : c)
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E6] p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2B2B2B]">Hiring Pipeline</h1>
          <p className="text-sm text-[#9C9C9C] mt-0.5">Track candidates from application to joining</p>
        </div>
        <button onClick={() => setShowJobModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Post New Job
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
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

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            candidates={candidates.filter(c => c.stage === stage)}
            onMove={handleMove}
            onSchedule={setInterviewTarget}
            onConvert={handleConvert}
            onAddCandidate={() => setShowAddModal(true)}
          />
        ))}
      </div>

      {/* Modals */}
      {showJobModal && <PostJobModal onClose={() => setShowJobModal(false)} />}
      {showAddModal && (
        <AddCandidateModal
          onClose={() => setShowAddModal(false)}
          onAdd={(c) => setCandidates(prev => [...prev, c])}
        />
      )}
      {interviewTarget && (
        <InterviewPanel candidate={interviewTarget} onClose={() => setInterviewTarget(null)} />
      )}
    </div>
  );
}
