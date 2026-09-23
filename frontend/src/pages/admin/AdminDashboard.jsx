import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, ShieldCheck, Activity, Star, UserCheck, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading platform administration metrics..." />;
  }

  const { stats, recentUsers, recentEvents } = data || {};

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Governance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Platform System Overview
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Global metrics across all organizers, registered attendees, events, and AI executions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/categories"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
          >
            Event Categories
          </Link>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.organizersCount || 0} Organizers • ${stats?.attendeesCount || 0} Attendees`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Platform Events"
          value={stats?.totalEvents || 0}
          subtitle={`${stats?.activeEvents || 0} Active / Live`}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Total Budget Managed"
          value={formatCurrency(stats?.totalBudgetManaged || 0)}
          subtitle="Cumulative event sanction"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Platform Average Rating"
          value={stats?.avgPlatformRating ? `${stats.avgPlatformRating} ★` : '4.8 ★'}
          subtitle={`From ${stats?.totalFeedbacks || 0} reviews`}
          icon={Star}
          color="amber"
        />
      </div>

      {/* Recent Activity Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Events */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recently Created Events</h3>
            <Link to="/admin/events" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              View All ({stats?.totalEvents || 0}) →
            </Link>
          </div>

          <div className="space-y-3">
            {recentEvents?.map((event) => (
              <div
                key={event._id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{event.name}</h4>
                  <span className="text-[11px] text-slate-500">
                    Host: {event.organizerId?.name || 'Organizer'} • {event.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-indigo-600 block">{formatCurrency(event.budget)}</span>
                  <Badge variant={event.status}>{event.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recently Registered Users</h3>
            <Link to="/admin/users" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              User Directory ({stats?.totalUsers || 0}) →
            </Link>
          </div>

          <div className="space-y-3">
            {recentUsers?.map((u) => (
              <div
                key={u._id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{u.name}</h4>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </div>
                </div>
                <Badge variant={u.role}>{u.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
