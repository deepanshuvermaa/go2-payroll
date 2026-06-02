import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, ClipboardList, Award, BarChart3, Target,
  Calendar, Users, TrendingUp, Edit2, Trash2, X,
  CheckCircle2, GraduationCap, FileText, Copy, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import useDebounce from '../../hooks/useDebounce';

// ——— DESIGN TOKENS ———
const C = {
  ink: '#0d0d0d', ink2: '#3a3a3a', ink3: '#767676', ink4: '#b0b0b0',
  paper: '#f8f6f1', paper2: '#eeebe3', paper3: '#e3dfd4', white: '#ffffff',
  accent: '#2563EB', accentLight: '#dbeafe', accentHover: '#1d4ed8',
  gold: '#c9933a', goldLight: '#fef3c7',
  green: '#1a6b4a', greenLight: '#d1fae5',
  red: '#c0392b', redLight: '#fee2e2',
  amber: '#d97706', amberLight: '#fef3c7',
  purple: '#6d28d9', purpleLight: '#ede9fe',
};

const CAT_STYLE = {
  Engineering: { bg: '#dbeafe', fg: '#2563EB', emoji: '🔧' },
  Leadership: { bg: '#ede9fe', fg: '#6d28d9', emoji: '👥' },
  Customer: { bg: '#d1fae5', fg: '#1a6b4a', emoji: '🤝' },
  Process: { bg: '#fef3c7', fg: '#d97706', emoji: '⚙️' },
  Strategy: { bg: '#e0e7ff', fg: '#4338ca', emoji: '🎯' },
  Learning: { bg: '#fce7f3', fg: '#be185d', emoji: '📚' },
  Operations: { bg: '#ffedd5', fg: '#c2410c', emoji: '🏗️' },
  Sales: { bg: '#d1fae5', fg: '#047857', emoji: '💰' },
};

const TABS = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'log', label: 'Work Log', emoji: '📝' },
  { id: 'praise', label: 'Praise Vault', emoji: '🏆' },
  { id: 'goals', label: 'Goals', emoji: '🎯' },
  { id: 'skills', label: 'Skills', emoji: '🎓' },
  { id: 'review', label: 'Review Prep', emoji: '📊' },
];

const PRAISE_TAGS = [
  { value: 'leadership', label: 'Leadership', bg: '#ede9fe', fg: '#6d28d9' },
  { value: 'peer', label: 'Peer', bg: '#dbeafe', fg: '#2563EB' },
  { value: 'cross-team', label: 'Cross-team', bg: '#d1fae5', fg: '#1a6b4a' },
  { value: 'client', label: 'Client', bg: '#fef3c7', fg: '#d97706' },
  { value: 'manager', label: 'Manager', bg: '#fee2e2', fg: '#c0392b' },
];

