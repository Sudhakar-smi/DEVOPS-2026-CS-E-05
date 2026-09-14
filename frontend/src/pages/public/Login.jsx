import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, UserCheck, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.name}!`);
      
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'attendee') {
        navigate('/attendee/my-registrations');
      } else {
        navigate('/organizer/dashboard');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    try {
      const user = await demoLogin(role);
      success(`Logged in as Demo ${role.toUpperCase()}`);
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'attendee') {
        navigate('/attendee/my-registrations');
      } else {
        navigate('/organizer/dashboard');
      }
    } catch (err) {
      error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-200 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your AI Event Management Workspace
          </p>
        </div>

        {/* 1-Click Demo Evaluation Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Instant Demo Login</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('organizer')}
              className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 shadow-2xs transition-all flex flex-col items-center justify-center"
            >
              <UserCheck className="w-3.5 h-3.5 mb-1" />
              Organizer
            </button>
            <button
              type="button"
              onClick={() => handleDemo('attendee')}
              className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-white hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 shadow-2xs transition-all flex flex-col items-center justify-center"
            >
              <Ticket className="w-3.5 h-3.5 mb-1" />
              Attendee
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 shadow-2xs transition-all flex flex-col items-center justify-center"
            >
              <ShieldCheck className="w-3.5 h-3.5 mb-1" />
              Admin
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center active:scale-95"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
