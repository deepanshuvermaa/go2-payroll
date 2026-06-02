import React, { useState, useEffect } from 'react';
import {
  Users, BarChart3, AlertTriangle, TrendingUp, Plus, Calendar, Clock,
  CheckCircle2, XCircle, Edit2, Trash2, X, ChevronDown, Award, Target,
  ClipboardList, Eye, RefreshCw, Bell, Settings, ArrowUpRight, Zap, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

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

const TABS = [
  { id: 'overview', label: 'Overview', emoji: '📊' },
  { id: 'team', label: 'Team', emoji: '👥' },
  { id: 'reviews', label: 'Review Cycles', emoji: '📅' },
];

const ENGAGEMENT_COLORS = {
  high: { bg: C.greenLight, fg: C.green, label: 'High' },
  medium: { bg: C.amberLight, fg: C.amber, label: 'Medium' },
  low: { bg: C.redLight, fg: C.red, label: 'Low' },
};

// ——— OVERLAY ———
const Overlay = ({ title, emoji, children, onClose, wide }) => (
  <div
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div style={{ background: C.white, borderRadius: 16, boxShadow: '0 24px 48px rgba(0,0,0,.15)', width: '100%', maxWidth: wide ? 640 : 500, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'slideUp .25s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.paper2}` }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
          {emoji && <span>{emoji}</span>}{title}
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, padding: 4 }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: 24, overflowY: 'auto' }}>{children}</div>
    </div>
  </div>
);

