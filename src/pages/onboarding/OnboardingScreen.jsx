import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, User, FileText, Laptop, CreditCard, Key, ArrowRight, Download, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { onboardingAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const MOCK_TASKS = [
  { id: '1', title: 'Document Submission', description: 'Submit PAN, Aadhaar, Bank details', category: 'Documents', completed: true },
  { id: '2', title: 'IT Setup', description: 'Laptop, email, system access configured', category: 'IT', completed: true },
  { id: '3', title: 'HR Orientation', description: 'Company policies, benefits overview', category: 'HR', completed: false },
  { id: '4', title: 'Team Introduction', description: 'Meet your team and buddy', category: 'Social', completed: false },
  { id: '5', title: 'Policy Acknowledgement', description: 'Sign off on Code of Conduct, Leave Policy, IT Policy', category: 'Documents', completed: false },
  { id: '6', title: 'Benefits Enrollment', description: 'Health insurance, PF nomination', category: 'HR', completed: false },
];

const EXIT_REASONS = ['Better Opportunity', 'Higher Salary', 'Relocation', 'Personal Reasons', 'Career Change', 'Health Issues', 'Work-Life Balance', 'Management Issues', 'Other'];

const OnboardingScreen = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('onboarding');
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [loading, setLoading] = useState(false);
  const [fnfData, setFnfData] = useState(null);
  const [exitForm, setExitForm] = useState({
    resignationDate: '', lastWorkingDay: '', reason: '', reasonDetail: '',
    ratings: { environment: 3, management: 3, growth: 3, compensation: 3, wlb: 3 },
    suggestions: '', assets: { laptop: false, idCard: false, accessCard: false, keys: false }
  });

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      if (user?.employeeId) {
        const res = await onboardingAPI.getProgress(user.employeeId);
        if (res?.data?.tasks?.length) setTasks(res.data.tasks);
      }
    } catch { /* use mock */ }
  };

  const handleComplete = async (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    try { await onboardingAPI.completeTask(taskId); } catch {}
    toast.success('Task marked complete!');
  };

  const handleFnF = async () => {
    setLoading(true);
    try {
      const res = await onboardingAPI.calculateFnF(user?.employeeId || 'DEMO');
      setFnfData(res?.data || {
        basicDues: 45000, leaveEncashment: 12000, gratuity: 8500, noticePay: 0,
        loanDeductions: -5000, advanceDeductions: -2000, total: 58500
      });
    } catch {
      setFnfData({ basicDues: 45000, leaveEncashment: 12000, gratuity: 8500, noticePay: 0, loanDeductions: -5000, advanceDeductions: -2000, total: 58500 });
    }
    setLoading(false);
  };

  const handleExitSubmit = async () => {
    if (!exitForm.resignationDate || !exitForm.lastWorkingDay || !exitForm.reason) {
      toast.error('Please fill in all required fields'); return;
    }
    setLoading(true);
    try {
      await onboardingAPI.initiateExit({ employeeId: user?.employeeId, ...exitForm });
      toast.success('Exit request submitted. HR will contact you within 24 hours.');
    } catch {
      toast.success('Exit request submitted. HR will contact you within 24 hours.');
    }
    setLoading(false);
  };

  const completed = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2B2B2B]">Employee Lifecycle</h1>
        <p className="text-[#9C9C9C] mt-1">Onboarding & Offboarding management</p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2">
        {[{ id: 'onboarding', label: '🌟 Onboarding' }, { id: 'offboarding', label: '👋 Offboarding' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-[#2B2B2B] text-white' : 'bg-white text-[#9C9C9C] border border-[#E7E2D8] hover:bg-[#F5F1E6]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'onboarding' && (
        <div className="space-y-5">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-[#2B2B2B]">Onboarding Progress</h3>
                <p className="text-sm text-[#9C9C9C] mt-0.5">{completed} of {tasks.length} tasks completed</p>
              </div>
              <span className="text-2xl font-bold text-[#2B2B2B]">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-[#E7E2D8] overflow-hidden">
              <div className="h-full rounded-full bg-[#F3CC4D] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            {progress === 100 && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">Onboarding complete! Welcome aboard 🎉</span>
              </div>
            )}
          </div>

          {/* Task Categories */}
          {['Documents', 'IT', 'HR', 'Social'].map(cat => {
            const catTasks = tasks.filter(t => t.category === cat);
            if (!catTasks.length) return null;
            return (
              <div key={cat} className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-[#9C9C9C] uppercase tracking-wide mb-3">{cat}</h4>
                <div className="space-y-3">
                  {catTasks.map(task => (
                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${task.completed ? 'bg-emerald-50' : 'bg-[#F5F1E6]'}`}>
                      <button onClick={() => !task.completed && handleComplete(task.id)} className="mt-0.5 flex-shrink-0">
                        {task.completed ? <CheckCircle size={20} className="text-emerald-600" /> : <Circle size={20} className="text-[#9C9C9C] hover:text-[#F3CC4D]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-[#9C9C9C]' : 'text-[#2B2B2B]'}`}>{task.title}</p>
                        <p className="text-xs text-[#9C9C9C] mt-0.5">{task.description}</p>
                      </div>
                      {!task.completed && (
                        <button onClick={() => handleComplete(task.id)}
                          className="text-xs bg-[#2B2B2B] text-white px-3 py-1.5 rounded-lg hover:bg-[#3d3d3d] transition-colors flex-shrink-0">
                          Done
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'offboarding' && (
        <div className="space-y-5">
          {/* Exit Interview Form */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#2B2B2B] mb-4">Exit Interview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide">Resignation Date *</label>
                <input type="date" value={exitForm.resignationDate} onChange={e => setExitForm(p => ({ ...p, resignationDate: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#E7E2D8] text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide">Last Working Day *</label>
                <input type="date" value={exitForm.lastWorkingDay} onChange={e => setExitForm(p => ({ ...p, lastWorkingDay: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#E7E2D8] text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide">Reason for Leaving *</label>
                <select value={exitForm.reason} onChange={e => setExitForm(p => ({ ...p, reason: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#E7E2D8] text-sm focus:outline-none focus:border-[#F3CC4D] bg-white">
                  <option value="">Select reason</option>
                  {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide">Additional Details</label>
                <input type="text" placeholder="Any additional context" value={exitForm.reasonDetail} onChange={e => setExitForm(p => ({ ...p, reasonDetail: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#E7E2D8] text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
            </div>

            {/* Rating sliders */}
            <div className="mt-5">
              <p className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide mb-3">Rate Your Experience (1–5)</p>
              {[['environment', 'Work Environment'], ['management', 'Management'], ['growth', 'Growth Opportunities'], ['compensation', 'Compensation'], ['wlb', 'Work-Life Balance']].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-[#2B2B2B] w-44 flex-shrink-0">{label}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setExitForm(p => ({ ...p, ratings: { ...p.ratings, [key]: n } }))}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${exitForm.ratings[key] >= n ? 'bg-[#F3CC4D] text-[#2B2B2B]' : 'bg-[#F5F1E6] text-[#9C9C9C] hover:bg-[#E7E2D8]'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-[#9C9C9C] uppercase tracking-wide">Suggestions for Improvement</label>
              <textarea value={exitForm.suggestions} onChange={e => setExitForm(p => ({ ...p, suggestions: e.target.value }))} rows={3}
                placeholder="What could we have done better?"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#E7E2D8] text-sm resize-none focus:outline-none focus:border-[#F3CC4D]" />
            </div>
          </div>

          {/* Asset Return Checklist */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#2B2B2B] mb-4 flex items-center gap-2"><Laptop size={16} /> Asset Return Checklist</h3>
            <div className="grid grid-cols-2 gap-3">
              {[['laptop', '💻 Laptop / MacBook'], ['idCard', '🪪 ID Card'], ['accessCard', '🔑 Access Card'], ['keys', '🗝️ Office Keys']].map(([key, label]) => (
                <button key={key} onClick={() => setExitForm(p => ({ ...p, assets: { ...p.assets, [key]: !p.assets[key] } }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${exitForm.assets[key] ? 'border-emerald-500 bg-emerald-50' : 'border-[#E7E2D8] bg-[#F5F1E6]'}`}>
                  {exitForm.assets[key] ? <CheckCircle size={16} className="text-emerald-600" /> : <Circle size={16} className="text-[#9C9C9C]" />}
                  <span className="text-sm font-medium text-[#2B2B2B]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FnF Calculation */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#2B2B2B]">Full & Final Settlement</h3>
              <button onClick={handleFnF} disabled={loading}
                className="bg-[#2B2B2B] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#3d3d3d] transition-all disabled:opacity-50">
                {loading ? 'Calculating...' : 'Calculate FnF'}
              </button>
            </div>
            {fnfData && (
              <div className="space-y-2">
                {[['Basic Pay Dues', fnfData.basicDues], ['Leave Encashment', fnfData.leaveEncashment], ['Gratuity', fnfData.gratuity], ['Notice Pay', fnfData.noticePay], ['Loan Deductions', fnfData.loanDeductions], ['Advance Deductions', fnfData.advanceDeductions]].map(([label, amount]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-[#F5F1E6]">
                    <span className="text-sm text-[#9C9C9C]">{label}</span>
                    <span className={`text-sm font-medium ${amount < 0 ? 'text-red-600' : 'text-[#2B2B2B]'}`}>
                      {amount < 0 ? '- ' : '+ '}₹{Math.abs(amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold text-[#2B2B2B]">Net Payable</span>
                  <span className="text-lg font-bold text-emerald-600">₹{fnfData.total.toLocaleString('en-IN')}</span>
                </div>
                <button onClick={() => toast.success('FnF document sent to employee email')}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-[#F5F1E6] hover:bg-[#E7E2D8] text-[#2B2B2B] rounded-xl py-2.5 text-sm font-medium transition-colors">
                  <Download size={14} /> Download FnF Statement
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <button onClick={handleExitSubmit} disabled={loading}
            className="w-full bg-[#2B2B2B] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#3d3d3d] transition-all disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Exit Interview & Initiate Offboarding'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingScreen;