// ——— MAIN COMPONENT ———
const WorkLogManagement = () => {
  const [tab, setTab] = useState('home');
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [entries, setEntries] = useState([]);
  const [praise, setPraise] = useState([]);
  const [goals, setGoals] = useState([]);
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Modals
  const [modal, setModal] = useState(null); // 'entry' | 'praise' | 'goal' | 'skill' | null
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Forms
  const emptyEntry = { title: '', description: '', category: 'Engineering', contributionRole: 'Led', impact: '', impactType: '', stakeholders: '', date: new Date().toISOString().split('T')[0] };
  const emptyPraise = { staffId: '', givenByName: '', givenByRole: '', text: '', source: 'direct', tag: 'peer', date: new Date().toISOString().split('T')[0] };
  const emptyGoal = { title: '', description: '', targetDate: '', keyResults: [''], priority: 'medium' };
  const emptySkill = { name: '', level: 'intermediate', source: '', certDate: '', linkedProjects: '' };

  const [entryForm, setEntryForm] = useState(emptyEntry);
  const [praiseForm, setPraiseForm] = useState(emptyPraise);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [skillForm, setSkillForm] = useState(emptySkill);

  const debouncedSearch = useDebounce(search, 300);

  // Init
  useEffect(() => {
    const all = payrollDataStore.getStaff().filter(s => s.status !== 'inactive');
    setStaff(all);
    setSettings(payrollDataStore.getWorkLogSettings());
    if (all.length > 0) setStaffId(all[0].id);
  }, []);

  // Refresh on changes
  useEffect(() => {
    if (!staffId) return;
    const filters = {};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (catFilter) filters.category = catFilter;
    if (dateFilter !== 'all') {
      const now = new Date();
      const starts = { week: 7, month: 30, quarter: 90, year: 365 };
      const d = new Date(now); d.setDate(now.getDate() - (starts[dateFilter] || 0));
      filters.startDate = d.toISOString().split('T')[0];
    }
    setEntries(payrollDataStore.getWorkLogEntries(staffId, filters));
    setPraise(payrollDataStore.getPraise(staffId));
    setGoals(payrollDataStore.getGoals(staffId));
    setSkills(payrollDataStore.getSkills(staffId));
    setStats(payrollDataStore.getWorkLogStats(staffId));
  }, [staffId, debouncedSearch, catFilter, dateFilter]);

  const refresh = () => {
    setEntries(payrollDataStore.getWorkLogEntries(staffId));
    setPraise(payrollDataStore.getPraise(staffId));
    setGoals(payrollDataStore.getGoals(staffId));
    setSkills(payrollDataStore.getSkills(staffId));
    setStats(payrollDataStore.getWorkLogStats(staffId));
  };

  // Handlers
  const saveEntry = () => {
    if (!entryForm.title.trim()) return toast.error('What did you work on?');
    if (editing) { payrollDataStore.updateWorkLogEntry(editing.id, entryForm); toast.success('Entry updated!'); }
    else { payrollDataStore.addWorkLogEntry({ ...entryForm, staffId }); toast.success('Win logged! 🎉'); }
    setEntryForm(emptyEntry); setEditing(null); setModal(null); refresh();
  };

  const savePraise = () => {
    if (!praiseForm.text.trim()) return toast.error('Paste the praise text');
    payrollDataStore.addPraise({ ...praiseForm, staffId: praiseForm.staffId || staffId });
    toast.success('Praise captured! 🏆'); setPraiseForm(emptyPraise); setModal(null); refresh();
  };

  const saveGoal = () => {
    if (!goalForm.title.trim()) return toast.error('Goal title needed');
    const kr = goalForm.keyResults.filter(k => k.trim());
    if (editing) { payrollDataStore.updateGoal(editing.id, { ...goalForm, keyResults: kr }); toast.success('Goal updated'); }
    else { payrollDataStore.addGoal({ ...goalForm, keyResults: kr, staffId }); toast.success('Goal created! 🎯'); }
    setGoalForm(emptyGoal); setEditing(null); setModal(null); refresh();
  };

  const saveSkill = () => {
    if (!skillForm.name.trim()) return toast.error('Skill name needed');
    payrollDataStore.addSkill({ ...skillForm, staffId });
    toast.success('Skill added! 🎓'); setSkillForm(emptySkill); setModal(null); refresh();
  };

  const doDelete = () => {
    if (!deleting) return;
    const fn = { entry: 'deleteWorkLogEntry', praise: 'deletePraise', goal: 'deleteGoal', skill: 'deleteSkill' };
    payrollDataStore[fn[deleting.type]](deleting.id);
    toast.success('Deleted'); setDeleting(null); refresh();
  };

  const reviewSummary = useMemo(() => staffId ? payrollDataStore.generateReviewSummary(staffId) : null, [staffId, entries.length, praise.length]);
  const selectedStaff = staff.find(s => s.id === staffId);

  const copyReview = () => {
    if (!reviewSummary) return;
    const text = [
      `Performance Review — ${reviewSummary.staff?.name}`,
      reviewSummary.cycle ? `Period: ${reviewSummary.cycle.name}` : 'Period: All Time',
      '', `Entries: ${reviewSummary.totalEntries} | Praise: ${reviewSummary.totalPraise} | Led: ${reviewSummary.ledEntries}`,
      '', 'Top Contributions:',
      ...(reviewSummary.topContributions || []).map((c, i) => `${i + 1}. ${c.title}${c.impact ? ' — ' + c.impact : ''}`),
      '', 'Praise:', ...(reviewSummary.praise || []).slice(0, 3).map(p => `  "${p.text}" — ${p.givenByName}`),
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => toast.success('Copied! 📋'));
  };

  // ——— RENDER ———
  return (
    <div className="slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: C.ink }}>
            Work<span style={{ color: C.accent }}>Log</span>
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: C.ink3 }}>Track wins, praise, goals & skills — your review-ready record</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
            className="text-[13px] px-3 py-2 rounded-lg outline-none"
            style={{ border: `1px solid ${C.paper3}`, background: C.white, color: C.ink }}>
            <option value="">Select staff</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name} — {s.designation || 'Staff'}</option>)}
          </select>
          <button onClick={() => { setEntryForm(emptyEntry); setEditing(null); setModal('entry'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all hover:shadow-lg"
            style={{ background: C.accent }}>
            <Plus size={15} /> Log a win
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl mb-5" style={{ background: C.paper2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap"
            style={{
              background: tab === t.id ? C.white : 'transparent',
              color: tab === t.id ? C.accent : C.ink3,
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
            }}>
            <span className="text-[14px]">{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* No staff selected */}
      {!staffId ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
          <div className="text-5xl mb-4">👋</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: C.ink }}>Pick a team member</h3>
          <p className="text-[13px]" style={{ color: C.ink3 }}>Select someone from the dropdown above to view or manage their work log.</p>
        </div>
      ) : (
        <div className="fade-in">
          {tab === 'home' && <HomeTab stats={stats} entries={entries} goals={goals} staff={selectedStaff} onLog={() => { setEntryForm(emptyEntry); setEditing(null); setModal('entry'); }} onTab={setTab} />}
          {tab === 'log' && <LogTab entries={entries} settings={settings} search={search} setSearch={setSearch} catFilter={catFilter} setCatFilter={setCatFilter} dateFilter={dateFilter} setDateFilter={setDateFilter}
            onAdd={() => { setEntryForm(emptyEntry); setEditing(null); setModal('entry'); }}
            onEdit={(e) => { setEntryForm({ title: e.title, description: e.description || '', category: e.category, contributionRole: e.contributionRole, impact: e.impact || '', impactType: e.impactType || '', stakeholders: e.stakeholders || '', date: e.date }); setEditing(e); setModal('entry'); }}
            onDelete={(id) => setDeleting({ type: 'entry', id })} />}
          {tab === 'praise' && <PraiseTab praise={praise} onAdd={() => { setPraiseForm({ ...emptyPraise, staffId }); setModal('praise'); }} onDelete={(id) => setDeleting({ type: 'praise', id })} />}
          {tab === 'goals' && <GoalsTab goals={goals}
            onAdd={() => { setGoalForm(emptyGoal); setEditing(null); setModal('goal'); }}
            onEdit={(g) => { setGoalForm({ title: g.title, description: g.description || '', targetDate: g.targetDate || '', keyResults: g.keyResults?.length ? g.keyResults : [''], priority: g.priority || 'medium' }); setEditing(g); setModal('goal'); }}
            onDelete={(id) => setDeleting({ type: 'goal', id })}
            onStatus={(id, s) => { payrollDataStore.updateGoal(id, { status: s }); toast.success(`Marked ${s}`); refresh(); }}
            onProgress={(id, p) => { payrollDataStore.updateGoal(id, { progress: parseInt(p) }); refresh(); }} />}
          {tab === 'skills' && <SkillsTab skills={skills} onAdd={() => { setSkillForm(emptySkill); setModal('skill'); }} onDelete={(id) => setDeleting({ type: 'skill', id })} />}
          {tab === 'review' && <ReviewTab summary={reviewSummary} onCopy={copyReview} />}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {modal === 'entry' && (
        <Overlay onClose={() => setModal(null)}>
          <div className="text-lg font-bold mb-1" style={{ color: C.ink }}>{editing ? 'Edit entry' : 'Log a win ✍️'}</div>
          <p className="text-[13px] mb-5" style={{ color: C.ink3 }}>Takes 60 seconds. You'll thank yourself at review time.</p>
          <Field label="What did you work on? *">
            <input value={entryForm.title} onChange={e => setEntryForm({ ...entryForm, title: e.target.value })}
              className="inp" placeholder="e.g. Launched new feature, resolved critical bug..." />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-1.5">
              {(settings?.categories || Object.keys(CAT_STYLE)).map(c => {
                const s = CAT_STYLE[c] || { bg: C.paper2, fg: C.ink3, emoji: '📌' };
                const sel = entryForm.category === c;
                return <button key={c} onClick={() => setEntryForm({ ...entryForm, category: c })}
                  className="px-3 py-1 rounded-full text-[12px] font-medium transition-all"
                  style={{ background: sel ? s.bg : C.paper, color: sel ? s.fg : C.ink4, border: sel ? `1.5px solid ${s.fg}` : `1.5px solid ${C.paper3}` }}>
                  {s.emoji} {c}
                </button>;
              })}
            </div>
          </Field>
          <Field label="Your contribution">
            <textarea value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })}
              className="inp" rows={2} placeholder="What did YOU do? Led, built, coordinated, fixed..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your role">
              <select value={entryForm.contributionRole} onChange={e => setEntryForm({ ...entryForm, contributionRole: e.target.value })} className="inp">
                {['Led', 'Contributed', 'Supported', 'Reviewed'].map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={entryForm.date} onChange={e => setEntryForm({ ...entryForm, date: e.target.value })} className="inp" />
            </Field>
          </div>
          <Field label="Impact (optional but powerful)">
            <input value={entryForm.impact} onChange={e => setEntryForm({ ...entryForm, impact: e.target.value })}
              className="inp" placeholder="e.g. Saved 3 hrs/week, revenue up 15%, errors down 40%" />
          </Field>
          <Field label="Stakeholders">
            <input value={entryForm.stakeholders} onChange={e => setEntryForm({ ...entryForm, stakeholders: e.target.value })}
              className="inp" placeholder="e.g. Design team, PM Sarah, external client" />
          </Field>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.paper3}` }}>Cancel</button>
            <button onClick={saveEntry} className="flex-[2] py-2.5 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>{editing ? 'Update' : 'Save entry ✓'}</button>
          </div>
        </Overlay>
      )}

      {modal === 'praise' && (
        <Overlay onClose={() => setModal(null)}>
          <div className="text-lg font-bold mb-1" style={{ color: C.ink }}>Capture praise 🏆</div>
          <p className="text-[13px] mb-5" style={{ color: C.ink3 }}>Every piece of recognition is evidence of impact.</p>
          <Field label="For staff member">
            <select value={praiseForm.staffId || staffId} onChange={e => setPraiseForm({ ...praiseForm, staffId: e.target.value })} className="inp">
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Given by"><input value={praiseForm.givenByName} onChange={e => setPraiseForm({ ...praiseForm, givenByName: e.target.value })} className="inp" placeholder="Rahul Kumar" /></Field>
            <Field label="Role / Title"><input value={praiseForm.givenByRole} onChange={e => setPraiseForm({ ...praiseForm, givenByRole: e.target.value })} className="inp" placeholder="VP Product" /></Field>
          </div>
          <Field label="What was said? *">
            <textarea value={praiseForm.text} onChange={e => setPraiseForm({ ...praiseForm, text: e.target.value })} className="inp" rows={3} placeholder="Paste the praise message, feedback, or compliment..." />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Source">
              <select value={praiseForm.source} onChange={e => setPraiseForm({ ...praiseForm, source: e.target.value })} className="inp">
                <option value="direct">Direct</option><option value="email">Email</option><option value="slack">Slack</option><option value="verbal">Verbal</option><option value="review">Review</option>
              </select>
            </Field>
            <Field label="Tag">
              <select value={praiseForm.tag} onChange={e => setPraiseForm({ ...praiseForm, tag: e.target.value })} className="inp">
                {PRAISE_TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Date"><input type="date" value={praiseForm.date} onChange={e => setPraiseForm({ ...praiseForm, date: e.target.value })} className="inp" /></Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.paper3}` }}>Cancel</button>
            <button onClick={savePraise} className="flex-[2] py-2.5 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>Save praise ✓</button>
          </div>
        </Overlay>
      )}

      {modal === 'goal' && (
        <Overlay onClose={() => setModal(null)}>
          <div className="text-lg font-bold mb-1" style={{ color: C.ink }}>{editing ? 'Edit goal' : 'New goal 🎯'}</div>
          <p className="text-[13px] mb-5" style={{ color: C.ink3 }}>Set measurable goals with key results to track progress.</p>
          <Field label="Goal *"><input value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} className="inp" placeholder="e.g. Improve onboarding conversion to 80%" /></Field>
          <Field label="Description"><textarea value={goalForm.description} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} className="inp" rows={2} placeholder="What does success look like?" /></Field>
          <Field label="Key Results">
            {goalForm.keyResults.map((kr, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <input value={kr} onChange={e => { const krs = [...goalForm.keyResults]; krs[i] = e.target.value; setGoalForm({ ...goalForm, keyResults: krs }); }} className="inp flex-1" placeholder={`Key result ${i + 1}`} />
                {goalForm.keyResults.length > 1 && <button onClick={() => setGoalForm({ ...goalForm, keyResults: goalForm.keyResults.filter((_, j) => j !== i) })} className="px-2" style={{ color: C.ink4 }}><X size={14} /></button>}
              </div>
            ))}
            <button onClick={() => setGoalForm({ ...goalForm, keyResults: [...goalForm.keyResults, ''] })} className="text-[12px] font-medium" style={{ color: C.accent }}>+ Add key result</button>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date"><input type="date" value={goalForm.targetDate} onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })} className="inp" /></Field>
            <Field label="Priority">
              <select value={goalForm.priority} onChange={e => setGoalForm({ ...goalForm, priority: e.target.value })} className="inp">
                <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.paper3}` }}>Cancel</button>
            <button onClick={saveGoal} className="flex-[2] py-2.5 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>{editing ? 'Update' : 'Create goal ✓'}</button>
          </div>
        </Overlay>
      )}

      {modal === 'skill' && (
        <Overlay onClose={() => setModal(null)}>
          <div className="text-lg font-bold mb-1" style={{ color: C.ink }}>Add skill 🎓</div>
          <p className="text-[13px] mb-5" style={{ color: C.ink3 }}>Track certifications and skills linked to real work.</p>
          <Field label="Skill / Certification *"><input value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} className="inp" placeholder="e.g. AWS Solutions Architect, React" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <select value={skillForm.level} onChange={e => setSkillForm({ ...skillForm, level: e.target.value })} className="inp">
                <option value="beginner">🌱 Beginner</option><option value="intermediate">📈 Intermediate</option><option value="advanced">⭐ Advanced</option><option value="expert">🏅 Expert</option>
              </select>
            </Field>
            <Field label="Cert date"><input type="date" value={skillForm.certDate} onChange={e => setSkillForm({ ...skillForm, certDate: e.target.value })} className="inp" /></Field>
          </div>
          <Field label="Provider"><input value={skillForm.source} onChange={e => setSkillForm({ ...skillForm, source: e.target.value })} className="inp" placeholder="Coursera, AWS, Internal" /></Field>
          <Field label="Linked projects"><input value={skillForm.linkedProjects} onChange={e => setSkillForm({ ...skillForm, linkedProjects: e.target.value })} className="inp" placeholder="API Migration, Portal redesign" /></Field>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.paper3}` }}>Cancel</button>
            <button onClick={saveSkill} className="flex-[2] py-2.5 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>Add skill ✓</button>
          </div>
        </Overlay>
      )}

      {deleting && (
        <Overlay onClose={() => setDeleting(null)}>
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🗑️</div>
            <div className="text-lg font-bold mb-1" style={{ color: C.ink }}>Delete this {deleting.type}?</div>
            <p className="text-[13px] mb-5" style={{ color: C.ink3 }}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.paper3}` }}>Keep it</button>
              <button onClick={doDelete} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white" style={{ background: C.red }}>Delete</button>
            </div>
          </div>
        </Overlay>
      )}

      <style>{`.inp{width:100%;padding:9px 12px;border:1px solid ${C.paper3};border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;background:${C.white};color:${C.ink};outline:none;transition:border .15s}.inp:focus{border-color:${C.accent};box-shadow:0 0 0 3px rgba(37,99,235,.1)}`}</style>
    </div>
  );
};

// ——— SHARED COMPONENTS ———
const Overlay = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,.35)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto slide-up" style={{ background: C.white, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="mb-3">
    <label className="block text-[12px] font-medium mb-1" style={{ color: C.ink2 }}>{label}</label>
    {children}
  </div>
);

const Stat = ({ emoji, value, label, delta }) => (
  <div className="rounded-xl p-4" style={{ background: C.white, border: `1px solid ${C.paper2}`, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
    <div className="text-[18px] mb-1">{emoji}</div>
    <div className="text-[22px] font-bold" style={{ color: C.ink }}>{value}</div>
    <div className="text-[11px]" style={{ color: C.ink3 }}>{label}</div>
    {delta && <div className="text-[11px] font-medium mt-1" style={{ color: C.green }}>{delta}</div>}
  </div>
);

const EntryCard = ({ entry, onEdit, onDelete }) => {
  const cs = CAT_STYLE[entry.category] || { bg: C.paper2, fg: C.ink3, emoji: '📌' };
  return (
    <div className="rounded-xl p-4 group transition-all hover:shadow-md cursor-default" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: cs.bg, color: cs.fg }}>
          {cs.emoji} {entry.category}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[14px] font-medium" style={{ color: C.ink }}>{entry.title}</h4>
            <span className="text-[11px] flex-shrink-0" style={{ color: C.ink4 }}>{fmtDate(entry.date)}</span>
          </div>
          {entry.description && <p className="text-[12px] mt-1 leading-relaxed" style={{ color: C.ink3 }}>{entry.description}</p>}
          {entry.impact && (
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium" style={{ color: C.green }}>
              <TrendingUp size={12} /> {entry.impact}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {entry.contributionRole && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: C.paper, border: `1px solid ${C.paper3}`, color: C.ink3 }}>{entry.contributionRole}</span>}
            {entry.stakeholders && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.paper, border: `1px solid ${C.paper3}`, color: C.ink3 }}>👥 {entry.stakeholders}</span>}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && <button onClick={() => onEdit(entry)} className="p-1 rounded hover:bg-[#dbeafe]"><Edit2 size={13} color={C.accent} /></button>}
            {onDelete && <button onClick={() => onDelete(entry.id)} className="p-1 rounded hover:bg-[#fee2e2]"><Trash2 size={13} color={C.red} /></button>}
          </div>
        )}
      </div>
    </div>
  );
};

// ——— TAB VIEWS ———
const HomeTab = ({ stats, entries, goals, staff, onLog, onTab }) => {
  if (!stats) return null;
  const recent = entries.slice(0, 4);
  const activeGoals = goals.filter(g => g.status === 'active');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat emoji="📝" value={stats.totalEntries} label="Total entries" delta={stats.thisMonth > 0 ? `+${stats.thisMonth} this month` : null} />
        <Stat emoji="🏆" value={stats.totalPraise} label="Praise received" />
        <Stat emoji="🎯" value={stats.activeGoals} label="Active goals" />
        <Stat emoji="🎓" value={stats.totalSkills} label="Skills logged" />
      </div>

      {/* Nudge */}
      {stats.thisWeek < 3 && (
        <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #eff6ff, #ede9fe)', border: '1px solid #c7d2fe' }}>
          <div className="text-3xl">{stats.thisWeek === 0 ? '📅' : '💪'}</div>
          <div className="flex-1">
            <div className="text-[14px] font-medium" style={{ color: C.ink }}>{stats.thisWeek === 0 ? "No entries this week yet!" : `${stats.thisWeek} entr${stats.thisWeek === 1 ? 'y' : 'ies'} this week`}</div>
            <div className="text-[12px] mt-0.5" style={{ color: C.ink3 }}>Log your wins before you forget — small entries add up to a powerful review.</div>
          </div>
          <button onClick={onLog} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white flex-shrink-0" style={{ background: C.accent }}>+ Quick log</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] font-semibold" style={{ color: C.ink }}>Recent entries</span>
            <button onClick={() => onTab('log')} className="text-[12px] font-medium" style={{ color: C.accent }}>View all →</button>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
              <div className="text-4xl mb-3">📝</div>
              <p className="text-[13px]" style={{ color: C.ink3 }}>No entries yet. Start logging to build your record.</p>
              <button onClick={onLog} className="mt-3 px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>Log your first win</button>
            </div>
          ) : recent.map(e => <EntryCard key={e.id} entry={e} />)}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
            <h4 className="text-[13px] font-semibold mb-3" style={{ color: C.ink }}>🎯 Active Goals</h4>
            {activeGoals.length === 0 ? <p className="text-[12px]" style={{ color: C.ink4 }}>No active goals</p> : activeGoals.slice(0, 3).map(g => (
              <div key={g.id} className="flex items-center gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate" style={{ color: C.ink2 }}>{g.title}</div>
                  <div className="h-1.5 rounded-full mt-1" style={{ background: C.paper2 }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${g.progress || 0}%`, background: C.accent }} />
                  </div>
                </div>
                <span className="text-[11px] font-medium" style={{ color: C.ink3 }}>{g.progress || 0}%</span>
              </div>
            ))}
          </div>
          {Object.keys(stats.categoryBreakdown).length > 0 && (
            <div className="rounded-xl p-4" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
              <h4 className="text-[13px] font-semibold mb-3" style={{ color: C.ink }}>📊 By category</h4>
              {Object.entries(stats.categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const cs = CAT_STYLE[cat] || {};
                return <div key={cat} className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: cs.bg || C.paper2, color: cs.fg || C.ink3 }}>{cs.emoji || '📌'} {cat}</span>
                  <span className="text-[12px] font-medium" style={{ color: C.ink2 }}>{count}</span>
                </div>;
              })}
            </div>
          )}
          <div className="rounded-xl p-4" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
            <h4 className="text-[13px] font-semibold mb-3" style={{ color: C.ink }}>📈 Monthly trend</h4>
            {stats.monthlyTrend && Object.entries(stats.monthlyTrend).map(([m, c]) => {
              const mx = Math.max(...Object.values(stats.monthlyTrend), 1);
              return <div key={m} className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] w-10" style={{ color: C.ink4 }}>{m.split('-')[1]}/{m.split('-')[0].slice(2)}</span>
                <div className="flex-1 rounded-full h-1.5" style={{ background: C.paper2 }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${(c / mx) * 100}%`, background: C.accent }} />
                </div>
                <span className="text-[11px] font-medium w-4 text-right" style={{ color: C.ink3 }}>{c}</span>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogTab = ({ entries, settings, search, setSearch, catFilter, setCatFilter, dateFilter, setDateFilter, onAdd, onEdit, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <div>
        <span className="text-[16px] font-bold" style={{ color: C.ink }}>Work Log</span>
        <span className="text-[12px] ml-2" style={{ color: C.ink4 }}>{entries.length} entries</span>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}><Plus size={14} /> Add entry</button>
    </div>
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.ink4 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..."
          className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: `1px solid ${C.paper3}`, background: C.white }} />
      </div>
      <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="rounded-lg px-3 py-2 text-[13px] outline-none" style={{ border: `1px solid ${C.paper3}`, background: C.white }}>
        <option value="">All categories</option>
        {(settings?.categories || []).map(c => <option key={c}>{c}</option>)}
      </select>
      <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg px-3 py-2 text-[13px] outline-none" style={{ border: `1px solid ${C.paper3}`, background: C.white }}>
        <option value="all">All time</option><option value="week">This week</option><option value="month">This month</option><option value="quarter">This quarter</option><option value="year">This year</option>
      </select>
    </div>
    {entries.length === 0 ? (
      <div className="rounded-xl p-14 text-center" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
        <div className="text-4xl mb-3">🔍</div>
        <h4 className="text-[14px] font-semibold mb-1" style={{ color: C.ink }}>No entries found</h4>
        <p className="text-[13px]" style={{ color: C.ink3 }}>Start logging or adjust your filters.</p>
      </div>
    ) : <div className="space-y-2">{entries.map(e => <EntryCard key={e.id} entry={e} onEdit={onEdit} onDelete={onDelete} />)}</div>}
  </div>
);

const PraiseTab = ({ praise, onAdd, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <div>
        <span className="text-[16px] font-bold" style={{ color: C.ink }}>Praise Vault 🏆</span>
        <span className="text-[12px] ml-2" style={{ color: C.ink4 }}>{praise.length} pieces of recognition</span>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}><Plus size={14} /> Add praise</button>
    </div>
    {praise.length === 0 ? (
      <div className="rounded-xl p-14 text-center" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
        <div className="text-4xl mb-3">🌟</div>
        <h4 className="text-[14px] font-semibold mb-1" style={{ color: C.ink }}>No praise recorded yet</h4>
        <p className="text-[13px] mb-4" style={{ color: C.ink3 }}>Capture praise from Slack, email, or verbal feedback. Every piece counts at review time.</p>
        <button onClick={onAdd} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>Capture first praise</button>
      </div>
    ) : (
      <div className="space-y-2">{praise.map(p => {
        const tag = PRAISE_TAGS.find(t => t.value === p.tag) || PRAISE_TAGS[1];
        const initials = (p.givenByName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);
        return (
          <div key={p.id} className="rounded-xl p-4 flex gap-3 group" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0" style={{ background: C.accent }}>{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium" style={{ color: C.ink }}>{p.givenByName || 'Unknown'}</span>
                {p.givenByRole && <span className="text-[12px]" style={{ color: C.ink3 }}>· {p.givenByRole}</span>}
              </div>
              <p className="text-[13px] italic mt-1 leading-relaxed" style={{ color: C.ink2 }}>"{p.text}"</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px]" style={{ color: C.ink4 }}>{fmtDate(p.date)}</span>
                {p.source && p.source !== 'direct' && <span className="text-[11px]" style={{ color: C.ink4 }}>via {p.source}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: tag.bg, color: tag.fg }}>{tag.label}</span>
              <button onClick={() => onDelete(p.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#fee2e2] transition-opacity"><Trash2 size={13} color={C.red} /></button>
            </div>
          </div>
        );
      })}</div>
    )}
  </div>
);

const GoalsTab = ({ goals, onAdd, onEdit, onDelete, onStatus, onProgress }) => {
  const active = goals.filter(g => g.status === 'active');
  const done = goals.filter(g => g.status === 'completed');
  const other = goals.filter(g => !['active', 'completed'].includes(g.status));

  const GoalCard = ({ g }) => (
    <div className="rounded-xl p-4 group" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[14px] font-medium" style={{ color: C.ink }}>{g.title}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
              background: g.status === 'completed' ? C.greenLight : g.status === 'active' ? C.accentLight : C.paper2,
              color: g.status === 'completed' ? C.green : g.status === 'active' ? C.accent : C.ink3,
            }}>{g.status}</span>
            {g.priority === 'high' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.redLight, color: C.red }}>🔴 High</span>}
          </div>
          {g.description && <p className="text-[12px] mb-2" style={{ color: C.ink3 }}>{g.description}</p>}
          {g.keyResults?.filter(kr => kr).map((kr, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] mb-0.5" style={{ color: C.ink2 }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.accent }} /> {kr}
            </div>
          ))}
          {g.status === 'active' && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 rounded-full h-2" style={{ background: C.paper2 }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${g.progress || 0}%`, background: (g.progress || 0) >= 75 ? C.green : C.accent }} />
              </div>
              <input type="number" min="0" max="100" value={g.progress || 0} onChange={e => onProgress(g.id, e.target.value)}
                className="w-14 text-center rounded-lg py-0.5 text-[12px] outline-none" style={{ border: `1px solid ${C.paper3}` }} />
              <span className="text-[11px]" style={{ color: C.ink4 }}>%</span>
            </div>
          )}
          {g.targetDate && <div className="text-[11px] mt-2 flex items-center gap-1" style={{ color: C.ink4 }}><Calendar size={11} /> Due: {fmtDate(g.targetDate)}</div>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {g.status === 'active' && <button onClick={() => onStatus(g.id, 'completed')} title="Complete" className="p-1 rounded hover:bg-[#d1fae5]"><CheckCircle2 size={14} color={C.green} /></button>}
          <button onClick={() => onEdit(g)} className="p-1 rounded hover:bg-[#dbeafe]"><Edit2 size={13} color={C.accent} /></button>
          <button onClick={() => onDelete(g.id)} className="p-1 rounded hover:bg-[#fee2e2]"><Trash2 size={13} color={C.red} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[16px] font-bold" style={{ color: C.ink }}>Goals & OKRs 🎯</span>
          <span className="text-[12px] ml-2" style={{ color: C.ink4 }}>{active.length} active · {done.length} done</span>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}><Plus size={14} /> New goal</button>
      </div>
      {goals.length === 0 ? (
        <div className="rounded-xl p-14 text-center" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
          <div className="text-4xl mb-3">🎯</div>
          <h4 className="text-[14px] font-semibold mb-1" style={{ color: C.ink }}>No goals yet</h4>
          <p className="text-[13px] mb-4" style={{ color: C.ink3 }}>Set clear goals with key results to prove growth.</p>
          <button onClick={onAdd} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>Create first goal</button>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && <div><div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.ink4 }}>Active ({active.length})</div><div className="space-y-2">{active.map(g => <GoalCard key={g.id} g={g} />)}</div></div>}
          {done.length > 0 && <div><div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.ink4 }}>Completed ({done.length})</div><div className="space-y-2">{done.map(g => <GoalCard key={g.id} g={g} />)}</div></div>}
          {other.length > 0 && <div><div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.ink4 }}>Other ({other.length})</div><div className="space-y-2">{other.map(g => <GoalCard key={g.id} g={g} />)}</div></div>}
        </div>
      )}
    </div>
  );
};