// ——— FIELD ———
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1px solid ${C.paper3}`, borderRadius: 8,
  fontSize: 14, fontFamily: 'inherit', background: C.white, color: C.ink, outline: 'none',
  transition: 'border-color .15s',
};

// ——— STAT CARD ———
const StatCard = ({ emoji, value, label, sub, warning }) => (
  <div style={{
    background: C.white, borderRadius: 14, border: `1px solid ${warning ? '#fecaca' : C.paper2}`,
    padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: C.ink3 }}>{label}</span>
      <span style={{ fontSize: 20 }}>{emoji}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: warning ? C.red : C.ink, letterSpacing: '-0.5px' }}>{value}</div>
    {sub && <span style={{ fontSize: 12, fontWeight: 500, color: warning ? C.red : C.green }}>{sub}</span>}
  </div>
);

// ——— ENGAGEMENT DOT ———
const EngagementBadge = ({ level }) => {
  const cfg = ENGAGEMENT_COLORS[level] || { bg: C.paper2, fg: C.ink3, label: level };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.fg,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.fg }} />
      {cfg.label}
    </span>
  );
};

// ——— INITIALS AVATAR ———
const Avatar = ({ name, size = 40, bg = C.accent }) => {
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: C.white,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

// ——— MAIN COMPONENT ———
const WorkLogDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [engagement, setEngagement] = useState(null);
  const [reviewCycles, setReviewCycles] = useState([]);
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState([]);

  // Modals
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState(null);

  // Cycle form
  const [cycleForm, setCycleForm] = useState({
    name: '', startDate: '', endDate: '', status: 'draft',
  });

  // Settings form
  const [settingsForm, setSettingsForm] = useState(null);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => { refreshData(); }, []);

  const refreshData = () => {
    setEngagement(payrollDataStore.getTeamEngagement());
    setReviewCycles(payrollDataStore.getReviewCycles());
    setSettings(payrollDataStore.getWorkLogSettings());
    setStaff(payrollDataStore.getStaff().filter(s => s.status !== 'inactive'));
  };

  // Cycle CRUD
  const handleSaveCycle = () => {
    if (!cycleForm.name.trim()) { toast.error('Cycle name is required'); return; }
    if (!cycleForm.startDate || !cycleForm.endDate) { toast.error('Start and end dates are required'); return; }
    if (cycleForm.startDate > cycleForm.endDate) { toast.error('Start date must be before end date'); return; }

    if (editingCycle) {
      payrollDataStore.updateReviewCycle(editingCycle.id, cycleForm);
      toast.success('Review cycle updated');
    } else {
      payrollDataStore.addReviewCycle(cycleForm);
      toast.success('Review cycle created');
    }
    setCycleForm({ name: '', startDate: '', endDate: '', status: 'draft' });
    setEditingCycle(null);
    setShowCycleModal(false);
    refreshData();
  };

  const handleDeleteCycle = () => {
    if (!deleteConfirm) return;
    payrollDataStore.deleteReviewCycle(deleteConfirm);
    toast.success('Review cycle deleted');
    setDeleteConfirm(null);
    refreshData();
  };

  // Settings
  const openSettings = () => {
    setSettingsForm({ ...payrollDataStore.getWorkLogSettings() });
    setShowSettingsModal(true);
  };

  const handleSaveSettings = () => {
    payrollDataStore.updateWorkLogSettings(settingsForm);
    toast.success('WorkLog settings updated');
    setShowSettingsModal(false);
    refreshData();
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (settingsForm.categories.includes(newCategory.trim())) {
      toast.error('Category already exists');
      return;
    }
    setSettingsForm({ ...settingsForm, categories: [...settingsForm.categories, newCategory.trim()] });
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    setSettingsForm({ ...settingsForm, categories: settingsForm.categories.filter(c => c !== cat) });
  };

  // Staff detail
  const getStaffReviewData = (staffId) => {
    const stats = payrollDataStore.getWorkLogStats(staffId);
    const praise = payrollDataStore.getPraise(staffId);
    const goals = payrollDataStore.getGoals(staffId);
    const readiness = payrollDataStore.getReviewReadiness(staffId);
    const recentEntries = payrollDataStore.getWorkLogEntries(staffId).slice(0, 5);
    return { stats, praise, goals, readiness, recentEntries };
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>👁️</span> Team WorkLog Overview
          </h1>
          <p style={{ fontSize: 14, color: C.ink3, marginTop: 4 }}>Monitor team engagement, review cycles &amp; performance tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={openSettings}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
              border: `1px solid ${C.paper3}`, background: C.white, color: C.ink2, fontSize: 13,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Settings size={14} /> Settings
          </button>
          <button
            onClick={refreshData}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
              border: `1px solid ${C.paper3}`, background: C.white, color: C.ink2, fontSize: 13,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setCycleForm({ name: '', startDate: '', endDate: '', status: 'draft' }); setEditingCycle(null); setShowCycleModal(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10,
              background: C.accent, color: C.white, fontSize: 13, fontWeight: 600, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={15} /> New Review Cycle
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.paper2, padding: 4, borderRadius: 12, marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9,
              fontSize: 13, fontWeight: activeTab === t.id ? 600 : 500, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .15s',
              background: activeTab === t.id ? C.white : 'transparent',
              color: activeTab === t.id ? C.accent : C.ink3,
              boxShadow: activeTab === t.id ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
            }}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && engagement && (
        <OverviewTab engagement={engagement} reviewCycles={reviewCycles} onViewStaff={(sid) => setSelectedStaffDetail(sid)} />
      )}

      {/* Team Tab */}
      {activeTab === 'team' && engagement && (
        <TeamTab engagement={engagement} onViewStaff={(sid) => setSelectedStaffDetail(sid)} />
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <ReviewCyclesTab
          cycles={reviewCycles}
          staff={staff}
          onAdd={() => { setCycleForm({ name: '', startDate: '', endDate: '', status: 'draft' }); setEditingCycle(null); setShowCycleModal(true); }}
          onEdit={(c) => { setEditingCycle(c); setCycleForm({ name: c.name, startDate: c.startDate, endDate: c.endDate, status: c.status }); setShowCycleModal(true); }}
          onDelete={(id) => setDeleteConfirm(id)}
          onActivate={(id) => { payrollDataStore.updateReviewCycle(id, { status: 'active' }); toast.success('Cycle activated'); refreshData(); }}
          onComplete={(id) => { payrollDataStore.updateReviewCycle(id, { status: 'completed' }); toast.success('Cycle completed'); refreshData(); }}
        />
      )}

      {/* Staff Detail Slide-over */}
      {selectedStaffDetail && (
        <StaffDetailPanel
          staffId={selectedStaffDetail}
          staff={staff}
          data={getStaffReviewData(selectedStaffDetail)}
          onClose={() => setSelectedStaffDetail(null)}
        />
      )}

      {/* Cycle Modal */}
      {showCycleModal && (
        <Overlay title={editingCycle ? 'Edit Review Cycle' : 'Create Review Cycle'} emoji="📅" onClose={() => { setShowCycleModal(false); setEditingCycle(null); }}>
          <Field label="Cycle name *">
            <input
              style={inputStyle} placeholder="e.g. Q1 2026 Review"
              value={cycleForm.name}
              onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Start date *">
              <input style={inputStyle} type="date" value={cycleForm.startDate}
                onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
              />
            </Field>
            <Field label="End date *">
              <input style={inputStyle} type="date" value={cycleForm.endDate}
                onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Status">
            <select style={inputStyle} value={cycleForm.status}
              onChange={(e) => setCycleForm({ ...cycleForm, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={() => { setShowCycleModal(false); setEditingCycle(null); }}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${C.paper3}`, background: C.white, color: C.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Cancel</button>
            <button
              onClick={handleSaveCycle}
              style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: C.accent, color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >{editingCycle ? 'Update Cycle' : 'Create Cycle'}</button>
          </div>
        </Overlay>
      )}

      {/* Settings Modal */}
      {showSettingsModal && settingsForm && (
        <Overlay title="WorkLog Settings" emoji="⚙️" onClose={() => setShowSettingsModal(false)} wide>
          <Field label="Work categories">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {settingsForm.categories.map(cat => (
                <span key={cat} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, background: C.paper, color: C.ink2,
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                }}>
                  {cat}
                  <button onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, display: 'flex' }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="New category"
                value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
              />
              <button onClick={addCategory} style={{
                background: 'none', border: 'none', color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 12px', fontFamily: 'inherit',
              }}>Add</button>
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Reminder frequency">
              <select style={inputStyle} value={settingsForm.reminderFrequency}
                onChange={(e) => setSettingsForm({ ...settingsForm, reminderFrequency: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label="Weekly log target">
              <input style={inputStyle} type="number" min="1" max="10"
                value={settingsForm.weeklyLogTarget}
                onChange={(e) => setSettingsForm({ ...settingsForm, weeklyLogTarget: parseInt(e.target.value) || 3 })}
              />
            </Field>
          </div>
          <Field label="Default review cycle period">
            <select style={inputStyle} value={settingsForm.reviewCyclePeriod}
              onChange={(e) => setSettingsForm({ ...settingsForm, reviewCyclePeriod: e.target.value })}>
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half-yearly</option>
              <option value="annual">Annual</option>
            </select>
          </Field>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {[
              { key: 'enablePraise', label: 'Enable Praise Vault', emoji: '🏆' },
              { key: 'enableGoals', label: 'Enable Goals & OKRs', emoji: '🎯' },
              { key: 'enableSkills', label: 'Enable Skills Tracking', emoji: '🎓' },
            ].map(opt => (
              <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={settingsForm[opt.key]}
                  onChange={(e) => setSettingsForm({ ...settingsForm, [opt.key]: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: C.accent }}
                />
                <span style={{ fontSize: 14, color: C.ink2 }}>{opt.emoji} {opt.label}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={() => setShowSettingsModal(false)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${C.paper3}`, background: C.white, color: C.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Cancel</button>
            <button onClick={handleSaveSettings}
              style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: C.accent, color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Save Settings</button>
          </div>
        </Overlay>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Overlay title="Delete Review Cycle" emoji="🗑️" onClose={() => setDeleteConfirm(null)}>
          <p style={{ fontSize: 14, color: C.ink3, marginBottom: 20 }}>Are you sure you want to delete this review cycle? This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setDeleteConfirm(null)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${C.paper3}`, background: C.white, color: C.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Cancel</button>
            <button onClick={handleDeleteCycle}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: C.red, color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Delete</button>
          </div>
        </Overlay>
      )}
    </div>
  );
};

// ========== OVERVIEW TAB ==========
const OverviewTab = ({ engagement, reviewCycles, onViewStaff }) => {
  const activeCycle = reviewCycles.find(c => c.status === 'active');
  const topPerformers = [...engagement.staff].sort((a, b) => b.totalEntries - a.totalEntries).slice(0, 5);
  const atRisk = engagement.atRiskStaff;

  return (
    <div className="slide-up">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard emoji="👥" label="Active Staff" value={engagement.totalStaff} />
        <StatCard emoji="📈" label="Weekly Active Loggers" value={`${engagement.weeklyActivePercent}%`}
          sub={`${engagement.weeklyActiveLoggers} of ${engagement.totalStaff}`}
        />
        <StatCard emoji="📋" label="Entries This Month" value={engagement.totalEntriesThisMonth} />
        <StatCard emoji="⚠️" label="At-Risk Signals" value={engagement.atRiskCount}
          warning={engagement.atRiskCount > 0}
          sub={engagement.atRiskCount > 0 ? 'needs attention' : null}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Top Performers */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏅 Top Performers
          </h3>
          {topPerformers.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.paper2}`, padding: 40, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📝</p>
              <p style={{ fontSize: 14, color: C.ink3 }}>No entries yet — encourage your team to start logging!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topPerformers.map((s, i) => (
                <div
                  key={s.staffId}
                  onClick={() => onViewStaff(s.staffId)}
                  style={{
                    background: C.white, borderRadius: 12, border: `1px solid ${C.paper2}`,
                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accentLight; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.paper2; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <Avatar name={s.staffName} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.staffName}</div>
                    <div style={{ fontSize: 11, color: C.ink3 }}>{s.designation || s.department || 'Staff'} · {s.totalEntries} entries</div>
                  </div>
                  <EngagementBadge level={s.engagementLevel} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* At-Risk */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              🚨 Engagement Signals
            </h3>
            {atRisk.length === 0 ? (
              <div style={{
                background: C.greenLight, border: `1px solid #a7f3d0`, borderRadius: 14,
                padding: 24, textAlign: 'center',
              }}>
                <p style={{ fontSize: 32, marginBottom: 6 }}>✅</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.green }}>All staff engaged</p>
                <p style={{ fontSize: 12, color: C.green, opacity: 0.8, marginTop: 2 }}>No at-risk signals detected</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {atRisk.map(s => (
                  <div
                    key={s.staffId}
                    onClick={() => onViewStaff(s.staffId)}
                    style={{
                      background: C.white, borderRadius: 12, border: `1px solid #fecaca`,
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.redLight; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.white; }}
                  >
                    <AlertTriangle size={16} style={{ color: C.red, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{s.staffName}</div>
                      <div style={{ fontSize: 11, color: C.red }}>
                        {s.daysSinceLastEntry >= 999 ? 'Never logged' : `${s.daysSinceLastEntry} days since last entry`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Review Cycle */}
          {activeCycle && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                📅 Active Review Cycle
              </h3>
              <div style={{
                background: `linear-gradient(135deg, ${C.accentLight}, ${C.white})`,
                borderRadius: 14, border: `1px solid ${C.paper2}`, padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{activeCycle.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: C.greenLight, color: C.green }}>Active</span>
                </div>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8 }}>
                  {formatDate(activeCycle.startDate)} — {formatDate(activeCycle.endDate)}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>
                  {daysRemaining(activeCycle.endDate)} <span style={{ fontSize: 12, fontWeight: 500, color: C.ink3 }}>days remaining</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== TEAM TAB ==========
const TeamTab = ({ engagement, onViewStaff }) => {
  const [sortBy, setSortBy] = useState('name');
  const sorted = [...engagement.staff].sort((a, b) => {
    if (sortBy === 'name') return (a.staffName || '').localeCompare(b.staffName || '');
    if (sortBy === 'entries') return b.totalEntries - a.totalEntries;
    if (sortBy === 'recent') return a.daysSinceLastEntry - b.daysSinceLastEntry;
    if (sortBy === 'engagement') {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.engagementLevel] || 2) - (order[b.engagementLevel] || 2);
    }
    return 0;
  });

  return (
    <div className="slide-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
            👥 Team Members
          </h3>
          <p style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{engagement.totalStaff} active staff</p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={inputStyle}
          className="w-auto"
        >
          <option value="name">Sort by name</option>
          <option value="entries">Sort by entries</option>
          <option value="recent">Sort by activity</option>
          <option value="engagement">Sort by engagement</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {sorted.map(s => (
          <div
            key={s.staffId}
            onClick={() => onViewStaff(s.staffId)}
            style={{
              background: C.white, borderRadius: 14, border: `1px solid ${C.paper2}`,
              padding: 18, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accentLight; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.paper2; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Avatar name={s.staffName} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.staffName}</div>
                <div style={{ fontSize: 11, color: C.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.designation || s.department || 'Staff'}</div>
              </div>
              <EngagementBadge level={s.engagementLevel} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Entries (total)', value: s.totalEntries, color: C.ink },
                { label: 'This week', value: s.weekEntries, color: s.weekEntries > 0 ? C.green : C.ink4 },
                { label: 'Praise received', value: s.praiseCount, color: C.ink },
                { label: 'Last entry', value: s.daysSinceLastEntry >= 999 ? 'Never' : s.daysSinceLastEntry === 0 ? 'Today' : `${s.daysSinceLastEntry}d ago`,
                  color: s.daysSinceLastEntry > 14 ? C.red : s.daysSinceLastEntry > 7 ? C.amber : C.ink2 },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: C.ink3 }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>

            {s.engagementLevel === 'low' && (
              <div style={{
                marginTop: 12, background: C.redLight, border: `1px solid #fecaca`, borderRadius: 10,
                padding: '8px 12px', fontSize: 11, color: C.red, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <AlertTriangle size={12} /> Low engagement — no entries in {s.daysSinceLastEntry >= 999 ? 'ever' : `${s.daysSinceLastEntry} days`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== REVIEW CYCLES TAB ==========
const ReviewCyclesTab = ({ cycles, staff, onAdd, onEdit, onDelete, onActivate, onComplete }) => {
  const STATUS_CONFIG = {
    draft: { bg: C.paper2, fg: C.ink2, label: 'Draft', emoji: '📝' },
    active: { bg: C.greenLight, fg: C.green, label: 'Active', emoji: '🟢' },
    completed: { bg: C.accentLight, fg: C.accent, label: 'Completed', emoji: '✅' },
  };

  return (
    <div className="slide-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
            📅 Review Cycles
          </h3>
          <p style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>Manage performance review periods</p>
        </div>
        <button
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10,
            background: C.accent, color: C.white, fontSize: 13, fontWeight: 600, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={15} /> New Cycle
        </button>
      </div>

      {cycles.length === 0 ? (
        <div style={{
          background: C.white, borderRadius: 16, border: `1px solid ${C.paper2}`,
          padding: '60px 40px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📅</p>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 6 }}>No review cycles created</h4>
          <p style={{ fontSize: 13, color: C.ink3, marginBottom: 20 }}>Create a review cycle to start tracking performance review periods.</p>
          <button
            onClick={onAdd}
            style={{
              padding: '10px 24px', borderRadius: 10, background: C.accent, color: C.white,
              fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Create First Cycle</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cycles.map(cycle => {
            const sc = STATUS_CONFIG[cycle.status] || STATUS_CONFIG.draft;
            const remaining = daysRemaining(cycle.endDate);

            return (
              <div key={cycle.id} style={{
                background: C.white, borderRadius: 14, border: `1px solid ${C.paper2}`,
                padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{sc.emoji}</span>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{cycle.name}</h4>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: sc.bg, color: sc.fg,
                    }}>{sc.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {cycle.status === 'draft' && (
                      <button onClick={() => onActivate(cycle.id)} style={{
                        fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                        background: C.greenLight, color: C.green, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      }}>Activate</button>
                    )}
                    {cycle.status === 'active' && (
                      <button onClick={() => onComplete(cycle.id)} style={{
                        fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                        background: C.accentLight, color: C.accent, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      }}>Complete</button>
                    )}
                    <button onClick={() => onEdit(cycle)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, padding: 4 }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(cycle.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.ink3, marginBottom: 6 }}>
                  {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
                  {cycle.status === 'active' && remaining > 0 && (
                    <span style={{ color: C.accent, fontWeight: 600, marginLeft: 10 }}>{remaining} days remaining</span>
                  )}
                </div>
                {cycle.status === 'active' && (
                  <div style={{ fontSize: 11, color: C.ink4, marginTop: 4 }}>
                    {staff.length} employees in scope
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ========== STAFF DETAIL PANEL ==========
const StaffDetailPanel = ({ staffId, staff: allStaff, data, onClose }) => {
  const staffMember = allStaff.find(s => s.id === staffId);
  if (!staffMember) return null;
  const { stats, praise, goals, readiness, recentEntries } = data;

  const readinessColor = readiness.readiness >= 75 ? C.green : readiness.readiness >= 50 ? C.amber : C.red;
  const readinessBg = readiness.readiness >= 75 ? C.greenLight : readiness.readiness >= 50 ? C.amberLight : C.redLight;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 420, background: C.white, boxShadow: '-8px 0 32px rgba(0,0,0,.12)',
        overflowY: 'auto', animation: 'slideInRight .25s ease-out',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, background: C.white, borderBottom: `1px solid ${C.paper2}`,
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{staffMember.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={staffMember.name} size={50} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{staffMember.name}</div>
              <div style={{ fontSize: 12, color: C.ink3 }}>{staffMember.designation || ''} {staffMember.department ? `· ${staffMember.department}` : ''}</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { emoji: '📝', value: stats.totalEntries, label: 'Entries' },
              { emoji: '🏆', value: stats.totalPraise, label: 'Praise' },
              { emoji: '🎯', value: stats.activeGoals, label: 'Active Goals' },
              { emoji: '📊', value: `${readiness.readiness}%`, label: 'Review Ready', color: readinessColor },
            ].map(s => (
              <div key={s.label} style={{
                background: C.paper, borderRadius: 12, padding: '14px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18 }}>{s.emoji}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color || C.ink, marginTop: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Readiness Bar */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>Review Readiness</div>
            <div style={{ background: C.paper2, borderRadius: 10, height: 10, overflow: 'hidden' }}>
              <div style={{
                width: `${readiness.readiness}%`, height: '100%', borderRadius: 10,
                background: readinessColor, transition: 'width .5s ease',
              }} />
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.keys(stats.categoryBreakdown).length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink2, marginBottom: 10 }}>📊 Work Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(stats.categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: C.ink3 }}>{cat}</span>
                    <span style={{ fontWeight: 600, color: C.ink, background: C.paper, padding: '2px 8px', borderRadius: 8 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink2, marginBottom: 10 }}>📝 Recent Entries</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentEntries.map(e => (
                  <div key={e.id} style={{
                    background: C.paper, borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{e.title}</div>
                    {e.impact && <div style={{ fontSize: 11, color: C.green, marginTop: 3 }}>{e.impact}</div>}
                    <div style={{ fontSize: 11, color: C.ink4, marginTop: 4 }}>{formatDate(e.date)} · {e.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Praise */}
          {praise.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink2, marginBottom: 10 }}>🏆 Praise ({praise.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {praise.slice(0, 3).map(p => (
                  <div key={p.id} style={{
                    background: C.goldLight, borderRadius: 10, padding: '12px 14px',
                    borderLeft: `3px solid ${C.gold}`,
                  }}>
                    <p style={{ fontSize: 12, color: C.ink2, fontStyle: 'italic' }}>"{p.text}"</p>
                    <p style={{ fontSize: 11, color: C.ink4, marginTop: 4 }}>— {p.givenByName || 'Unknown'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== UTILITIES ==========
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysRemaining(endDate) {
  if (!endDate) return 0;
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export default WorkLogDashboard;
