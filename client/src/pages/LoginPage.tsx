import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('OfficeFlow@2026');
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'OfficeFlow@2026');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-4">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">OfficeFlow CRM</h1>
          <p className="text-sm text-slate-500 mt-1">
            Production-Ready B2B Sales & Team Operations Platform
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Interactive Portfolio Demo</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Client Demo Switcher */}
          <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1-Click Instant Demo Access
              </span>
              <span className="text-[11px] text-indigo-600 font-medium">Click to test role</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleInstantDemo('admin@officeflow.internal')}
                className="p-2.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">Admin</strong>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded">All</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">Settings, teams, full audit log</p>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleInstantDemo('priya.nair@officeflow.internal')}
                className="p-2.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">Manager</strong>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1 rounded">Team</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">Workload balance, reassignment</p>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleInstantDemo('kavita.patel@officeflow.internal')}
                className="p-2.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">Sales Rep</strong>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1 rounded">Rep</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">Kanban deals, daily tasks</p>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or enter credentials manually</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@officeflow.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-200 transition flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Office'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Server-managed sessions • Single-tenant office deployment</span>
        </div>
      </div>
    </div>
  );
};