const SkillsTab = ({ skills, onAdd, onDelete }) => {
  const lvl = { beginner: { bg: '#dbeafe', fg: '#2563EB', e: '🌱' }, intermediate: { bg: '#fef3c7', fg: '#d97706', e: '📈' }, advanced: { bg: '#d1fae5', fg: '#1a6b4a', e: '⭐' }, expert: { bg: '#ede9fe', fg: '#6d28d9', e: '🏅' } };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><span className="text-[16px] font-bold" style={{ color: C.ink }}>Skills & Certs 🎓</span><span className="text-[12px] ml-2" style={{ color: C.ink4 }}>{skills.length} tracked</span></div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}><Plus size={14} /> Add skill</button>
      </div>
      {skills.length === 0 ? (
        <div className="rounded-xl p-14 text-center" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
          <div className="text-4xl mb-3">🎓</div>
          <h4 className="text-[14px] font-semibold mb-1" style={{ color: C.ink }}>No skills logged</h4>
          <p className="text-[13px] mb-4" style={{ color: C.ink3 }}>Track courses, certs, and skills to show growth over time.</p>
          <button onClick={onAdd} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}>Add first skill</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skills.map(s => {
            const l = lvl[s.level] || lvl.intermediate;
            return <div key={s.id} className="rounded-xl p-4 group" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[13px] font-medium" style={{ color: C.ink }}>{s.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: l.bg, color: l.fg }}>{l.e} {s.level}</span>
                </div>
                <button onClick={() => onDelete(s.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#fee2e2] transition-opacity"><Trash2 size={13} color={C.red} /></button>
              </div>
              {s.source && <div className="text-[11px] mt-2" style={{ color: C.ink3 }}>Provider: {s.source}</div>}
              {s.certDate && <div className="text-[11px] mt-0.5" style={{ color: C.ink4 }}>Certified: {fmtDate(s.certDate)}</div>}
              {s.linkedProjects && <div className="text-[11px] mt-0.5" style={{ color: C.accent }}>Projects: {s.linkedProjects}</div>}
            </div>;
          })}
        </div>
      )}
    </div>
  );
};

