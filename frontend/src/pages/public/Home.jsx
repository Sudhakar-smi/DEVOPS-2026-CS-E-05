import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Calendar,
  DollarSign,
  Clock,
  ShieldAlert,
  Users,
  Activity,
  Bot,
  CheckCircle2,
  Zap,
  TrendingUp,
  Layers,
  Heart,
  Code,
  Briefcase,
  Music,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Home() {
  const { demoLogin, isAuthenticated, user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  // Interactive Live Demo Simulator on Landing Page
  const [demoType, setDemoType] = useState('Hackathon');
  const [demoGuests, setDemoGuests] = useState(500);
  const [demoBudget, setDemoBudget] = useState(500000);

  const handleQuickDemoLogin = async (role) => {
    try {
      await demoLogin(role);
      success(`Logged in as Demo ${role.toUpperCase()}`);
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'attendee') navigate('/attendee/my-registrations');
      else navigate('/organizer/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { title: 'Personal & Weddings', desc: 'Destination weddings, birthdays & royal anniversaries', icon: Heart, count: '10+ Types', color: 'from-pink-500 to-rose-600' },
    { title: 'Educational & Hackathons', desc: 'Code hackathons, college tech fests & workshops', icon: Code, count: '15+ Types', color: 'from-indigo-500 to-blue-600' },
    { title: 'Corporate & Summits', desc: 'Product launches, leadership summits & networking', icon: Briefcase, count: '12+ Types', color: 'from-amber-500 to-orange-600' },
    { title: 'Concerts & Festivals', desc: 'Live music concerts, DJ nights & cultural fests', icon: Music, count: '8+ Types', color: 'from-purple-500 to-indigo-600' },
    { title: 'Sports & Tournaments', desc: 'Athletics championships, leagues & fitness rallies', icon: Trophy, count: '10+ Types', color: 'from-emerald-500 to-teal-600' }
  ];

  return (
    <div className="overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Intelligent Full-Stack Event Planning & Operations System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Plan, Optimize & Simulate <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Any Event with AI Precision
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate guesswork. Generate realistic budget allocations, dynamic schedules, staffing equations, and risk analysis in seconds.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'organizer' ? '/organizer/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/attendee/my-registrations'}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center group active:scale-95"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center group active:scale-95"
                >
                  Start Planning with AI
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/events"
                  className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-bold transition-all active:scale-95"
                >
                  Explore Public Events
                </Link>
              </>
            )}
          </div>

          {/* 1-Click Demo Badges */}
          {!isAuthenticated && (
            <div className="mt-8 pt-6 border-t border-slate-800/60 max-w-xl mx-auto flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-2">Instant Evaluation:</span>
              <button
                onClick={() => handleQuickDemoLogin('organizer')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/50 transition-colors"
              >
                ⚡ Demo Organizer
              </button>
              <button
                onClick={() => handleQuickDemoLogin('attendee')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-900/60 hover:bg-purple-900 text-purple-200 border border-purple-700/50 transition-colors"
              >
                🎟️ Demo Attendee
              </button>
              <button
                onClick={() => handleQuickDemoLogin('admin')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50 transition-colors"
              >
                🛡️ Demo Admin
              </button>
            </div>
          )}
        </div>
      </section>

      {/* INTERACTIVE QUICK AI ESTIMATOR BANNER */}
      <section className="relative -mt-8 max-w-5xl mx-auto px-4 sm:px-6 z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                <span>Live AI Operational Calculator Preview</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Real-Time Resource Estimator
              </h3>
            </div>

            {/* Event Type selector */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
              {['Hackathon', 'Wedding', 'Conference', 'Concert'].map((t) => (
                <button
                  key={t}
                  onClick={() => setDemoType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    demoType === t ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Guest Headcount:</span>
                  <span className="text-indigo-600">{demoGuests} Attendees</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="50"
                  value={demoGuests}
                  onChange={(e) => setDemoGuests(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Total Budget:</span>
                  <span className="text-indigo-600">₹{demoBudget.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="3000000"
                  step="50000"
                  value={demoBudget}
                  onChange={(e) => setDemoBudget(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Computed AI Outputs */}
            <div className="grid grid-cols-2 gap-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coordinators Needed</span>
                <p className="text-lg font-extrabold text-indigo-700 mt-0.5">
                  {Math.max(4, Math.ceil(demoGuests / 40))} Staff
                </p>
                <span className="text-[10px] text-slate-500">1 : 40 ratio</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Check-in Desks</span>
                <p className="text-lg font-extrabold text-indigo-700 mt-0.5">
                  {Math.max(2, Math.ceil(demoGuests / 120))} Desks
                </p>
                <span className="text-[10px] text-slate-500">&lt; 15s entry flow</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Meals (+8% buffer)</span>
                <p className="text-lg font-extrabold text-indigo-700 mt-0.5">
                  {Math.round(demoGuests * 1.08)} Plates
                </p>
                <span className="text-[10px] text-slate-500">Safety cushion</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contingency Reserve</span>
                <p className="text-lg font-extrabold text-indigo-700 mt-0.5">
                  ₹{Math.round(demoBudget * 0.08).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-500">8% emergency fund</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
            Engineered For Event Producers
          </h2>
          <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Everything Required To Run Flawless Events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Budget Allocator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dynamically splits venue, catering, AV, decor, and marketing line items to ensure your expenditures never exceed total budget constraints.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">What-If Scenario Simulator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Simulate sudden changes (+300 guests, budget surges, location shifts) and preview impacts on meals, seating, staff, and risk matrices.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Context-Aware AI Assistant</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chat directly with an AI that knows your actual database state—how much budget remains, how many tasks are pending, and key schedule bottlenecks.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Risk Analyzer & Mitigation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Identifies entry chokepoints, tech bandwidth failures, catering shortages, and provides actionable preventative checklists.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Sentiment & Feedback Analyzer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Processes raw attendee reviews after the event to extract positive themes, recurring complaints, and suggestions for future editions.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Seamless Attendee Portals</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Public event discovery, 1-click duplicate-safe ticket registration, personalized schedule view, and digital check-ins.
            </p>
          </div>
        </div>
      </section>

      {/* EVENT CATEGORIES SHOWCASE */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Versatile Engine</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Tailored for Every Event Type</h2>
            </div>
            <Link
              to="/events"
              className="mt-4 md:mt-0 text-xs font-bold text-indigo-300 hover:text-white flex items-center"
            >
              Browse all events <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 hover:border-indigo-500/50 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">{cat.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Plan Your Next Event with AI?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-indigo-100 max-w-xl mx-auto">
            Create an organizer account, enter basic event parameters, and let the AI generate your complete plan in seconds.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-white text-indigo-900 text-xs font-bold shadow-xl hover:bg-slate-100 transition-all active:scale-95"
            >
              Create Free Account
            </Link>
            <button
              onClick={() => handleQuickDemoLogin('organizer')}
              className="px-6 py-3.5 rounded-xl bg-indigo-950/60 text-white border border-indigo-400/30 text-xs font-bold hover:bg-indigo-950 transition-all active:scale-95"
            >
              Launch Demo Workspace
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
