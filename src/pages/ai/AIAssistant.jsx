import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, AlertTriangle, TrendingDown, Calculator, Loader2, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { aiAPI } from '../../services/api';

/* ─── Constants ─── */

const TABS = [
  { id: 'chat', label: 'Chat', icon: Bot },
  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
  { id: 'tax', label: 'Tax Optimizer', icon: Calculator },
  { id: 'attrition', label: 'Attrition Risk', icon: TrendingDown },
];

const FALLBACK_RESPONSES = [
  {
    test: (m) => m.includes('hi') || m.includes('hello') || m.includes('hey'),
    reply:
      'Hello! 👋 I\'m your Go2-Payroll HR assistant. I can help you with leave policies, payslips, attendance, onboarding, expenses, and more. What would you like to know?',
  },
  {
    test: (m) => m === 'help' || m.includes('what can you') || m.includes('topics'),
    reply:
      'I can help you with: 📋 Leave & Vacation — balances, policies, how to apply\n💰 Salary & Payslips — view payslips, salary structure, CTC breakdown\n⏱ Attendance & Punch — check-in/out, IP vs GPS, regularisation\n🚀 Onboarding & Joining — checklist, documents needed\n🧾 Expense & Reimbursement — how to submit claims\n📖 Policies & Handbook — where to find HR policies\n\nJust ask me anything!',
  },
  {
    test: (m) => m.includes('leave') || m.includes('vacation') || m.includes('holiday'),
    reply:
      'You currently have 8 days of Casual Leave and 10 days of Earned Leave remaining. To apply for leave: ESS Dashboard → Leave → Apply Leave. You can also check the holiday calendar under Holidays menu — next public holidays are Independence Day (Aug 15), Gandhi Jayanti (Oct 2), and Diwali (Oct 20).',
  },
  {
    test: (m) => m.includes('salary') || m.includes('payslip') || m.includes('pay') || m.includes('ctc'),
    reply:
      'Your latest payslip for May 2026 shows Net Pay: ₹68,500 (Basic: ₹35,000, HRA: ₹14,000, Allowances: ₹19,500). To view or download payslips: ESS Dashboard → Payslips. Your CTC breakdown and salary structure are also available there. For salary revision requests, raise a ticket via ESS → Raise a Request.',
  },
  {
    test: (m) => m.includes('attendance') || m.includes('punch') || m.includes('check in') || m.includes('check-in'),
    reply:
      'To mark attendance: ESS Dashboard → Attendance → Check In/Out. The system supports both IP-based (office network) and GPS-based (field) punch. Standard hours are 9am–6pm. If you missed a punch, use Attendance → Regularisation to submit a correction — your manager will approve within 24 hours.',
  },
  {
    test: (m) => m.includes('onboard') || m.includes('joining') || m.includes('new employee') || m.includes('document'),
    reply:
      'Onboarding checklist includes: ✅ Submit photo ID, address proof, educational certificates\n✅ Complete bank account details\n✅ Sign offer letter and NDA\n✅ IT assets allotment\n✅ PF & ESI nominations\n\nAll onboarding tasks are tracked in ESS → My Onboarding. Contact hr@company.com for any joining-related queries.',
  },
  {
    test: (m) => m.includes('expense') || m.includes('reimbursement') || m.includes('claim'),
    reply:
      'To submit an expense claim: Reimbursements → Submit Claim → fill in category, amount, date, and bill number. Attach supporting receipts. Claims must be submitted within 30 days of incurring the expense. Approved claims are reimbursed with the next payroll cycle.',
  },
  {
    test: (m) => m.includes('policy') || m.includes('rules') || m.includes('handbook'),
    reply:
      'HR policies are available under My Documents → Company Policies. Key policies: Leave Policy (12 CL + 12 SL per year), Attendance (9am–6pm with 30-min grace), Expense Reimbursement (submit within 30 days), Work from Home (up to 2 days/week with manager approval). For the full employee handbook, contact HR.',
  },
  {
    test: (m) => m.includes('wfh') || m.includes('work from home') || m.includes('remote'),
    reply:
      'To request WFH: ESS → Raise a Request → WFH Request. Fill in dates and reason. Your manager will approve within 24 hours. WFH is allowed up to 2 days/week as per the current policy. Extended remote work requires HR approval.',
  },
];