const ReviewTab = ({ summary, onCopy }) => {
  if (!summary) return null;
  const { staff, totalEntries, totalPraise, ledEntries, topContributions, categories, praise, goals, readiness } = summary;
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #0d0d0d, #1e1b4b)' }}>
        <div className="text-[12px] opacity-60 mb-1">{summary.cycle ? summary.cycle.name : 'All Time'} · Performance Review</div>
        <div className="text-[24px] font-bold">{staff?.name || 'Staff Member'}</div>
        <div className="text-[13px] opacity-70 mt-0.5">{staff?.designation || ''}{staff?.department ? ` · ${staff.department}` : ''}</div>
        <div className="flex gap-8 mt-5">
          {[{ n: totalEntries, l: 'entries' }, { n: totalPraise, l: 'praise' }, { n: ledEntries, l: 'led' }, { n: goals?.length || 0, l: 'goals done' }].map(s => (
            <div key={s.l}><div className="text-[20px] font-bold">{s.n}</div><div className="text-[11px] opacity-50">{s.l}</div></div>
          ))}
        </div>
      </div>
      {/* Readiness */}
      <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-semibold" style={{ color: C.ink }}>Review Readiness</span>
          <span className="text-[16px] font-bold" style={{ color: readiness.readiness >= 75 ? C.green : readiness.readiness >= 50 ? C.amber : C.red }}>{readiness.readiness}%</span>
        </div>
        <div className="rounded-full h-3" style={{ background: C.paper2 }}>
          <div className="h-3 rounded-full transition-all" style={{ width: `${readiness.readiness}%`, background: readiness.readiness >= 75 ? C.green : readiness.readiness >= 50 ? C.amber : C.red }} />
        </div>
        <p className="text-[12px] mt-2" style={{ color: C.ink3 }}>
          {readiness.readiness >= 75 ? '💪 Strong review packet — well documented.' : readiness.readiness >= 50 ? '📝 Good progress — add more entries to strengthen.' : '⚡ Keep logging and collecting praise.'}
        </p>
      </div>
      {/* Top contributions */}
      {topContributions?.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
          <h4 className="text-[14px] font-semibold mb-3" style={{ color: C.ink }}>Top Contributions</h4>
          {topContributions.map((c, i) => (
            <div key={c.id} className="flex gap-3 items-start mb-3 last:mb-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: C.accentLight, color: C.accent }}>{i + 1}</div>
              <div><div className="text-[13px] font-medium" style={{ color: C.ink }}>{c.title}</div>{c.impact && <div className="text-[12px] font-medium mt-0.5" style={{ color: C.green }}>{c.impact}</div>}</div>
            </div>
          ))}
        </div>
      )}
      {/* Praise */}
      {praise?.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.paper2}` }}>
          <h4 className="text-[14px] font-semibold mb-3" style={{ color: C.ink }}>Praise Highlights</h4>
          {praise.slice(0, 3).map(p => (
            <div key={p.id} className="mb-3 last:mb-0 pl-3" style={{ borderLeft: `3px solid ${C.accent}` }}>
              <p className="text-[13px] italic" style={{ color: C.ink2 }}>"{p.text}"</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.ink4 }}>— {p.givenByName}{p.givenByRole ? `, ${p.givenByRole}` : ''}</p>
            </div>
          ))}
        </div>
      )}
      <button onClick={onCopy} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white" style={{ background: C.accent }}><Copy size={14} /> Copy review to clipboard</button>
    </div>
  );
};

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d), now = new Date();
  const diff = Math.floor((now - dt) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: dt.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default WorkLogManagement;
