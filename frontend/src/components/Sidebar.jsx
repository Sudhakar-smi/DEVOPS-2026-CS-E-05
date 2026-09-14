import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Sparkles,
  Users,
  Sliders,
  ShieldCheck,
  User,
  Activity,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ role = 'organizer' }) {
  const { user } = useAuth();

  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/organizer/events', label: 'My Events', icon: Calendar },
    { to: '/organizer/events/new', label: 'Create Event', icon: PlusCircle },
    { to: '/organizer/ai-planner', label: 'AI Planner', icon: Sparkles },
    { to: '/organizer/profile', label: 'Profile & Settings', icon: User }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Overview Stats', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: Sliders },
    { to: '/admin/events', label: 'Event Monitoring', icon: Activity },
    { to: '/admin/profile', label: 'Admin Settings', icon: ShieldCheck }
  ];

  const links = role === 'admin' ? adminLinks : organizerLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 space-y-6">
        {/* Workspace Header */}
        <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <span className="block text-xs font-bold text-white uppercase tracking-wider">
                {role === 'admin' ? 'Master Admin' : 'Organizer Workspace'}
              </span>
              <span className="block text-[11px] text-slate-400 truncate">
                {user?.organization || user?.name || 'Workspace'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/organizer/dashboard' || link.to === '/admin/dashboard'}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* AI Assistant Status Card at bottom of sidebar */}
      <div className="p-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-800 to-purple-950/70 border border-indigo-500/30">
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              AI Core Online
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Contextual engine connected. Dynamic budget, schedule & simulation ready.
          </p>
        </div>
      </div>
    </aside>
  );
}