const DEFAULT_REPLY =
  "I'll look into that for you. For complex HR queries, please contact hr@company.com or raise a ticket through ESS → Raise a Request. You can also type 'help' to see all topics I can assist with.";

const getFallback = (msg) => {
  const lower = msg.toLowerCase();
  const match = FALLBACK_RESPONSES.find((f) => f.test(lower));
  return match ? match.reply : DEFAULT_REPLY;
};

const INITIAL_MESSAGES = [
  {
    id: 1,
    from: 'ai',
    text: "Hi! 👋 I'm your HR assistant powered by Go2-Payroll AI. Ask me anything about leave, payslips, attendance, onboarding, expenses, or company policies.",
  },
  {
    id: 2,
    from: 'ai',
    text: "Try asking: 'What's my leave balance?', 'How do I submit an expense claim?', 'How does punch in/out work?', or type 'help' to see all topics.",
  },
];

const QUICK_CHIPS = ['Leave Balance', 'My Payslip', 'Attendance / Punch', 'Submit Expense', 'Onboarding Docs', 'HR Policies', 'Help'];

const INITIAL_ANOMALIES = [
  {
    id: 1,
    severity: 'HIGH',
    color: 'red',
    name: 'Rahul Verma',
    description: 'Salary 3.2× higher than last month',
    detail: 'Net pay ₹45,000 → ₹1,44,000. Possible: backdated revision, bonus included.',
  },
  {
    id: 2,
    severity: 'MEDIUM',
    color: 'amber',
    name: 'Priya Sharma',
    description: 'No PF deduction',
    detail: 'Was PF exempt last month, deduction should resume.',
  },
  {
    id: 3,
    severity: 'LOW',
    color: 'green',
    name: 'Amit Kumar',
    description: 'New bank account',
    detail: 'Payment to account ending 4321 vs usual 7890.',
  },
];

const ATTRITION_MOCK = [
  {
    initials: 'RV',
    dept: 'Engineering',
    risk: 78,
    factors: ['No Raise 14mo', 'High Leave Usage', 'Low Engagement'],
    daysSinceRaise: 420,
    lastLeave: '45d ago',
  },
  {
    initials: 'AS',
    dept: 'Design',
    risk: 65,
    factors: ['No Promotion 2yr', 'Salary Stagnation'],
    daysSinceRaise: 360,
    lastLeave: '12d ago',
  },
  {
    initials: 'MK',
    dept: 'HR',
    risk: 42,
    factors: ['Below Market Salary'],
    daysSinceRaise: 180,
    lastLeave: '5d ago',
  },
  {
    initials: 'VJ',
    dept: 'Engineering',
    risk: 35,
    factors: ['Long Commute'],
    daysSinceRaise: 90,
    lastLeave: '20d ago',
  },
  {
    initials: 'NP',
    dept: 'Finance',
    risk: 22,
    factors: [],
    daysSinceRaise: 30,
    lastLeave: '8d ago',
  },
];

const DEPT_CHART_DATA = [
  { dept: 'Engineering', high: 3, medium: 1, low: 0 },
  { dept: 'HR', high: 1, medium: 1, low: 0 },
  { dept: 'Design', high: 0, medium: 1, low: 1 },
  { dept: 'Finance', high: 0, medium: 0, low: 1 },
];

const DRIVERS_DATA = [
  { driver: 'No Salary Growth', count: 8 },
  { driver: 'Limited Promotions', count: 6 },
  { driver: 'Work-Life Balance', count: 4 },
  { driver: 'Manager Issues', count: 3 },
  { driver: 'Better Opportunity', count: 2 },
];

/* ─── Chat Tab ─── */

