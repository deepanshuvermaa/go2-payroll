import { useState, useMemo } from "react";
import {
  FileText, FileCheck, Award, DollarSign, Calculator, Shield,
  Download, Send, Eye, Edit, Plus, Search, X, ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";

const TABS = [
  { id: "generate", label: "Generate" },
  { id: "templates", label: "Templates" },
  { id: "archive", label: "Archive" },
];

const DOC_TYPES = [
  { id: "offer", title: "Offer Letter", desc: "Generate offer letters for new hires", icon: FileText, color: "bg-blue-100 text-blue-600" },
  { id: "appointment", title: "Appointment Letter", desc: "Formal appointment confirmation", icon: FileCheck, color: "bg-purple-100 text-purple-600" },
  { id: "experience", title: "Experience Letter", desc: "Relieving and experience letters", icon: Award, color: "bg-green-100 text-green-600" },
  { id: "salary", title: "Salary Certificate", desc: "Salary proof for various purposes", icon: DollarSign, color: "bg-amber-100 text-amber-600" },
  { id: "form16", title: "Form 16", desc: "Annual TDS certificate for employees", icon: Calculator, color: "bg-red-100 text-red-600" },
  { id: "noc", title: "NOC Letter", desc: "No objection certificate", icon: Shield, color: "bg-gray-100 text-gray-600" },
];

const EMPLOYEES = [
  { id: 1, name: "Rahul Verma", designation: "Senior Developer", department: "Engineering", joining: "2021-03-15", salary: 120000 },
  { id: 2, name: "Priya Sharma", designation: "HR Executive", department: "Human Resources", joining: "2022-07-01", salary: 65000 },
  { id: 3, name: "Anjali Singh", designation: "Designer", department: "Design", joining: "2023-01-10", salary: 75000 },
  { id: 4, name: "Vikram Joshi", designation: "DevOps Engineer", department: "Infrastructure", joining: "2020-11-20", salary: 140000 },
];

const MOCK_TEMPLATES = [
  { id: 1, name: "Standard Offer Letter", type: "Offer Letter", modified: "Jun 1, 2026", uses: 24 },
  { id: 2, name: "Probation Appointment", type: "Appointment Letter", modified: "May 15, 2026", uses: 12 },
  { id: 3, name: "Standard Experience Letter", type: "Experience Letter", modified: "Apr 20, 2026", uses: 8 },
  { id: 4, name: "Salary Certificate - Bank", type: "Salary Certificate", modified: "Jun 1, 2026", uses: 31 },
];

const MOCK_ARCHIVE = [
  { id: 1, date: "Jun 2, 2026", employee: "Rahul Verma", type: "Offer Letter", by: "HR Admin" },
  { id: 2, date: "Jun 1, 2026", employee: "Priya Sharma", type: "Salary Certificate", by: "HR Admin" },
  { id: 3, date: "May 30, 2026", employee: "Anjali Singh", type: "Experience Letter", by: "HR Manager" },
  { id: 4, date: "May 28, 2026", employee: "Vikram Joshi", type: "Form 16", by: "HR Admin" },
  { id: 5, date: "May 25, 2026", employee: "Rahul Verma", type: "NOC Letter", by: "HR Manager" },
  { id: 6, date: "May 20, 2026", employee: "Priya Sharma", type: "Appointment Letter", by: "HR Admin" },
  { id: 7, date: "May 18, 2026", employee: "Anjali Singh", type: "Salary Certificate", by: "HR Admin" },
  { id: 8, date: "May 15, 2026", employee: "Vikram Joshi", type: "Experience Letter", by: "HR Manager" },
  { id: 9, date: "May 10, 2026", employee: "Rahul Verma", type: "Form 16", by: "HR Admin" },
  { id: 10, date: "May 5, 2026", employee: "Priya Sharma", type: "Offer Letter", by: "HR Admin" },
];

function calcTenure(joining) {
  if (!joining) return "";
  const from = new Date(joining);
  const now = new Date();
  const months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return years > 0 ? `${years}y ${rem}m` : `${rem}m`;
}

function PreviewModal({ open, onClose, docType, employee, fields, letterDate }) {
  if (!open) return null;
  const today = letterDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const emp = employee || { name: "—", designation: "—", department: "—", joining: "—" };

  const bodyMap = {
    offer: `We are pleased to offer you the position of ${emp.designation} in the ${emp.department} department.\n\nCTC: ₹${fields?.ctc || "—"} per annum\nJoining Date: ${fields?.joiningDate || "—"}\nReporting To: ${fields?.reportingTo || "—"}`,
    appointment: `This is to confirm your appointment as ${emp.designation} in the ${emp.department} department.\n\nConfirmation Date: ${fields?.confirmDate || "—"}\nEmployment Type: ${fields?.empType || "—"}`,
    experience: `This is to certify that ${emp.name} was employed with us as ${emp.designation} in the ${emp.department} department.\n\nLast Working Day: ${fields?.lastDay || "—"}\nTenure: ${fields?.tenure || calcTenure(emp.joining)}\nReason: ${fields?.reason || "—"}`,
    salary: `This is to certify that ${emp.name} is employed with us as ${emp.designation} drawing a monthly salary of ₹${emp.salary?.toLocaleString() || "—"}.\n\nPurpose: ${fields?.purpose || "—"}`,
    form16: `This is to certify that TDS has been deducted for the Financial Year ${fields?.fy || "—"} for ${emp.name} as per Income Tax Act.`,
    noc: `This is to certify that we have no objection to ${emp.name} for ${fields?.purposeNoc || "—"}, Destination: ${fields?.destination || "—"}.`,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#E7E2D8]">
          <h2 className="font-semibold text-[#2B2B2B]">Document Preview</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F5F1E6] rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-8 font-mono text-sm text-[#2B2B2B] space-y-4">
          <div className="text-center border-b border-[#E7E2D8] pb-4">
            <div className="text-xl font-bold tracking-widest">COMPANY NAME</div>
            <div className="text-[#9C9C9C] text-xs mt-1">123 Corporate Park, Mumbai 400001 | hr@company.com</div>
          </div>
          <div className="text-right text-xs text-[#9C9C9C]">Date: {today}</div>
          <div><span className="font-semibold">To:</span> {emp.name}</div>
          <div><span className="font-semibold">Subject:</span> {DOC_TYPES.find(d => d.id === docType)?.title}</div>
          <div className="mt-4 whitespace-pre-line leading-relaxed">{bodyMap[docType] || "—"}</div>
          <div className="mt-8 pt-4 border-t border-[#E7E2D8]">
            <div className="font-semibold">HR Manager</div>
            <div className="text-[#9C9C9C]">Go2-Payroll Inc.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateTab() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split("T")[0]);
  const [fields, setFields] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const employee = EMPLOYEES.find(e => e.id === Number(selectedEmpId)) || null;

  const setField = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const handleDocSelect = (id) => {
    setSelectedDoc(id);
    setFields({});
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {DOC_TYPES.map(({ id, title, desc, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => handleDocSelect(id)}
            className={`text-left p-5 rounded-xl border-2 bg-white transition-all hover:shadow-md ${selectedDoc === id ? "border-[#F3CC4D] shadow-md" : "border-[#E7E2D8]"}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} mb-3`}>
              <Icon size={22} />
            </div>
            <div className="font-semibold text-[#2B2B2B] text-sm">{title}</div>
            <div className="text-xs text-[#9C9C9C] mt-1">{desc}</div>
          </button>
        ))}
      </div>

      {selectedDoc && (
        <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 space-y-4">
          <h3 className="font-semibold text-[#2B2B2B]">
            {DOC_TYPES.find(d => d.id === selectedDoc)?.title} — Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Employee</label>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]"
              >
                <option value="">Select employee…</option>
                {EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            {employee && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Designation</label>
                  <input readOnly value={employee.designation} className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm bg-[#F5F1E6]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Department</label>
                  <input readOnly value={employee.department} className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm bg-[#F5F1E6]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Joining Date</label>
                  <input readOnly value={employee.joining} className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm bg-[#F5F1E6]" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Date for Letter</label>
              <input type="date" value={letterDate} onChange={e => setLetterDate(e.target.value)}
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
            </div>

            {selectedDoc === "offer" && <>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">CTC (₹/year)</label>
                <input type="number" placeholder="e.g. 1200000" onChange={e => setField("ctc", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Joining Date</label>
                <input type="date" onChange={e => setField("joiningDate", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Reporting To</label>
                <input type="text" placeholder="Manager name" onChange={e => setField("reportingTo", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
            </>}

            {selectedDoc === "appointment" && <>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Confirmation Date</label>
                <input type="date" onChange={e => setField("confirmDate", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Employment Type</label>
                <select onChange={e => setField("empType", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]">
                  <option value="">Select…</option>
                  <option>Permanent</option>
                  <option>Contract</option>
                </select>
              </div>
            </>}

            {selectedDoc === "experience" && <>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Last Working Day</label>
                <input type="date" onChange={e => setField("lastDay", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Reason for Leaving</label>
                <select onChange={e => setField("reason", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]">
                  <option value="">Select…</option>
                  <option>Resignation</option>
                  <option>Better Opportunity</option>
                  <option>Personal Reasons</option>
                  <option>Contract End</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Tenure</label>
                <input readOnly value={employee ? calcTenure(employee.joining) : ""}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm bg-[#F5F1E6]" />
              </div>
            </>}

            {selectedDoc === "salary" && <>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Purpose</label>
                <select onChange={e => setField("purpose", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]">
                  <option value="">Select…</option>
                  <option>Bank Loan</option>
                  <option>Visa Application</option>
                  <option>Personal</option>
                </select>
              </div>
              {employee && (
                <div>
                  <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Monthly Salary</label>
                  <input readOnly value={`₹${employee.salary.toLocaleString()}`}
                    className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm bg-[#F5F1E6]" />
                </div>
              )}
            </>}

            {selectedDoc === "form16" && (
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Financial Year</label>
                <select onChange={e => setField("fy", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]">
                  <option value="">Select…</option>
                  <option>2025-26</option>
                  <option>2024-25</option>
                  <option>2023-24</option>
                </select>
              </div>
            )}

            {selectedDoc === "noc" && <>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Purpose</label>
                <input type="text" placeholder="Purpose of NOC" onChange={e => setField("purposeNoc", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Destination</label>
                <input type="text" placeholder="Country / City" onChange={e => setField("destination", e.target.value)}
                  className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
              </div>
            </>}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5F1E6] border border-[#E7E2D8] rounded-lg text-sm font-medium text-[#2B2B2B] hover:bg-[#E7E2D8] transition">
              <Eye size={15} /> Preview Document
            </button>
            <button onClick={() => toast.success("PDF generated and downloaded")}
              className="flex items-center gap-2 px-4 py-2 bg-[#F3CC4D] rounded-lg text-sm font-medium text-[#2B2B2B] hover:bg-yellow-400 transition">
              <Download size={15} /> Download PDF
            </button>
            <button onClick={() => toast.success("Sent to employee's registered email")}
              className="flex items-center gap-2 px-4 py-2 bg-[#2B2B2B] rounded-lg text-sm font-medium text-white hover:bg-black transition">
              <Send size={15} /> Send to Employee
            </button>
          </div>
        </div>
      )}

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        docType={selectedDoc}
        employee={employee}
        fields={fields}
        letterDate={new Date(letterDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
      />
    </div>
  );
}

function TemplatesTab() {
  const [showForm, setShowForm] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplType, setTplType] = useState("");
  const [tplContent, setTplContent] = useState("");

  const handleSave = () => {
    if (!tplName || !tplType) { toast.error("Name and type are required"); return; }
    toast.success("Template saved successfully");
    setShowForm(false);
    setTplName("");
    setTplType("");
    setTplContent("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-[#2B2B2B]">Document Templates</h3>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F3CC4D] rounded-lg text-sm font-medium hover:bg-yellow-400 transition">
          <Plus size={15} /> Create New Template
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E7E2D8] rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-sm text-[#2B2B2B]">New Template</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Template Name</label>
              <input type="text" value={tplName} onChange={e => setTplName(e.target.value)}
                placeholder="e.g. Standard Offer Letter"
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9C9C9C] mb-1">Document Type</label>
              <select value={tplType} onChange={e => setTplType(e.target.value)}
                className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D]">
                <option value="">Select…</option>
                {DOC_TYPES.map(d => <option key={d.id} value={d.title}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#9C9C9C]">Content</label>
              <button onClick={() => setShowHints(s => !s)}
                className="flex items-center gap-1 text-xs text-[#9C9C9C] hover:text-[#2B2B2B]">
                Variable Hints {showHints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            {showHints && (
              <div className="mb-2 p-3 bg-[#F5F1E6] rounded-lg text-xs text-[#9C9C9C] flex flex-wrap gap-2">
                {["{{employee_name}}", "{{designation}}", "{{department}}", "{{joining_date}}", "{{salary}}", "{{company_name}}"].map(v => (
                  <span key={v} className="bg-white border border-[#E7E2D8] px-2 py-0.5 rounded font-mono">{v}</span>
                ))}
              </div>
            )}
            <textarea value={tplContent} onChange={e => setTplContent(e.target.value)} rows={8}
              placeholder="Write your template content here using variables like {{employee_name}}…"
              className="w-full border border-[#E7E2D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F3CC4D] resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave}
              className="px-4 py-2 bg-[#F3CC4D] rounded-lg text-sm font-medium hover:bg-yellow-400 transition">
              Save Template
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-[#F5F1E6] border border-[#E7E2D8] rounded-lg text-sm font-medium hover:bg-[#E7E2D8] transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E7E2D8] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F1E6] text-[#9C9C9C] text-xs uppercase">
            <tr>
              {["Name", "Type", "Last Modified", "Used Count", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E2D8]">
            {MOCK_TEMPLATES.map(t => (
              <tr key={t.id} className="hover:bg-[#F5F1E6] transition">
                <td className="px-4 py-3 font-medium text-[#2B2B2B]">{t.name}</td>
                <td className="px-4 py-3 text-[#9C9C9C]">{t.type}</td>
                <td className="px-4 py-3 text-[#9C9C9C]">{t.modified}</td>
                <td className="px-4 py-3">
                  <span className="bg-[#F5F1E6] text-[#2B2B2B] px-2 py-0.5 rounded-full text-xs">{t.uses} uses</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toast.success("Opening editor…")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#F5F1E6] rounded-lg hover:bg-[#E7E2D8] transition">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => toast.success("Previewing template…")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#F5F1E6] rounded-lg hover:bg-[#E7E2D8] transition">
                      <Eye size={12} /> Preview
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArchiveTab() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() =>
    MOCK_ARCHIVE.filter(r =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(r => r.id));
  const toggleOne = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or type…"
            className="w-full pl-9 pr-3 py-2 border border-[#E7E2D8] rounded-lg text-sm focus:outline-none focus:border-[#F3CC4D]" />
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => { toast.success(`Downloaded ${selected.length} document(s)`); setSelected([]); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#F3CC4D] rounded-lg text-sm font-medium hover:bg-yellow-400 transition">
            <Download size={15} /> Bulk Download ({selected.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E7E2D8] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F1E6] text-[#9C9C9C] text-xs uppercase">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded" />
              </th>
              {["Date", "Employee Name", "Document Type", "Generated By", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E2D8]">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-[#F5F1E6] transition">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} className="rounded" />
                </td>
                <td className="px-4 py-3 text-[#9C9C9C]">{r.date}</td>
                <td className="px-4 py-3 font-medium text-[#2B2B2B]">{r.employee}</td>
                <td className="px-4 py-3">
                  <span className="bg-[#F5F1E6] px-2 py-0.5 rounded-full text-xs">{r.type}</span>
                </td>
                <td className="px-4 py-3 text-[#9C9C9C]">{r.by}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toast.success(`Downloading ${r.type} for ${r.employee}`)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#F3CC4D] rounded-lg hover:bg-yellow-400 transition font-medium">
                    <Download size={12} /> Download
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#9C9C9C]">No documents found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DocumentGeneration() {
  const [activeTab, setActiveTab] = useState("generate");
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#F5F1E6] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2B2B2B]">Document Generation Center</h1>
          <p className="text-sm text-[#9C9C9C] mt-1">Generate, manage, and archive employee documents</p>
        </div>

        <div className="flex gap-1 bg-white border border-[#E7E2D8] rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === t.id ? "bg-[#F3CC4D] text-[#2B2B2B]" : "text-[#9C9C9C] hover:text-[#2B2B2B]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "generate" && <GenerateTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "archive" && <ArchiveTab />}
      </div>
    </div>
  );
}
