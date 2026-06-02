import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const ROLES = [
  { id: 'admin', name: 'Admin', desc: 'Full access to all modules', color: '#ef4444' },
  { id: 'hr_manager', name: 'HR Manager', desc: 'Manage employees, leave, attendance', color: '#f59e0b' },
  { id: 'finance', name: 'Finance', desc: 'Payroll, salary, banking, compliance', color: '#10b981' },
  { id: 'manager', name: 'Manager', desc: 'Team attendance, leave approvals', color: '#3b82f6' },
  { id: 'employee', name: 'Employee', desc: 'Self-service: payslips, leave, attendance', color: '#9C9C9C' },
];

const PERMISSIONS = {
  admin: ['all'],
  hr_manager: ['staff', 'attendance', 'leave', 'compoff', 'holidays', 'shifts', 'onboarding', 'reports'],
  finance: ['salary', 'payroll', 'banking', 'compliance', 'tax', 'advances', 'loans', 'bonus', 'reports'],
  manager: ['attendance.team', 'leave.approve', 'compoff.approve', 'reports.team', 'worklog'],
  employee: ['attendance.self', 'leave.self', 'payslip.self', 'profile.self'],
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee', password: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      // Fetch real employees from backend
      const { employeeAPI } = await import('../../services/api');
      const res = await employeeAPI.list({ limit: 200 });
      const employees = res.data || [];
      const mapped = employees.map(e => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        email: e.email,
        role: e.userId ? 'admin' : 'employee',
        status: e.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
        createdAt: e.createdAt,
      }));
      setUsers(mapped);
    } catch {
      // Fallback to localStorage
      const stored = payrollDataStore.getData('go2_users') || [];
      setUsers(stored);
    }
  };

  const handleAdd = () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    if (users.find(u => u.email === form.email)) { toast.error('Email already exists'); return; }
    const newUser = { id: `user_${Date.now()}`, ...form, status: 'active', createdAt: new Date().toISOString() };
    const updated = [...users, newUser];
    payrollDataStore.setData('go2_users', updated);
    setUsers(updated);
    setForm({ name: '', email: '', role: 'employee', password: '' });
    setShowAdd(false);
    toast.success(`User ${form.name} added with role: ${form.role}`);
  };

  const toggleStatus = (userId) => {
    const updated = users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u);
    payrollDataStore.setData('go2_users', updated);
    setUsers(updated);
    toast.success('User status updated');
  };

  const deleteUser = (userId) => {
    if (!confirm('Delete this user?')) return;
    const updated = users.filter(u => u.id !== userId);
    payrollDataStore.setData('go2_users', updated);
    setUsers(updated);
    toast.success('User deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#2B2B2B]">User Management</h1>
          <p className="text-[#9C9C9C] mt-1">Manage users, roles, and access control</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center gap-2"><UserPlus size={16} /> Add User</button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ROLES.map(r => (
          <div key={r.id} className="card text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: r.color + '15' }}>
              <Shield size={18} style={{ color: r.color }} />
            </div>
            <p className="text-sm font-semibold text-[#2B2B2B]">{r.name}</p>
            <p className="text-[10px] text-[#9C9C9C] mt-1">{r.desc}</p>
            <p className="text-lg font-bold text-[#2B2B2B] mt-2">{users.filter(u => u.role === r.id).length}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="card">
        <h3 className="text-base font-semibold text-[#2B2B2B] mb-4">All Users ({users.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E7E2D8]">
              <th className="text-left py-3 px-3 text-[#9C9C9C] font-medium text-xs">Name</th>
              <th className="text-left py-3 px-3 text-[#9C9C9C] font-medium text-xs">Email</th>
              <th className="text-left py-3 px-3 text-[#9C9C9C] font-medium text-xs">Role</th>
              <th className="text-left py-3 px-3 text-[#9C9C9C] font-medium text-xs">Status</th>
              <th className="text-left py-3 px-3 text-[#9C9C9C] font-medium text-xs">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => {
                const role = ROLES.find(r => r.id === u.role);
                return (
                  <tr key={u.id} className="border-b border-[#F5F1E6] hover:bg-[#F5F1E6] transition-colors">
                    <td className="py-3 px-3 font-medium text-[#2B2B2B]">{u.name}</td>
                    <td className="py-3 px-3 text-[#9C9C9C]">{u.email}</td>
                    <td className="py-3 px-3"><span className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ background: (role?.color || '#9C9C9C') + '15', color: role?.color }}>{role?.name || u.role}</span></td>
                    <td className="py-3 px-3"><span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                    <td className="py-3 px-3 flex gap-2">
                      <button onClick={() => toggleStatus(u.id)} className="w-7 h-7 rounded-lg bg-[#F5F1E6] flex items-center justify-center hover:bg-[#E7E2D8] transition-colors" title="Toggle status">
                        {u.status === 'active' ? <X size={12} /> : <Check size={12} />}
                      </button>
                      <button onClick={() => deleteUser(u.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors text-red-500" title="Delete"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permissions Matrix */}
      <div className="card">
        <h3 className="text-base font-semibold text-[#2B2B2B] mb-4">Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-[#E7E2D8]">
              <th className="text-left py-2 px-2 text-[#9C9C9C]">Module</th>
              {ROLES.map(r => <th key={r.id} className="text-center py-2 px-2 text-[#9C9C9C]">{r.name}</th>)}
            </tr></thead>
            <tbody>
              {['Staff', 'Attendance', 'Leave', 'Salary/Payroll', 'Compliance', 'Banking', 'Reports', 'Settings'].map(mod => (
                <tr key={mod} className="border-b border-[#F5F1E6]">
                  <td className="py-2 px-2 font-medium text-[#2B2B2B]">{mod}</td>
                  {ROLES.map(r => (
                    <td key={r.id} className="text-center py-2 px-2">
                      {r.id === 'admin' || (r.id === 'hr_manager' && ['Staff', 'Attendance', 'Leave'].includes(mod)) || (r.id === 'finance' && ['Salary/Payroll', 'Compliance', 'Banking', 'Reports'].includes(mod)) || (r.id === 'manager' && ['Attendance', 'Leave'].includes(mod))
                        ? <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 leading-5 text-center">✓</span>
                        : <span className="inline-block w-5 h-5 rounded-full bg-[#F5F1E6] text-[#9C9C9C] leading-5 text-center">—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[20px] p-6 w-full max-w-md shadow-xl animate-slideUp" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#F5F1E6] flex items-center justify-center hover:bg-[#E7E2D8]"><span className="text-lg leading-none">&times;</span></button>
            <h3 className="text-lg font-semibold text-[#2B2B2B] mb-5">Add New User</h3>
            <div className="space-y-4">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></div>
              <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" /></div>
              <div><label className="label">Temporary Password</label><input className="input" type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" /></div>
              <div><label className="label">Role *</label>
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.name} — {r.desc}</option>)}
                </select>
              </div>
              <button onClick={handleAdd} className="btn btn-primary w-full py-3">Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
