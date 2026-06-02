import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, ChevronRight, ChevronDown, ChevronUp, Check, Users, Briefcase, Rocket, Laptop, Shield, Zap, Brain, BarChart3, Globe, FileText, Calendar, Clock, TrendingUp, Award } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [expandedAccordion, setExpandedAccordion] = useState('Salary Structures');
  const [faqActive, setFaqActive] = useState(0);
  const [previewScreen, setPreviewScreen] = useState(null);

  const tabs = ['Dashboard', 'People', 'Attendance', 'Leave', 'Payroll', 'Compliance', 'Reports'];

  const tasks = [
    { title: 'PF ECR Filing', time: 'Due in 5 days', done: true },
    { title: 'June Salary Processing', time: 'Due 30th June', done: true },
    { title: 'TDS 24Q Filing', time: 'Due 15th July', done: false },
    { title: 'ESI Challan Upload', time: 'Due 15th July', done: false },
    { title: 'New Joiner Onboarding', time: '3 pending', done: false },
  ];

  const mockScreens = {
    People: { title: 'Employee Directory', desc: 'Complete employee profiles with documents, salary history, and org chart.', stats: ['248 Active', '12 On Notice', '3 New This Month'], color: '#0ea5e9' },
    Attendance: { title: 'Smart Attendance', desc: 'GPS check-in, biometric sync, geofencing, and auto-absent marking.', stats: ['92% Present Today', '15 Late Marks', '8 On Leave'], color: '#10b981' },
    Leave: { title: 'Leave Management', desc: 'Apply, approve, track balances. Auto-accrual, encashment, comp-off.', stats: ['12 Pending', '156 Approved', '98% Utilization'], color: '#8b5cf6' },
    Payroll: { title: 'One-Click Payroll', desc: 'Full salary processing with PF, ESI, PT, TDS auto-calculated.', stats: ['₹24.8L Processed', '248 Payslips', '0 Errors'], color: '#f59e0b' },
    Compliance: { title: 'Indian Compliance', desc: 'PF ECR, ESI challan, PT, Form 16, 24Q — all automated.', stats: ['100% Compliant', '5 Filings Done', '2 Upcoming'], color: '#ef4444' },
    Reports: { title: 'Reports & Analytics', desc: 'Salary registers, cost trends, attrition prediction, custom builder.', stats: ['30+ Report Types', 'Excel/PDF/CSV', 'Scheduled Delivery'], color: '#06b6d4' },
  };

  const faqs = [
    { q: "How fast can I get started?", a: "Most organizations are live within 24 hours. Import employees via CSV, set up salary templates, configure leave policies — and you're processing payroll by end of day." },
    { q: "Is Indian compliance really automated?", a: "100%. PF ECR files, ESI challans, PT state-wise slabs, TDS 24Q, Form 16 — all generated with one click. We update slabs automatically when government changes them." },
    { q: "What about salary disbursement?", a: "One-click disbursement via RazorpayX. We generate NEFT/RTGS files too. Auto-reconciliation tells you exactly which payments succeeded or failed." },
    { q: "Can my employees access their own data?", a: "Yes — Employee Self-Service portal lets staff view payslips, apply for leave, submit tax declarations, mark attendance from mobile, and download Form 16." },
    { q: "What makes Go2-Payroll different from greytHR or Keka?", a: "AI anomaly detection (no competitor has this), WhatsApp payslip delivery, offline desktop mode, employee chatbot, and attrition prediction — all included, not add-ons." },
  ];

  const features = [
    { icon: Zap, title: 'One-Click Payroll', desc: 'Process salaries for 5 to 5000 employees in under 60 seconds. Auto-calculates PF, ESI, PT, TDS, LOP, OT, arrears.', gradient: 'from-amber-100 to-yellow-50' },
    { icon: Shield, title: '100% Indian Compliance', desc: 'PF ECR, ESI challans, PT slabs, Form 16, 24Q — generated automatically. Never miss a filing deadline again.', gradient: 'from-sky-100 to-blue-50' },
    { icon: Brain, title: 'AI That Catches Errors', desc: 'Flags unusual salary changes, duplicate payments, and outlier amounts BEFORE you finalize. Saves lakhs in corrections.', gradient: 'from-purple-100 to-indigo-50' },
    { icon: Users, title: 'Employee Self-Service', desc: 'Payslips, leave, tax declarations, attendance — employees handle it themselves. You focus on strategy, not paperwork.', gradient: 'from-emerald-100 to-green-50' },
    { icon: BarChart3, title: 'Reports That Decide', desc: 'Salary registers, cost trends, attrition prediction, department breakdowns. Export to Excel, PDF, CSV in one click.', gradient: 'from-orange-100 to-amber-50' },
    { icon: Globe, title: 'Bank-Direct Payments', desc: 'Disburse salaries via RazorpayX with one click. NEFT/RTGS file generation. Real-time payment status tracking.', gradient: 'from-cyan-100 to-sky-50' },
  ];

  const accordionData = [
    { title: 'Salary Structures', content: 'CTC breakdown with Basic, HRA, DA, Special Allowance. Multiple templates for different grades.', detail: '6 Templates Active' },
    { title: 'Tax Declarations', content: 'Section 80C, 80D, HRA exemption, home loan. Old vs New regime comparison.', detail: '₹1.5L Declared' },
    { title: 'Loans & Advances', content: 'EMI recovery, advance deductions, auto-calculated from payroll every month.', detail: '3 Active Loans' },
    { title: 'Perks & Benefits', content: 'Flexi benefits, insurance, meal cards, fuel allowance — all configurable per grade.', detail: '8 Benefits' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: '#F5F1E6' }}>
      {/* ===== NAVBAR ===== */}
      <div className="flex justify-center pt-4 px-4">
        <nav className="w-full max-w-[1100px] h-[52px] rounded-full flex items-center px-2.5 gap-1.5" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.8)' }}>
          <div className="h-9 px-3 rounded-full bg-white flex items-center shadow-sm border border-[#E7E2D8] flex-shrink-0">
            <span className="font-semibold text-[13px] text-[#2B2B2B]">G2</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-0.5 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (mockScreens[tab]) setPreviewScreen(tab); else setPreviewScreen(null); }} className={`px-3.5 py-2 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${activeTab === tab ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-[#9C9C9C] hover:text-[#2B2B2B] hover:bg-black/5'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => navigate('/login')} className="h-9 px-4 rounded-full bg-[#F3CC4D] text-[#2B2B2B] text-[12px] font-semibold hover:scale-105 active:scale-95 transition-transform shadow-sm">
              Try Free →
            </button>
            <button onClick={() => navigate('/login')} className="h-9 px-3 rounded-full bg-white text-[12px] font-medium text-[#2B2B2B] border border-[#E7E2D8] shadow-sm hover:bg-[#F5F1E6] transition-colors">
              Login
            </button>
          </div>
        </nav>
      </div>

      {/* ===== MOCK SCREEN PREVIEW MODAL ===== */}
      {previewScreen && mockScreens[previewScreen] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewScreen(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[28px] p-8 max-w-2xl w-full shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={() => setPreviewScreen(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F1E6] border border-[#E7E2D8] flex items-center justify-center hover:bg-[#E7E2D8] transition-colors z-10">
              <span className="text-[#2B2B2B] text-lg leading-none">&times;</span>
            </button>

            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: mockScreens[previewScreen].color + '20' }}>
              <div className="w-6 h-6 rounded-full" style={{ background: mockScreens[previewScreen].color }} />
            </div>
            <h3 className="text-2xl font-semibold text-[#2B2B2B] mb-2">{mockScreens[previewScreen].title}</h3>
            <p className="text-[#9C9C9C] text-sm mb-5">{mockScreens[previewScreen].desc}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {mockScreens[previewScreen].stats.map((s, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#E7E2D8] text-[#2B2B2B] bg-[#F5F1E6]">{s}</span>
              ))}
            </div>

            {/* Realistic Mock Screen */}
            <div className="rounded-2xl border border-[#E7E2D8] overflow-hidden bg-[#F5F1E6]">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-[#E7E2D8]">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[10px] text-[#9C9C9C]">go2-payroll.app/{previewScreen.toLowerCase()}</span>
              </div>
              {/* Screen content */}
              <div className="p-5">
                {previewScreen === 'People' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#2B2B2B]">Employee Directory</h4>
                      <span className="px-2.5 py-1 rounded-full bg-[#2B2B2B] text-white text-[10px] font-medium">+ Add Employee</span>
                    </div>
                    {['Deepanshu Verma • CEO • ₹2,50,000', 'Priya Sharma • Sr. Developer • ₹1,20,000', 'Rahul Singh • HR Manager • ₹85,000', 'Anita Patel • Designer • ₹75,000', 'Vikram Joshi • Accountant • ₹65,000'].map((emp, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E7E2D8]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3CC4D] to-[#f59e0b] flex items-center justify-center text-[10px] font-bold text-white">{emp[0]}</div>
                        <span className="text-xs text-[#2B2B2B] flex-1">{emp}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                      </div>
                    ))}
                  </div>
                )}
                {previewScreen === 'Attendance' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#2B2B2B]">Today's Attendance</h4>
                      <span className="text-[10px] text-[#9C9C9C]">29 May 2026</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[{ l: 'Present', v: '228', c: '#10b981' }, { l: 'Absent', v: '8', c: '#ef4444' }, { l: 'On Leave', v: '10', c: '#f59e0b' }, { l: 'Late', v: '12', c: '#9C9C9C' }].map((s, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-white border border-[#E7E2D8] text-center">
                          <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
                          <p className="text-[9px] text-[#9C9C9C]">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    {['Deepanshu Verma — 09:02 AM ✓', 'Priya Sharma — 09:15 AM ✓', 'Rahul Singh — 09:45 AM (Late)', 'Anita Patel — On Leave', 'Vikram Joshi — 08:55 AM ✓'].map((r, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#E7E2D8]">
                        <div className={`w-2 h-2 rounded-full ${i === 3 ? 'bg-amber-400' : i === 2 ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        <span className="text-xs text-[#2B2B2B]">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {previewScreen === 'Leave' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#2B2B2B]">Leave Applications</h4>
                      <span className="px-2.5 py-1 rounded-full bg-[#F3CC4D] text-[#2B2B2B] text-[10px] font-bold">12 Pending</span>
                    </div>
                    {[{ n: 'Priya Sharma', t: 'Casual Leave', d: '2 Jun - 4 Jun', s: 'Pending' }, { n: 'Rahul Singh', t: 'Sick Leave', d: '1 Jun', s: 'Pending' }, { n: 'Anita Patel', t: 'Earned Leave', d: '10 Jun - 15 Jun', s: 'Approved' }, { n: 'Vikram Joshi', t: 'Comp Off', d: '5 Jun', s: 'Approved' }].map((l, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white border border-[#E7E2D8] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-[#2B2B2B]">{l.n} — {l.t}</p>
                          <p className="text-[10px] text-[#9C9C9C]">{l.d}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.s === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{l.s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {previewScreen === 'Payroll' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#2B2B2B]">June 2026 Payroll</h4>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓ Processed</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[{ l: 'Gross', v: '₹32.4L' }, { l: 'Deductions', v: '₹7.6L' }, { l: 'Net Pay', v: '₹24.8L' }].map((s, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white border border-[#E7E2D8] text-center">
                          <p className="text-base font-bold text-[#2B2B2B]">{s.v}</p>
                          <p className="text-[9px] text-[#9C9C9C]">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    {['Deepanshu Verma — ₹2,50,000 — ₹1,98,500 net', 'Priya Sharma — ₹1,20,000 — ₹96,200 net', 'Rahul Singh — ₹85,000 — ₹68,400 net'].map((r, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-white border border-[#E7E2D8] text-xs text-[#2B2B2B]">{r}</div>
                    ))}
                  </div>
                )}
                {previewScreen === 'Compliance' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#2B2B2B]">Compliance Status</h4>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">100% Score</span>
                    </div>
                    {[{ n: 'PF ECR - June', s: 'Filed', d: '₹3,84,000' }, { n: 'ESI Challan - June', s: 'Filed', d: '₹52,800' }, { n: 'PT - Maharashtra', s: 'Filed', d: '₹49,600' }, { n: 'TDS 24Q - Q1', s: 'Due 15 Jul', d: '₹4,12,000' }, { n: 'Form 16 - FY26', s: 'Generated', d: '248 employees' }].map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white border border-[#E7E2D8] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-[#2B2B2B]">{c.n}</p>
                          <p className="text-[10px] text-[#9C9C9C]">{c.d}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.s === 'Filed' || c.s === 'Generated' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {previewScreen === 'Reports' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#2B2B2B]">Reports Center</h4>
                      <span className="px-2.5 py-1 rounded-full bg-[#2B2B2B] text-white text-[10px] font-medium">+ Custom Report</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['Salary Register', 'PF Register', 'Attendance Report', 'Leave Report', 'TDS Report', 'Bank Advice', 'Cost Analysis', 'Headcount'].map((r, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white border border-[#E7E2D8] flex items-center gap-2 hover:bg-[#FDF8E8] transition-colors cursor-pointer">
                          <FileText size={12} className="text-[#9C9C9C]" />
                          <span className="text-[11px] text-[#2B2B2B] font-medium">{r}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#9C9C9C] text-center mt-2">Export to Excel, PDF, CSV • Schedule auto-delivery</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => { setPreviewScreen(null); navigate('/register'); }} className="mt-6 w-full py-3.5 rounded-full bg-[#2B2B2B] text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Get This Feature — Start Free Trial
            </button>
          </div>
        </div>
      )}


      {/* ===== HERO DASHBOARD SECTION ===== */}
      <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <p className="text-sm text-[#9C9C9C] mb-2 font-medium">Your HR command center</p>
            <h1 className="text-4xl lg:text-[58px] font-semibold text-[#2B2B2B] leading-[1.1] tracking-tight">Stop managing payroll.<br/><span className="text-[#9C9C9C]">Start automating it.</span></h1>
            <p className="text-base text-[#9C9C9C] mt-4 max-w-lg">Process salaries, file compliance, track attendance — all in 60 seconds. No spreadsheets. No errors. No stress.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => navigate('/register')} className="px-7 py-3.5 rounded-full bg-[#2B2B2B] text-white text-sm font-semibold hover:scale-105 active:scale-95 transition-transform shadow-lg">Start Free — No Card Needed</button>
              <button onClick={() => navigate('/login')} className="px-6 py-3.5 rounded-full border-2 border-[#E7E2D8] text-[#2B2B2B] text-sm font-medium hover:bg-white transition-colors">Watch 2-Min Demo</button>
            </div>
          </div>
          <div className="flex gap-8 mt-8 lg:mt-0">
            {[{ icon: Users, num: '248', label: 'Employees' }, { icon: Briefcase, num: '₹24.8L', label: 'Monthly Cost' }, { icon: Rocket, num: '100%', label: 'Compliance' }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E7E2D8] flex items-center justify-center mx-auto mb-2 shadow-sm"><s.icon size={18} className="text-[#2B2B2B]" /></div>
                <p className="text-2xl font-bold text-[#2B2B2B]">{s.num}</p>
                <p className="text-[11px] text-[#9C9C9C]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Progress Row */}
        <div className="flex flex-wrap gap-4 mb-8">
          {[{ label: 'Attendance Today', pct: 92, color: '#2B2B2B' }, { label: 'Payroll Processed', pct: 100, color: '#F3CC4D' }, { label: 'Leave Approved', pct: 78, color: '#2B2B2B' }, { label: 'Pending Actions', pct: 15, color: '#9C9C9C' }].map((kpi, i) => (
            <div key={i} className="flex-1 min-w-[140px]">
              <p className="text-[11px] text-[#9C9C9C] mb-2 font-medium">{kpi.label}</p>
              <div className="h-8 rounded-full bg-white border border-[#E7E2D8] overflow-hidden relative shadow-sm">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${kpi.pct}%`, background: kpi.color }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold" style={{ color: kpi.pct > 50 ? '#fff' : '#2B2B2B' }}>{kpi.pct}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Employee Spotlight */}
          <div className="lg:col-span-3 rounded-[28px] overflow-hidden relative h-[340px] shadow-sm border border-[#E7E2D8]">
            <img src="/images/deepanshu.jpg" alt="Deepanshu Verma" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 40%, rgba(15,23,42,0.9))' }} />
            <div className="absolute top-4 left-4"><span className="px-3 py-1 rounded-full text-[10px] font-bold text-[#2B2B2B] bg-[#F3CC4D]"><Award size={10} className="inline mr-1" />EMPLOYEE OF THE MONTH</span></div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-white font-semibold text-lg">Deepanshu Verma</p>
              <p className="text-white/70 text-sm">Founder & CEO</p>
              <p className="text-white/50 text-xs mt-1">0 LOP • 100% Attendance • Top Performer</p>
            </div>
          </div>

          {/* Payroll Activity */}
          <div className="lg:col-span-3 rounded-[28px] bg-white p-6 h-[340px] flex flex-col shadow-sm border border-[#E7E2D8]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#2B2B2B] text-sm">Payroll Activity</h3>
              <button className="w-7 h-7 rounded-full bg-[#F5F1E6] flex items-center justify-center hover:bg-[#E7E2D8] transition-colors"><TrendingUp size={13} className="text-[#9C9C9C]" /></button>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[38px] font-bold text-[#2B2B2B] leading-none">₹24.8L</p>
              <p className="text-sm text-[#9C9C9C] mt-1.5">Processed this month</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">↑ 12% vs last month</p>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[40, 55, 35, 70, 50, 65, 80, 60, 72, 85, 55, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-full transition-all hover:opacity-100" style={{ height: `${h}%`, background: i === 11 ? '#F3CC4D' : '#2B2B2B', opacity: i === 11 ? 1 : 0.12 + (h / 250) }} />
              ))}
            </div>
            <div className="flex justify-between mt-2"><span className="text-[10px] text-[#9C9C9C]">Jan</span><span className="text-[10px] text-[#F3CC4D] font-semibold">Dec ★</span></div>
          </div>

          {/* Compliance Timer */}
          <div className="lg:col-span-3 rounded-[28px] bg-white p-6 h-[340px] flex flex-col items-center shadow-sm border border-[#E7E2D8]">
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="font-semibold text-[#2B2B2B] text-sm">Next Deadline</h3>
              <button className="w-7 h-7 rounded-full bg-[#F5F1E6] flex items-center justify-center hover:bg-[#E7E2D8] transition-colors"><Clock size={13} className="text-[#9C9C9C]" /></button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E7E2D8" strokeWidth="5" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#F3CC4D" strokeWidth="5" strokeDasharray="264" strokeDashoffset="66" strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#2B2B2B]">05</span>
                  <span className="text-[11px] text-[#9C9C9C]">Days Left</span>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-[#2B2B2B]">PF ECR Filing</p>
            <p className="text-xs text-[#9C9C9C] mt-1">Due: 15th June 2026</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">Auto-generated & ready to file</p>
          </div>

          {/* Task Panel (Dark) */}
          <div className="lg:col-span-3 rounded-[28px] p-6 h-auto lg:h-[540px] lg:row-span-2 flex flex-col" style={{ background: '#2B2B2B' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm">Compliance</h3>
              <span className="text-3xl font-bold text-[#F3CC4D]">92%</span>
            </div>
            <div className="flex gap-1 mb-5">
              <div className="flex-[3] h-2 rounded-full bg-[#F3CC4D]" /><div className="flex-[1] h-2 rounded-full bg-white/20" />
            </div>
            <p className="text-white/40 text-xs mb-1">Pending Actions</p>
            <p className="text-white text-lg font-semibold mb-4">3 of 8 remaining</p>
            <div className="flex-1 space-y-3.5 overflow-y-auto">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${t.done ? 'bg-[#F3CC4D]' : 'border-2 border-white/20 group-hover:border-[#F3CC4D]'}`}>
                    {t.done && <Check size={12} className="text-[#2B2B2B]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${t.done ? 'text-white/40 line-through' : 'text-white group-hover:text-[#F3CC4D]'} transition-colors`}>{t.title}</p>
                    <p className="text-[10px] text-white/30">{t.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/register')} className="mt-5 w-full py-3.5 rounded-full bg-[#F3CC4D] text-[#2B2B2B] text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Automate This → Free Trial
            </button>
          </div>


          {/* Accordion Panel */}
          <div className="lg:col-span-3 rounded-[28px] bg-white p-5 shadow-sm border border-[#E7E2D8]">
            <h3 className="font-semibold text-[#2B2B2B] text-sm mb-3">Quick Access</h3>
            {accordionData.map((item, i) => (
              <div key={i} className="border-b border-[#E7E2D8] last:border-0">
                <button onClick={() => setExpandedAccordion(expandedAccordion === item.title ? '' : item.title)} className="w-full flex items-center justify-between py-3 group">
                  <span className="text-sm text-[#2B2B2B] group-hover:text-[#F3CC4D] transition-colors">{item.title}</span>
                  <ChevronDown size={14} className={`text-[#9C9C9C] transition-transform duration-200 ${expandedAccordion === item.title ? 'rotate-180' : ''}`} />
                </button>
                {expandedAccordion === item.title && (
                  <div className="pb-3 animate-slideDown">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F1E6]">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E7E2D8] flex items-center justify-center flex-shrink-0">
                        <Laptop size={16} className="text-[#9C9C9C]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-[#2B2B2B]">{item.content}</p>
                        <p className="text-[10px] text-[#F3CC4D] font-semibold mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-6 rounded-[28px] bg-white p-6 shadow-sm border border-[#E7E2D8]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#9C9C9C]">May</span>
                <span className="text-sm font-semibold text-[#2B2B2B]">June 2026</span>
                <span className="text-sm text-[#9C9C9C]">July</span>
              </div>
              <button className="px-3 py-1.5 rounded-full bg-[#F5F1E6] text-xs font-medium text-[#2B2B2B] border border-[#E7E2D8] hover:bg-[#E7E2D8] transition-colors">This Week</button>
            </div>
            <div className="grid grid-cols-6 gap-3 mb-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] text-[#9C9C9C] font-medium">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-3 rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform" style={{ background: '#2B2B2B' }}>
                <p className="text-white text-sm font-medium">Monthly Payroll Review</p>
                <p className="text-white/50 text-xs mt-1">Finalize June salaries</p>
                <div className="flex mt-3 -space-x-2">
                  {[0,1,2].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-[#2B2B2B]" style={{ background: ['#F3CC4D', '#0ea5e9', '#10b981'][i] }} />)}
                </div>
              </div>
              <div className="col-span-3 rounded-2xl p-4 bg-white border border-[#E7E2D8] cursor-pointer hover:scale-[1.02] transition-transform hover:shadow-md">
                <p className="text-[#2B2B2B] text-sm font-medium">Compliance Audit</p>
                <p className="text-[#9C9C9C] text-xs mt-1">PF & ESI verification</p>
                <div className="flex mt-3 -space-x-2">
                  {[0,1].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ background: ['#F3CC4D', '#ef4444'][i] }} />)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[{ t: 'Tax Filing', s: '24Q Quarterly' }, { t: 'New Joiners', s: '3 onboarding' }, { t: 'Salary Day', s: '1st July' }].map((c, i) => (
                <div key={i} className="rounded-xl p-3 bg-[#F5F1E6] border border-[#E7E2D8] cursor-pointer hover:bg-[#E7E2D8] transition-colors">
                  <p className="text-[#2B2B2B] text-xs font-medium">{c.t}</p>
                  <p className="text-[#9C9C9C] text-[10px] mt-0.5">{c.s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* ===== FEATURES SECTION ===== */}
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#2B2B2B] text-[#F3CC4D] text-xs font-semibold mb-4">WHY 500+ BUSINESSES CHOSE US</span>
          <h2 className="text-3xl lg:text-[44px] font-semibold text-[#2B2B2B] tracking-tight leading-tight">Everything greytHR & Keka charge extra for.<br/><span className="text-[#9C9C9C]">We include it all.</span></h2>
          <p className="text-base text-[#9C9C9C] mt-4 max-w-lg mx-auto">AI anomaly detection, WhatsApp payslips, employee chatbot — features no competitor offers. All in one platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className={`group rounded-[24px] p-6 bg-gradient-to-b ${f.gradient} border border-[#E7E2D8] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E7E2D8] flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <f.icon size={22} className="text-[#2B2B2B]" />
              </div>
              <h3 className="text-base font-semibold text-[#2B2B2B] mb-2">{f.title}</h3>
              <p className="text-sm text-[#9C9C9C] leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#2B2B2B] opacity-0 group-hover:opacity-100 transition-opacity">
                See it in action <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#9C9C9C]">Trusted by teams at</p>
          <div className="flex justify-center gap-8 mt-4 opacity-40">
            {['TechCorp', 'StartupXYZ', 'FinanceHub', 'RetailPro', 'HealthFirst'].map(c => (
              <span key={c} className="text-sm font-semibold text-[#2B2B2B]">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FAQ + CTA ===== */}
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-stretch">
          {/* CTA */}
          <div className="rounded-[28px] p-10 lg:p-14 flex flex-col justify-center" style={{ background: '#2B2B2B' }}>
            <span className="inline-block px-3 py-1 rounded-full bg-[#F3CC4D] text-[#2B2B2B] text-[10px] font-bold mb-6 w-fit">LIMITED: 14-DAY FREE TRIAL</span>
            <h2 className="text-3xl lg:text-[42px] font-semibold text-white leading-[1.1] tracking-tight mb-4">Your payroll is costing you<br/><span className="text-[#F3CC4D]">₹50,000/month</span> in errors.</h2>
            <p className="text-white/50 text-base mb-8">Manual calculations. Missed deadlines. Compliance penalties. One wrong TDS deduction costs more than our annual plan.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/register')} className="px-8 py-4 rounded-full bg-[#F3CC4D] text-[#2B2B2B] font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-lg">
                Fix It Now — Start Free
              </button>
              <button onClick={() => navigate('/login')} className="px-6 py-4 rounded-full border border-white/20 text-white font-medium text-sm hover:bg-white/5 transition-colors">
                See Pricing
              </button>
            </div>
            <p className="text-white/30 text-xs mt-4">No credit card • Setup in 24 hours • Cancel anytime</p>
          </div>

          {/* FAQ */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-[#2B2B2B] mb-2">Frequently Asked</h3>
            {faqs.map((faq, i) => (
              <div key={i} onClick={() => setFaqActive(faqActive === i ? -1 : i)} className={`rounded-2xl py-4 px-5 cursor-pointer transition-all duration-200 border ${faqActive === i ? 'bg-white border-[#E7E2D8] shadow-md' : 'bg-white/50 border-[#E7E2D8]/50 hover:bg-white hover:border-[#E7E2D8]'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#2B2B2B] pr-4">{faq.q}</span>
                  {faqActive === i ? <ChevronUp size={16} className="text-[#F3CC4D] flex-shrink-0" /> : <ChevronDown size={16} className="text-[#9C9C9C] flex-shrink-0" />}
                </div>
                {faqActive === i && <p className="mt-3 text-sm text-[#9C9C9C] leading-relaxed animate-slideDown">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#E7E2D8] mt-8">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#2B2B2B] flex items-center justify-center"><span className="text-[#F3CC4D] font-bold text-xs">G2</span></div>
                <span className="font-semibold text-[#2B2B2B]">Go2-Payroll</span>
              </div>
              <p className="text-sm text-[#9C9C9C] leading-relaxed">Complete HRMS & Payroll for Indian businesses. From 5 to 5000 employees.</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#2B2B2B] text-sm mb-4">Product</h4>
              <ul className="space-y-2.5">{['Payroll', 'Attendance', 'Leave', 'Compliance', 'Reports', 'AI Insights'].map(l => <li key={l}><a href="#" className="text-sm text-[#9C9C9C] hover:text-[#2B2B2B] transition-colors">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#2B2B2B] text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">{['About', 'Pricing', 'Blog', 'Careers', 'Contact'].map(l => <li key={l}><a href="#" className="text-sm text-[#9C9C9C] hover:text-[#2B2B2B] transition-colors">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#2B2B2B] text-sm mb-4">Start Free Trial</h4>
              <p className="text-sm text-[#9C9C9C] mb-3">Get payroll running in 24 hours.</p>
              <button onClick={() => navigate('/register')} className="w-full py-3 rounded-full bg-[#2B2B2B] text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">Get Started →</button>
            </div>
          </div>
          <div className="border-t border-[#E7E2D8] pt-6 flex flex-col md:flex-row justify-between text-xs text-[#9C9C9C]">
            <span>© 2026 Go2-Payroll. All rights reserved.</span>
            <span>Built with ❤️ by Go2-BillingSoftware Team</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