function ChatTab() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText) return;
    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', text: userText }]);
    setTyping(true);
    await new Promise((r) => setTimeout(r, 800));
    let reply = getFallback(userText);
    try {
      const res = await aiAPI.chatbot({ message: userText });
      if (res?.data?.answer) reply = res.data.answer;
    } catch (_) {}
    setTyping(false);
    setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'ai', text: reply }]);
  };

  return (
    <div className="flex flex-col" style={{ height: '600px' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#F5F1E6' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.from === 'ai' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#F3CC4D', color: '#2B2B2B' }}
              >
                G2
              </div>
            )}
            <div
              className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={
                msg.from === 'ai'
                  ? {
                      background: '#fff',
                      color: '#2B2B2B',
                      borderBottomLeftRadius: 4,
                      border: '1px solid #E7E2D8',
                    }
                  : { background: '#F3CC4D', color: '#2B2B2B', borderBottomRightRadius: 4 }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: '#F3CC4D', color: '#2B2B2B' }}
            >
              G2
            </div>
            <div
              className="px-4 py-3 rounded-2xl"
              style={{
                background: '#fff',
                border: '1px solid #E7E2D8',
                borderBottomLeftRadius: 4,
              }}
            >
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#9C9C9C', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t" style={{ borderColor: '#E7E2D8', background: '#fff' }}>
        {/* Quick action chips */}
        <div className="flex gap-2 mb-2 flex-wrap">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="text-xs px-3 py-1 rounded-full border transition-colors hover:opacity-80"
              style={{ borderColor: '#F3CC4D', color: '#2B2B2B', background: '#FFF8E1' }}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2 rounded-full text-sm outline-none border"
            style={{ borderColor: '#E7E2D8', background: '#F5F1E6', color: '#2B2B2B' }}
            placeholder="Ask me anything about HR..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={() => sendMessage()}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: '#F3CC4D' }}
          >
            <Send size={16} color="#2B2B2B" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Anomalies Tab ─── */

