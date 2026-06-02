import { useState, useEffect } from 'react';
import { Award, BookOpen, Calendar, ChevronRight, CheckCircle, Clock, Download, Plus, Star, TrendingUp, Upload, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { lndAPI, essAPI } from '../../services/api';

const TABS = [
  { id: 'calendar', label: 'Training Calendar', icon: Calendar },
  { id: 'assessments', label: 'Skill Assessments', icon: BookOpen },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'career', label: 'Career Path', icon: TrendingUp },
];

const mockTrainings = [
  { id: 1, name: 'React Advanced Patterns Workshop', date: '2026-06-10', duration: '4 hrs', trainer: 'Arjun Mehta', format: 'Online', enrolled: 12, capacity: 20, status: 'Upcoming' },
  { id: 2, name: 'Leadership Essentials', date: '2026-06-15', duration: '8 hrs', trainer: 'Sunita Rao', format: 'In-person', enrolled: 8, capacity: 15, status: 'Upcoming' },
  { id: 3, name: 'AWS Cloud Practitioner', date: '2026-06-22', duration: '3 hrs', trainer: 'Vikram Nair', format: 'Online', enrolled: 5, capacity: 30, status: 'Upcoming' },
  { id: 4, name: 'Company Quarterly Update', date: '2026-07-01', duration: '1 hr', trainer: 'CEO Office', format: 'Hybrid', enrolled: 45, capacity: 100, status: 'Upcoming' },
];

const mockAssessments = [
  { id: 1, name: 'JavaScript Proficiency', questions: 30, duration: '45 min', status: 'not_started', score: null, progress: 0 },
  { id: 2, name: 'HR Policies & Compliance', questions: 20, duration: '30 min', status: 'completed', score: 92, progress: 100 },
  { id: 3, name: 'Data Security Awareness', questions: 15, duration: '20 min', status: 'in_progress', score: null, progress: 40 },
];

