import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Search, MapPin, Users, DollarSign, ExternalLink, Activity } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EventMonitoring() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { error } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/events');
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      error('Failed to load events audit');
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.type.toLowerCase().includes(search.toLowerCase()) ||
    (e.organizerId?.name && e.organizerId.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Global Event Monitoring & Audit
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Full platform-wide inspection across all organizers and event portfolios
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by event, type, or host name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{filtered.length} Total Events</span>
      </div>

      {loading ? (
        <LoadingSpinner text="Auditing platform events..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Event Name</th>
                <th className="pb-3">Organizer Host</th>
                <th className="pb-3">Date & Location</th>
                <th className="pb-3">Registrations</th>
                <th className="pb-3">Budget</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50/60">
                  <td className="py-3">
                    <span className="font-bold text-slate-900 block">{e.name}</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">{e.type} ({e.categoryGroup})</span>
                  </td>
                  <td className="py-3">
                    <span className="font-semibold text-slate-800 block">{e.organizerId?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-slate-400">{e.organizerId?.email}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-slate-700 block">{formatDate(e.date)}</span>
                    <span className="text-[10px] text-slate-400 truncate">{e.location}</span>
                  </td>
                  <td className="py-3 font-semibold text-slate-800">
                    {e.registeredAttendees || 0} / {e.expectedAttendees}
                  </td>
                  <td className="py-3 font-extrabold text-slate-900">{formatCurrency(e.budget)}</td>
                  <td className="py-3">
                    <Badge variant={e.status}>{e.status}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/events/${e._id}`}
                      target="_blank"
                      className="p-1.5 inline-block text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                      title="Public Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