function AnomaliesTab() {
  const navigate = useNavigate();
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState(INITIAL_ANOMALIES);

  const analyze = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setAnalyzed(true);
  };

  const dismiss = (id) => setAnomalies((prev) => prev.filter((a) => a.id !== id));

  const severityStyle = (color) => {
    if (color === 'red') return { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' };
    if (color === 'amber') return { bg: '#FEF3C7', text: '#D97706', dot: '#D97706' };
    return { bg: '#D1FAE5', text: '#059669', dot: '#059669' };
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base" style={{ color: '#2B2B2B' }}>
            Payroll Anomaly Detection
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#9C9C9C' }}>
            AI-powered scan to detect irregularities in your last payroll run.
          </p>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: '#F3CC4D', color: '#2B2B2B' }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Analyzing...' : 'Analyze Last Payroll'}
        </button>
      </div>

      {analyzed && (
        <>
          {/* Summary strip */}
          <div
            className="flex flex-wrap gap-4 text-sm p-3 rounded-lg"
            style={{ background: '#F5F1E6', border: '1px solid #E7E2D8' }}
          >
            <span style={{ color: '#9C9C9C' }}>47 records checked</span>
            <span style={{ color: '#DC2626' }}>· {anomalies.length} anomalies</span>
            <span style={{ color: '#059669' }}>· 12 auto-resolved</span>
          </div>

          {/* Anomaly cards */}
          <div className="space-y-3">
            {anomalies.map((a) => {
              const s = severityStyle(a.color);
              return (
                <div
                  key={a.id}
                  className="rounded-xl p-4"
                  style={{ border: '1px solid #E7E2D8', background: '#fff' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 flex-shrink-0"
                        style={{ background: s.bg, color: s.text }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: s.dot }}
                        />
                        {a.severity}
                      </span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>
                          {a.name}
                        </p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#2B2B2B' }}>
                          {a.description}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#9C9C9C' }}>
                          {a.detail}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(a.id)}
                      className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
                    >
                      <X size={14} color="#9C9C9C" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate('/salary')}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: '#2B2B2B', color: '#fff' }}
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => dismiss(a.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium border"
                      style={{ borderColor: '#E7E2D8', color: '#9C9C9C' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
            {anomalies.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: '#9C9C9C' }}>
                All anomalies resolved.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Tax helpers ─── */

function calcOldRegimeTax(taxableIncome) {
  // FY 2024-25 Old Regime slabs (no rebate 87A applied separately)
  if (taxableIncome <= 250000) return 0;
  let tax = 0;
  if (taxableIncome > 250000) tax += Math.min(taxableIncome - 250000, 250000) * 0.05;
  if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.20;
  if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.30;
  // Rebate 87A: if taxable ≤ 500000, full rebate up to ₹12,500
  if (taxableIncome <= 500000) tax = Math.max(0, tax - 12500);
  // 4% cess
  tax = Math.round(tax * 1.04);
  return tax;
}

function calcNewRegimeTax(taxableIncome) {
  // FY 2024-25 New Regime slabs
  if (taxableIncome <= 300000) return 0;
  let tax = 0;
  if (taxableIncome > 300000) tax += Math.min(taxableIncome - 300000, 400000) * 0.05;
  if (taxableIncome > 700000) tax += Math.min(taxableIncome - 700000, 300000) * 0.10;
  if (taxableIncome > 1000000) tax += Math.min(taxableIncome - 1000000, 200000) * 0.15;
  if (taxableIncome > 1200000) tax += Math.min(taxableIncome - 1200000, 300000) * 0.20;
  if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
  // Rebate 87A (new regime): if taxable ≤ 700000, full rebate up to ₹25,000
  if (taxableIncome <= 700000) tax = Math.max(0, tax - 25000);
  // 4% cess
  tax = Math.round(tax * 1.04);
  return tax;
}

const fmt = (n) => '₹' + n.toLocaleString('en-IN');

/* ─── Tax Tab ─── */

function TaxTab() {
  const [ctc, setCtc] = useState(900000);
  const [ctcInput, setCtcInput] = useState('900000');
  const [declared80C, setDeclared80C] = useState(85000);
  const [declared80CInput, setDeclared80CInput] = useState('85000');
  const [hraMonthly, setHraMonthly] = useState(14000);
  const [hraInput, setHraInput] = useState('14000');
  const [declared80D, setDeclared80D] = useState(15000);
  const [declared80DInput, setDeclared80DInput] = useState('15000');

  // Old regime deductions
  const stdDed = 50000;
  const c80 = Math.min(declared80C, 150000);
  const hraExemption = Math.min(hraMonthly * 12, ctc * 0.1); // simplified
  const d80 = Math.min(declared80D, 25000);
  const oldTaxableIncome = Math.max(0, ctc - stdDed - c80 - hraExemption - d80);
  const oldTax = calcOldRegimeTax(oldTaxableIncome);

  // New regime deductions
  const newStdDed = 75000;
  const newTaxableIncome = Math.max(0, ctc - newStdDed);
  const newTax = calcNewRegimeTax(newTaxableIncome);

  const saving = Math.abs(oldTax - newTax);
  const betterRegime = oldTax <= newTax ? 'old' : 'new';

  const chartData = [
    { name: 'Old Regime', tax: oldTax, fill: '#F3CC4D' },
    { name: 'New Regime', tax: newTax, fill: '#2B2B2B' },
  ];

  const c80Pct = Math.min(100, Math.round((declared80C / 150000) * 100));
  const c80Remaining = Math.max(0, 150000 - declared80C);

  // Actionable tips based on which regime is better
  const tips = betterRegime === 'old'
    ? [
        c80Remaining > 0
          ? `Invest ${fmt(c80Remaining)} more in 80C instruments (ELSS, PPF, NSC) to fully utilise the ₹1,50,000 limit and reduce taxable income further.`
          : 'Your 80C is fully utilised. Consider NPS Tier 1 under 80CCD(1B) for an extra ₹50,000 deduction.',
        hraMonthly > 0
          ? 'Ensure rent receipts are submitted for maximum HRA exemption. Proper documentation prevents disallowance.'
          : 'If you are paying rent, declare HRA — it is one of the largest exemptions available under the old regime.',
        d80 < 25000
          ? `Increase health insurance premium to claim the full ₹25,000 under 80D (currently only ${fmt(declared80D)} declared).`
          : 'Consider including parents under 80D for an additional ₹25,000–₹50,000 deduction.',
      ]
    : [
        'Your income profile benefits from the New Regime\'s lower slab rates. No need to lock money in tax-saving instruments.',
        'The New Regime has fewer exemptions but simpler filing. Ensure your employer has marked you under the new regime for TDS.',
        'If your deductions grow significantly (e.g. home loan interest, higher 80C), re-evaluate the old regime next year.',
      ];

  function handleCtcBlur() {
    const v = parseInt(ctcInput.replace(/,/g, ''), 10);
    if (!isNaN(v) && v > 0) setCtc(v);
    else setCtcInput(String(ctc));
  }

  return (
    <div className="p-4 space-y-5 overflow-y-auto" style={{ maxHeight: '80vh' }}>
      <div>
        <h3 className="font-semibold text-base" style={{ color: '#2B2B2B' }}>
          Smart Tax Optimizer
        </h3>
        <p className="text-sm mt-0.5" style={{ color: '#9C9C9C' }}>
          Old vs New Regime comparison — FY 2024–25 Indian slabs with 4% cess.
        </p>
      </div>

      {/* Inputs */}
      <div
        className="rounded-xl p-4 grid grid-cols-2 gap-3"
        style={{ border: '1px solid #E7E2D8', background: '#fff' }}
      >
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#9C9C9C' }}>Annual CTC (₹)</label>
          <input
            type="text"
            className="w-full text-sm px-3 py-2 rounded-lg border outline-none font-semibold"
            style={{ borderColor: '#E7E2D8', color: '#2B2B2B', background: '#F5F1E6' }}
            value={ctcInput}
            onChange={e => setCtcInput(e.target.value)}
            onBlur={handleCtcBlur}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#9C9C9C' }}>80C Declared (₹)</label>
          <input
            type="text"
            className="w-full text-sm px-3 py-2 rounded-lg border outline-none font-semibold"
            style={{ borderColor: '#E7E2D8', color: '#2B2B2B', background: '#F5F1E6' }}
            value={declared80CInput}
            onChange={e => setDeclared80CInput(e.target.value)}
            onBlur={() => {
              const v = parseInt(declared80CInput.replace(/,/g, ''), 10);
              if (!isNaN(v) && v >= 0) setDeclared80C(Math.min(v, 150000));
              else setDeclared80CInput(String(declared80C));
            }}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#9C9C9C' }}>HRA Received / Month (₹)</label>
          <input
            type="text"
            className="w-full text-sm px-3 py-2 rounded-lg border outline-none font-semibold"
            style={{ borderColor: '#E7E2D8', color: '#2B2B2B', background: '#F5F1E6' }}
            value={hraInput}
            onChange={e => setHraInput(e.target.value)}
            onBlur={() => {
              const v = parseInt(hraInput.replace(/,/g, ''), 10);
              if (!isNaN(v) && v >= 0) setHraMonthly(v);
              else setHraInput(String(hraMonthly));
            }}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#9C9C9C' }}>80D (Health Ins.) (₹)</label>
          <input
            type="text"
            className="w-full text-sm px-3 py-2 rounded-lg border outline-none font-semibold"
            style={{ borderColor: '#E7E2D8', color: '#2B2B2B', background: '#F5F1E6' }}
            value={declared80DInput}
            onChange={e => setDeclared80DInput(e.target.value)}
            onBlur={() => {
              const v = parseInt(declared80DInput.replace(/,/g, ''), 10);
              if (!isNaN(v) && v >= 0) setDeclared80D(Math.min(v, 25000));
              else setDeclared80DInput(String(declared80D));
            }}
          />
        </div>
      </div>

      {/* Regime Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-4"
          style={{
            border: betterRegime === 'old' ? '2px solid #F3CC4D' : '1px solid #E7E2D8',
            background: betterRegime === 'old' ? '#FFFDF5' : '#fff',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>Old Regime</span>
            {betterRegime === 'old' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#F3CC4D', color: '#2B2B2B' }}>
                Saves more ✓
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#9C9C9C' }}>
            Taxable: {fmt(oldTaxableIncome)} (after Std Ded {fmt(stdDed)}, 80C {fmt(c80)}, HRA {fmt(Math.round(hraExemption))}, 80D {fmt(d80)})
          </p>
          <p className="text-2xl font-bold mt-3" style={{ color: '#2B2B2B' }}>
            {fmt(oldTax)}{' '}
            <span className="text-sm font-normal" style={{ color: '#9C9C9C' }}>/ year</span>
          </p>
          {betterRegime === 'old' && (
            <p className="text-xs mt-2 font-semibold" style={{ color: '#059669' }}>
              You save {fmt(saving)} vs New Regime
            </p>
          )}
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            border: betterRegime === 'new' ? '2px solid #F3CC4D' : '1px solid #E7E2D8',
            background: betterRegime === 'new' ? '#FFFDF5' : '#fff',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>New Regime</span>
            {betterRegime === 'new' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#F3CC4D', color: '#2B2B2B' }}>
                Saves more ✓
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#9C9C9C' }}>
            Taxable: {fmt(newTaxableIncome)} (only Std Ded {fmt(newStdDed)} allowed)
          </p>
          <p className="text-2xl font-bold mt-3" style={{ color: '#2B2B2B' }}>
            {fmt(newTax)}{' '}
            <span className="text-sm font-normal" style={{ color: '#9C9C9C' }}>/ year</span>
          </p>
          {betterRegime === 'new' && (
            <p className="text-xs mt-2 font-semibold" style={{ color: '#059669' }}>
              You save {fmt(saving)} vs Old Regime
            </p>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl p-4" style={{ border: '1px solid #E7E2D8', background: '#fff' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#2B2B2B' }}>Tax Comparison</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barCategoryGap="40%" margin={{ top: 4, right: 10, left: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9C9C9C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9C9C9C' }} tickFormatter={v => '₹' + (v / 1000) + 'k'} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="tax" name="Tax" radius={[4, 4, 0, 0]} barSize={48}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 80C Progress */}
      <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid #E7E2D8', background: '#fff' }}>
        <h4 className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>80C Investment Progress</h4>
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: '#9C9C9C' }}>
            <span>{fmt(declared80C)} utilized</span>
            <span>₹1,50,000 limit · {c80Pct}%</span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: '#E7E2D8' }}>
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{ background: c80Pct >= 100 ? '#059669' : '#F3CC4D', width: `${c80Pct}%` }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: c80Pct >= 100 ? '#059669' : '#9C9C9C' }}>
            {c80Pct >= 100 ? '80C limit fully utilised.' : `${fmt(c80Remaining)} remaining — invest more to reduce old regime tax.`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { label: 'ELSS Funds', amount: 'Market-linked', sub: '3yr lock-in, potential 12–15% returns' },
            { label: 'PPF', amount: '7.1% p.a.', sub: '15yr tenure, fully tax-free' },
            { label: 'NPS Tier 1', amount: '+₹50,000', sub: 'Extra under 80CCD(1B), beyond 80C' },
            { label: 'Tax-Saver FD', amount: '6.5–7.25%', sub: '5yr lock-in, fixed returns' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-3 text-xs" style={{ background: '#F5F1E6', border: '1px solid #E7E2D8' }}>
              <p className="font-semibold" style={{ color: '#2B2B2B' }}>{s.label}</p>
              <p className="font-bold mt-0.5" style={{ color: '#B8960A' }}>{s.amount}</p>
              <p className="mt-0.5" style={{ color: '#9C9C9C' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Tips */}
      <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid #E7E2D8', background: '#fff' }}>
        <h4 className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>
          Personalised Tips — {betterRegime === 'old' ? 'Old' : 'New'} Regime Recommended
        </h4>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs" style={{ color: '#2B2B2B' }}>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] mt-0.5"
                style={{ background: '#F3CC4D', color: '#2B2B2B' }}
              >
                {i + 1}
              </span>
              <p className="leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.setItem('taxRegimePreference', betterRegime);
          toast.success(`Tax preference saved: ${betterRegime === 'old' ? 'Old' : 'New'} Regime`);
        }}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: '#2B2B2B', color: '#F3CC4D' }}
      >
        Set {betterRegime === 'old' ? 'Old' : 'New'} Regime as Preference
      </button>
    </div>
  );
}

