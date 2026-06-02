import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Building } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', organization: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill all required fields'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    const result = await register({ name: form.name, email: form.email, password: form.password, firstName: form.name.split(' ')[0], lastName: form.name.split(' ').slice(1).join(' ') || '', orgName: form.organization || 'My Organization' });
    if (result.success) navigate('/dashboard');
    else setError(result.error || 'Registration failed');
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-12">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      <div className="relative z-10 w-full max-w-md mx-4 animate-slideUp">
        <div className="liquid-glass-strong rounded-3xl p-8 lg:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
              <span className="text-white font-bold text-lg">G2</span>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Create your account</h1>
            <p className="text-sm text-white/50 mt-1">Start your free trial today</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Doe" className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-sky-400/50 focus:bg-white/[0.07] transition-all" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Organization</label>
              <div className="relative">
                <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" value={form.organization} onChange={e => update('organization', e.target.value)} placeholder="Your Company Name" className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-sky-400/50 focus:bg-white/[0.07] transition-all" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@company.com" className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-sky-400/50 focus:bg-white/[0.07] transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••" className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-sky-400/50 focus:bg-white/[0.07] transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Confirm *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="••••••" className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-sky-400/50 focus:bg-white/[0.07] transition-all" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account? <Link to="/login" className="text-sky-400 hover:text-sky-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