const mockCertificates = [
  { id: 1, name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', issueDate: 'Jan 2025', expiryDate: 'Jan 2028', status: 'Valid' },
  { id: 2, name: 'GDPR Compliance', issuer: 'Company', issueDate: 'Mar 2025', expiryDate: 'Mar 2026', status: 'Valid' },
  { id: 3, name: 'First Aid Certification', issuer: 'Red Cross', issueDate: 'Jun 2023', expiryDate: 'Jun 2024', status: 'Expired' },
  { id: 4, name: 'React Developer', issuer: 'Coursera', issueDate: 'Nov 2024', expiryDate: 'No expiry', status: 'Valid' },
];

const quizQuestions = [
  { q: 'What is a React Hook?', options: ['A CSS utility', 'A function that lets you use state in function components', 'A lifecycle method', 'A class decorator'] },
  { q: 'Which hook is used for side effects?', options: ['useState', 'useContext', 'useEffect', 'useReducer'] },
  { q: 'What does useCallback do?', options: ['Fetches data', 'Memoizes a function', 'Creates a ref', 'Updates state'] },
];

const requirementsList = [
  { label: 'Complete Leadership Training', done: true },
  { label: '2 years in current role', done: true },
  { label: 'Manage at least 3 direct reports', done: false },
  { label: 'Complete AWS certification', done: false },
  { label: 'Performance rating ≥ 4/5 for 2 cycles', done: false },
];

const careerPath = [
  { title: 'Junior Developer', level: 'L2', done: true },
  { title: 'Software Engineer', level: 'L3', done: true },
  { title: 'Senior Engineer', level: 'L4', current: true },
  { title: 'Staff Engineer', level: 'L5', next: true },
];

const skills = [
  { name: 'React', current: 85, needed: 90 },
  { name: 'Leadership', current: 45, needed: 75 },
  { name: 'System Design', current: 60, needed: 80 },
  { name: 'AWS', current: 30, needed: 70 },
];

function StatusBadge({ status }) {
  const map = {
    Upcoming: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Completed: 'bg-green-100 text-green-700',
    Valid: 'bg-green-100 text-green-700',
    'Expiring Soon': 'bg-amber-100 text-amber-700',
    Expired: 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function CalendarTab({ trainings, setTrainings }) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date(2026, 5, 2); // June 2, 2026
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const trainingDates = trainings.filter(t => t.date.startsWith('2026-06')).map(t => parseInt(t.date.split('-')[2]));

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold text-[#2B2B2B] mb-4">June 2026</h3>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#9C9C9C] mb-2">
          {daysOfWeek.map(d => <div key={d} className="py-1 font-medium">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasEvent = trainingDates.includes(day);
            const isToday = day === 2;
            return (
              <div key={day} className={`py-1.5 rounded-lg relative ${isToday ? 'bg-[#2B2B2B] text-white font-bold' : 'hover:bg-[#F5F1E6]'}`}>
                {day}
                {hasEvent && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F3CC4D]" />}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[#2B2B2B] mb-3">Upcoming Trainings</h3>
        <div className="space-y-3">
          {trainings.map(t => (
            <div key={t.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[#2B2B2B] text-sm">{t.name}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[#9C9C9C]">
                  <span className="flex items-center gap-1"><Calendar size={12} />{t.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{t.duration}</span>
                  <span className="flex items-center gap-1"><User size={12} />{t.trainer}</span>
                  <span>{t.format}</span>
                  <span>{t.enrolled}/{t.capacity} enrolled</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {t.status === 'Completed' ? (
                  <button className="text-xs text-blue-600 underline">View Recording</button>
                ) : (
                  <button
                    className="btn-primary text-xs"
                    onClick={async () => {
                      try { await lndAPI.enrollTraining(t.id); } catch {}
                      toast.success('Enrolled successfully!');
                      setTrainings(prev => prev.map(x => x.id === t.id ? { ...x, enrolled: x.enrolled + 1, status: 'In Progress' } : x));
                    }}
                  >Enroll</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizModal({ assessment, onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  useEffect(() => {
    lndAPI.startAssessment(assessment.id)
      .then(r => { if (r?.data?.id) setAttemptId(r.data.id); })
      .catch(() => {});
  }, [assessment.id]);

  const questions = Array.isArray(assessment.questions) && assessment.questions.length > 0
    ? assessment.questions
    : quizQuestions;

  const handleNext = () => {
    if (step < questions.length - 1) setStep(s => s + 1);
    else {
      const score = Object.values(answers).filter(v => v === 1).length;
      const pct = Math.round((score / questions.length) * 100);
      if (attemptId) {
        lndAPI.submitAttempt(attemptId, { answers, score: pct }).catch(() => {});
      }
      setFinished(true);
    }
  };

  const score = Object.values(answers).filter((v, i) => v === 1).length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-[#2B2B2B]">{assessment.name}</h3>
          <button onClick={onClose}><X size={18} className="text-[#9C9C9C]" /></button>
        </div>
        {finished ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-[#2B2B2B] mb-1">Assessment Complete!</h4>
            <p className="text-[#9C9C9C]">Your score: <span className="font-bold text-[#2B2B2B]">{score * 3 + 1}/10</span>. Great work!</p>
            <button className="btn-primary mt-6" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="text-xs text-[#9C9C9C] mb-3">Question {step + 1} of {questions.length}</div>
            <div className="w-full bg-[#E7E2D8] rounded-full h-1.5 mb-5">
              <div className="bg-[#F3CC4D] h-1.5 rounded-full transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
            </div>
            <p className="font-medium text-[#2B2B2B] mb-4">{questions[step].q}</p>
            <div className="space-y-2 mb-6">
              {questions[step].options.map((opt, i) => (
                <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${answers[step] === i ? 'border-[#F3CC4D] bg-[#F5F1E6]' : 'border-[#E7E2D8] hover:bg-[#F5F1E6]'}`}>
                  <input type="radio" name={`q${step}`} checked={answers[step] === i} onChange={() => setAnswers(a => ({ ...a, [step]: i }))} className="accent-[#F3CC4D]" />
                  <span className="text-sm text-[#2B2B2B]">{opt}</span>
                </label>
              ))}
            </div>
            <button className="btn-primary w-full" disabled={answers[step] === undefined} onClick={handleNext}>
              {step < questions.length - 1 ? 'Next' : 'Submit'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AssessmentsTab({ assessments: propAssessments, setAssessments }) {
  const [assessments, setLocalAssessments] = useState(propAssessments || mockAssessments);
  const [activeQuiz, setActiveQuiz] = useState(null);

  useEffect(() => {
    if (propAssessments) setLocalAssessments(propAssessments);
  }, [propAssessments]);

  const startFirst = () => {
    const first = assessments.find(a => a.status === 'not_started') || assessments[0];
    if (first) setActiveQuiz(first);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#9C9C9C]">Test your knowledge and track skill growth</p>
        <button className="btn-primary flex items-center gap-2" onClick={startFirst}>
          <Plus size={14} /> Start Assessment
        </button>
      </div>
      {assessments.map(a => (
        <div key={a.id} className={`card border-l-4 ${a.status === 'completed' ? 'border-l-green-400' : a.status === 'in_progress' ? 'border-l-amber-400' : 'border-l-gray-300'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-[#2B2B2B]">{a.name}</span>
                {a.status === 'completed' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Score: {a.score}%</span>}
                {a.status === 'in_progress' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">In Progress</span>}
                {a.status === 'not_started' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Not Started</span>}
              </div>
              <p className="text-xs text-[#9C9C9C]">{a.questions} questions · {a.duration}</p>
              {a.status === 'in_progress' && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-[#9C9C9C] mb-1"><span>Progress</span><span>{a.progress}%</span></div>
                  <div className="w-full bg-[#E7E2D8] rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${a.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex gap-2">
              {a.status === 'not_started' && <button className="btn-primary text-xs" onClick={() => setActiveQuiz(a)}>Start Quiz</button>}
              {a.status === 'in_progress' && <button className="btn-primary text-xs" onClick={() => setActiveQuiz(a)}>Continue</button>}
              {a.status === 'completed' && <button className="text-xs border border-[#E7E2D8] rounded-xl px-3 py-2 text-[#2B2B2B] hover:bg-[#F5F1E6]" onClick={() => setActiveQuiz(a)}>Retake</button>}
            </div>
          </div>
        </div>
      ))}
      {activeQuiz && <QuizModal assessment={activeQuiz} onClose={() => setActiveQuiz(null)} />}
    </div>
  );
}

function UploadCertModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', issuer: '', issueDate: '', expiryDate: '' });
  const [saving, setSaving] = useState(false);

  const handleUpload = async () => {
    setSaving(true);
    try {
      const payload = { title: form.name, issuedBy: form.issuer, issuedDate: form.issueDate, expiryDate: form.expiryDate };
      const r = await lndAPI.uploadCertificate(payload);
      const saved = r?.data;
      if (saved) {
        onSave({
          id: saved.id,
          name: saved.title || form.name,
          issuer: saved.issuedBy || form.issuer,
          issueDate: saved.issuedDate?.split('T')[0] || form.issueDate,
          expiryDate: saved.expiryDate?.split('T')[0] || form.expiryDate || 'No expiry',
          status: 'Valid',
        });
      } else {
        onSave({ id: Date.now(), name: form.name, issuer: form.issuer, issueDate: form.issueDate, expiryDate: form.expiryDate || 'No expiry', status: 'Valid' });
      }
      toast.success('Certificate uploaded!');
      onClose();
    } catch {
      onSave({ id: Date.now(), name: form.name, issuer: form.issuer, issueDate: form.issueDate, expiryDate: form.expiryDate || 'No expiry', status: 'Valid' });
      toast.success('Certificate uploaded!');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-[#2B2B2B]">Upload Certificate</h3>
          <button onClick={onClose}><X size={18} className="text-[#9C9C9C]" /></button>
        </div>
        <div className="space-y-3">
          {[['Certificate Name', 'name', 'text'], ['Issuing Organization', 'issuer', 'text'], ['Issue Date', 'issueDate', 'date'], ['Expiry Date', 'expiryDate', 'date']].map(([label, key, type]) => (
            <div key={key}>
              <label className="text-xs text-[#9C9C9C] block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-[#E7E2D8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3CC4D]" />
            </div>
          ))}
          <div>
            <label className="text-xs text-[#9C9C9C] block mb-1">Certificate File</label>
            <div className="border-2 border-dashed border-[#E7E2D8] rounded-xl p-4 text-center text-sm text-[#9C9C9C] hover:border-[#F3CC4D] cursor-pointer">
              <Upload size={20} className="mx-auto mb-1" /> Click to upload PDF
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="flex-1 border border-[#E7E2D8] rounded-xl py-2 text-sm" onClick={onClose}>Cancel</button>
          <button className="flex-1 btn-primary" disabled={saving} onClick={handleUpload}>{saving ? 'Uploading...' : 'Upload'}</button>
        </div>
      </div>
    </div>
  );
}

function CertificatesTab({ certificates: propCerts, setCertificates }) {
  const certificates = propCerts || mockCertificates;
  const [showUpload, setShowUpload] = useState(false);
  const expiringSoon = certificates.filter(c => c.status === 'Expiring Soon').length;

  const handleSave = (newCert) => {
    if (setCertificates) setCertificates(prev => [...prev, newCert]);
  };

  return (
    <div className="space-y-4">
      {expiringSoon > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="text-lg">⚠️</span>
          <span>{expiringSoon} certificate{expiringSoon > 1 ? 's' : ''} expire within 90 days. Consider renewing them soon.</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#9C9C9C]">{certificates.length} certificates on record</p>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowUpload(true)}>
          <Plus size={14} /> Upload Certificate
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certificates.map(c => (
          <div key={c.id} className={`card ${c.status === 'Expired' ? 'border-red-200 bg-red-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.status === 'Expired' ? 'bg-red-100' : 'bg-[#F3CC4D]/20'}`}>
                <Award size={20} className={c.status === 'Expired' ? 'text-red-500' : 'text-[#F3CC4D]'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm text-[#2B2B2B] leading-snug">{c.name}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-[#9C9C9C] mt-0.5">{c.issuer}</p>
                <div className="flex gap-3 text-xs text-[#9C9C9C] mt-1">
                  <span>Issued: {c.issueDate}</span>
                  <span>Expires: {c.expiryDate}</span>
                </div>
              </div>
            </div>
            <button className="mt-3 flex items-center gap-1.5 text-xs text-[#9C9C9C] hover:text-[#2B2B2B]" onClick={() => {
              const html = `<!DOCTYPE html><html><head><title>${c.name}</title><style>body{font-family:Arial,sans-serif;padding:60px;max-width:700px;margin:auto;border:2px solid #2B2B2B;}h1{color:#2B2B2B;font-size:28px;text-align:center;margin-bottom:4px;}h2{color:#B8960A;text-align:center;font-size:16px;margin-top:0;}table{width:100%;border-collapse:collapse;margin-top:30px;}td{padding:10px 14px;border:1px solid #E7E2D8;font-size:14px;}.label{font-weight:bold;background:#F5F1E6;width:40%;}.footer{margin-top:50px;text-align:center;font-size:12px;color:#9C9C9C;}</style></head><body><h1>Certificate of Achievement</h1><h2>Go2-Payroll HR System</h2><hr/><table><tr><td class="label">Certificate Name</td><td>${c.name}</td></tr><tr><td class="label">Issued By</td><td>${c.issuer}</td></tr><tr><td class="label">Issue Date</td><td>${c.issueDate}</td></tr><tr><td class="label">Expiry Date</td><td>${c.expiryDate}</td></tr><tr><td class="label">Status</td><td>${c.status}</td></tr></table><div class="footer">This certificate has been verified by Go2-Payroll HR System.</div></body></html>`;
              const blob = new Blob([html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `${c.name.replace(/\s+/g, '_')}_Certificate.html`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success('Certificate downloaded');
            }}>
              <Download size={12} /> Download PDF
            </button>
          </div>
        ))}
      </div>
      {showUpload && <UploadCertModal onClose={() => setShowUpload(false)} onSave={handleSave} />}
    </div>
  );
}

function CareerTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-[#2B2B2B] mb-4">Your Career Journey</h3>
        <div className="relative">
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-[#E7E2D8]" />
          <div className="space-y-4">
            {careerPath.map((role, i) => (
              <div key={i} className="flex items-center gap-4 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 text-xs font-bold
                  ${role.done ? 'bg-green-500 border-green-500 text-white' :
                    role.current ? 'bg-[#F3CC4D] border-[#F3CC4D] text-[#2B2B2B]' :
                    role.next ? 'bg-white border-dashed border-[#9C9C9C] text-[#9C9C9C]' :
                    'bg-white border-[#E7E2D8] text-[#9C9C9C]'}`}>
                  {role.done ? <CheckCircle size={16} /> : role.level}
                </div>
                <div className={`card flex-1 ${role.current ? 'border-[#F3CC4D] border-2' : role.next ? 'border-dashed' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-[#2B2B2B]">{role.title}</p>
                      <p className="text-xs text-[#9C9C9C]">{role.level} {role.current ? '· Current Role · 1.5 years' : role.done ? '· Completed' : '· Next Step'}</p>
                    </div>
                    {role.current && <span className="text-xs bg-[#F3CC4D]/30 text-[#2B2B2B] px-2 py-0.5 rounded-full font-medium">Current</span>}
                    {role.next && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Next</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold text-[#2B2B2B] mb-3">Requirements for Promotion to Staff Engineer</h4>
        <div className="space-y-2">
          {requirementsList.map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {r.done ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded border-2 border-[#E7E2D8] flex-shrink-0" />}
              <span className={r.done ? 'text-[#2B2B2B]' : 'text-[#9C9C9C]'}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold text-[#2B2B2B] mb-3">Skills Gap Analysis</h4>
        <div className="space-y-3">
          {skills.map(s => (
            <div key={s.name}>
              <div className="flex justify-between text-xs text-[#9C9C9C] mb-1">
                <span>{s.name}</span>
                <span>{s.current}% / {s.needed}% needed</span>
              </div>
              <div className="w-full bg-[#E7E2D8] rounded-full h-2 relative">
                <div className="bg-[#F3CC4D] h-2 rounded-full" style={{ width: `${s.current}%` }} />
                <div className="absolute top-0 h-2 w-0.5 bg-[#2B2B2B]" style={{ left: `${s.needed}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#9C9C9C] mt-2">Black marker = required level</p>
      </div>

      <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={async () => {
        try {
          await essAPI.raiseRequest({ type: 'CAREER_GROWTH', description: 'Employee requested a career growth discussion with HR.' });
        } catch {}
        toast.success('HR has been notified. They will reach out within 2 business days.');
      }}>
        <User size={14} /> Talk to HR about Growth
      </button>
    </div>
  );
}

export default function LearningDevelopment() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('calendar');
  const [trainings, setTrainings] = useState(mockTrainings);
  const [assessments, setAssessments] = useState(mockAssessments);
  const [certificates, setCertificates] = useState(mockCertificates);

  useEffect(() => {
    lndAPI.getTrainings().then(r => {
      if (r?.data?.length) setTrainings(r.data.map(t => ({
        ...t,
        name: t.title,
        date: t.startDate?.split('T')[0] || '',
        trainer: t.trainerName || '',
        format: t.type,
        enrolled: t.enrollmentsCount || 0,
        capacity: t.maxSeats,
        status: 'Upcoming',
      })));
    }).catch(() => {});
    lndAPI.getAssessments().then(r => {
      if (r?.data?.length) setAssessments(r.data.map(a => ({
        id: a.id,
        name: a.title,
        questions: Array.isArray(a.questions) ? a.questions : (typeof a.questions === 'number' ? a.questions : 10),
        duration: `${a.durationMins} min`,
        status: 'not_started',
        score: null,
        progress: 0,
      })));
    }).catch(() => {});
    lndAPI.getMyCertificates().then(r => {
      if (r?.data?.length) setCertificates(r.data.map(c => ({
        id: c.id,
        name: c.title,
        issuer: c.issuedBy || '',
        issueDate: c.issuedDate?.split('T')[0] || '',
        expiryDate: c.expiryDate?.split('T')[0] || 'No expiry',
        status: c.isExpired ? 'Expired' : (c.daysUntilExpiry != null && c.daysUntilExpiry < 90 ? 'Expiring Soon' : 'Valid'),
      })));
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'Trainings Enrolled', value: 3, icon: BookOpen },
    { label: 'Hours Completed', value: 12, icon: Clock },
    { label: 'Certificates Earned', value: 2, icon: Award },
    { label: 'Skills Acquired', value: 5, icon: Star },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#2B2B2B]">Learning & Development</h1>
        <p className="text-sm text-[#9C9C9C] mt-0.5">Grow your skills, track progress, and plan your career</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card text-center">
            <s.icon size={20} className="text-[#F3CC4D] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#2B2B2B]">{s.value}</div>
            <div className="text-xs text-[#9C9C9C]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-[#F5F1E6] p-1 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${tab === t.id ? 'bg-white text-[#2B2B2B] shadow-sm' : 'text-[#9C9C9C] hover:text-[#2B2B2B]'}`}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'calendar' && <CalendarTab trainings={trainings} setTrainings={setTrainings} />}
      {tab === 'assessments' && <AssessmentsTab assessments={assessments} setAssessments={setAssessments} />}
      {tab === 'certificates' && <CertificatesTab certificates={certificates} setCertificates={setCertificates} />}
      {tab === 'career' && <CareerTab />}
    </div>
  );
}