/* ─── Attrition Tab ─── */

function AttritionTab() {
  const [data, setData] = useState(ATTRITION_MOCK);

  useEffect(() => {
    aiAPI
      .attritionRisk()
      .then((res) => {
        if (res?.data?.length) setData(res.data);
      })
      .catch(() => {});
  }, []);

  const riskColor = (r) => (r > 70 ? '#DC2626' : r >= 40 ? '#D97706' : '#059669');
  const riskBg = (r) => (r > 70 ? '#FEE2E2' : r >= 40 ? '#FEF3C7' : '#D1FAE5');

  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="font-semibold text-base" style={{ color: '#2B2B2B' }}>
          Attrition Risk Analysis
        </h3>
        <p className="text-sm mt-0.5" style={{ color: '#9C9C9C' }}>
          ML-powered early warning system to identify flight risks.
        </p>
      </div>

      {/* Dept bar chart */}
      <div
        className="rounded-xl p-4"
        style={{ border: '1px solid #E7E2D8', background: '#fff' }}
      >
        <p className="text-sm font-semibold mb-3" style={{ color: '#2B2B2B' }}>
          Risk by Department
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={DEPT_CHART_DATA} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
            <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#9C9C9C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9C9C9C' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="high" name="High" fill="#DC2626" radius={[3, 3, 0, 0]} barSize={18} />
            <Bar dataKey="medium" name="Medium" fill="#F3CC4D" radius={[3, 3, 0, 0]} barSize={18} />
            <Bar dataKey="low" name="Low" fill="#059669" radius={[3, 3, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* High-risk table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E7E2D8' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr style={{ background: '#F5F1E6', fontSize: 11 }}>
                {['Employee', 'Dept', 'Risk', 'Factors', 'Since Raise', 'Last Leave'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-medium"
                    style={{ color: '#9C9C9C' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.initials}
                  style={{
                    background: i % 2 === 0 ? '#fff' : '#FAFAF8',
                    borderTop: '1px solid #E7E2D8',
                  }}
                >
                  <td className="px-3 py-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: '#F3CC4D', color: '#2B2B2B' }}
                    >
                      {row.initials}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: '#2B2B2B' }}>
                    {row.dept}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: riskBg(row.risk), color: riskColor(row.risk) }}
                    >
                      {row.risk}%
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {row.factors.map((f) => (
                        <span
                          key={f}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: '#F5F1E6',
                            color: '#9C9C9C',
                            border: '1px solid #E7E2D8',
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: '#9C9C9C' }}>
                    {row.daysSinceRaise}d
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: '#9C9C9C' }}>
                    {row.lastLeave}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key drivers horizontal bar */}
      <div
        className="rounded-xl p-4"
        style={{ border: '1px solid #E7E2D8', background: '#fff' }}
      >
        <p className="text-sm font-semibold mb-3" style={{ color: '#2B2B2B' }}>
          Key Attrition Drivers
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={DRIVERS_DATA}
            layout="vertical"
            barSize={14}
            margin={{ left: 10, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9C9C9C' }} allowDecimals={false} />
            <YAxis
              dataKey="driver"
              type="category"
              width={130}
              tick={{ fontSize: 11, fill: '#9C9C9C' }}
            />
            <Tooltip />
            <Bar dataKey="count" name="Employees" radius={[0, 3, 3, 0]}>
              {DRIVERS_DATA.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? '#DC2626' : i === 1 ? '#D97706' : '#F3CC4D'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#F5F1E6' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold" style={{ color: '#2B2B2B' }}>
            AI Assistant
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9C9C9C' }}>
            Powered by Go2-Payroll Intelligence Engine
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ border: '1px solid #E7E2D8', background: '#fff' }}
        >
          {/* Tab bar */}
          <div className="flex border-b" style={{ borderColor: '#E7E2D8', background: '#F5F1E6' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors flex-1 justify-center"
                  style={
                    active
                      ? {
                          color: '#2B2B2B',
                          borderBottom: '2px solid #F3CC4D',
                          background: '#fff',
                        }
                      : { color: '#9C9C9C', borderBottom: '2px solid transparent' }
                  }
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'anomalies' && <AnomaliesTab />}
          {activeTab === 'tax' && <TaxTab />}
          {activeTab === 'attrition' && <AttritionTab />}
        </div>
      </div>
    </div>
  );
}
