import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  DollarSign,
  CheckSquare,
  Star,
  Sparkles,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Clock,
  MapPin,
  Bot
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/organizer');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Aggregating live event analytics & AI insights..." isAI />;
  }

  const { stats, categoryDistribution, upcomingEvents, aiAlerts } = data || {};

  const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Organizer Operations Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Organizer'}!
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {stats?.upcomingCount || 0} active upcoming events require your attention today. AI models are monitoring your budget limits and queue capacities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/organizer/events/new"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/30 transition-all flex items-center active:scale-95"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Event
          </Link>
          <Link
            to="/organizer/ai-planner"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center"
          >
            <Bot className="w-4 h-4 mr-1.5 text-purple-400" />
            AI Sandbox
          </Link>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Events"
          value={stats?.totalEvents || 0}
          subtitle={`${stats?.upcomingCount || 0} upcoming / ${stats?.pastCount || 0} completed`}
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Total Attendees"
          value={stats?.totalAttendees || 0}
          subtitle="Across all active rosters"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Budget Utilization"
          value={`${stats?.overallBudgetUtilization || 0}%`}
          subtitle={`${formatCurrency(stats?.totalSpentBudget)} of ${formatCurrency(stats?.totalPlannedBudget)}`}
          icon={DollarSign}
          color={stats?.overallBudgetUtilization > 85 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Average Rating"
          value={stats?.averageRating ? `${stats.averageRating} ★` : '4.8 ★'}
          subtitle={`${stats?.totalFeedbacks || 0} attendee reviews`}
          icon={Star}
          color="amber"
        />
      </div>

      {/* AI SMART ALERTS WIDGET */}
      {aiAlerts && aiAlerts.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Operational Alerts & Risk Watch</h3>
                <p className="text-[11px] text-slate-500">Real-time risk warnings calculated from your live database parameters</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-50 text-indigo-700">
              Live Evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-xs ${
                  alert.type === 'risk' || alert.type === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : alert.type === 'info'
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold mb-1">
                  {alert.type === 'risk' ? (
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{alert.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYTICS & UPCOMING EVENTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Upcoming Events List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Events Pipeline</h3>
              <p className="text-[11px] text-slate-500">Live operational status and registration capacity</p>
            </div>
            <Link
              to="/organizer/events"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              View All ({stats?.totalEvents || 0}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {upcomingEvents?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No upcoming events scheduled. Click "Create New Event" to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents?.map((event) => {
                const regRate = event.expectedAttendees > 0
                  ? Math.min(100, Math.round((event.registeredAttendees / event.expectedAttendees) * 100))
                  : 0;

                return (
                  <div
                    key={event.id}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                          {event.type}
                        </span>
                        <Badge variant={event.status}>{event.status}</Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {event.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-[11px] text-slate-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                          {event.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="block text-[11px] font-bold text-slate-700">
                          {event.registeredAttendees} / {event.expectedAttendees} Guests
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Budget: {formatCurrency(event.budget)}
                        </span>
                      </div>

                      <Link
                        to={`/organizer/events/${event.id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Category Distribution Chart (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Events by Category</h3>
            <p className="text-[11px] text-slate-500 mb-4">Portfolio distribution across categories</p>

            <div className="h-56 flex items-center justify-center">
              {categoryDistribution && categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No category data yet</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            {categoryDistribution?.map((cat, i) => (
              <div key={cat.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-600 truncate">{cat.name}:</span>
                <span className="font-bold text-slate-900">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
