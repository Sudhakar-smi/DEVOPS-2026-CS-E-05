import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, Users, DollarSign, Sparkles, Filter, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Educational', 'Personal', 'Professional', 'Entertainment', 'Sports', 'Custom'];

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        status: 'published'
      };
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (search) {
        params.search = search;
      }
      const res = await api.get('/events', { params });
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Public Events
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Discover hackathons, leadership summits, destination weddings, and live entertainment planned with AI precision.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by event name, city, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <LoadingSpinner text="Discovering upcoming events..." />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try broadening your search term or selecting a different category filter."
          actionText="Clear Filters"
          onActionClick={() => {
            setSelectedCategory('All');
            setSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const capacityRate = event.expectedAttendees > 0
              ? Math.min(100, Math.round((event.registeredAttendees / event.expectedAttendees) * 100))
              : 0;

            return (
              <div
                key={event._id}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top Banner / Category */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {event.type}
                      </span>
                      <Badge variant={event.status}>{event.status}</Badge>
                    </div>

                    <Link to={`/events/${event._id}`}>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {event.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="px-5 py-2 space-y-2 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                        {formatDate(event.date)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {event.duration}
                      </span>
                    </div>

                    <div className="flex items-center text-slate-500">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Attendee Capacity & Action */}
                <div className="p-5 pt-3 border-t border-slate-100">
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Registrations: {event.registeredAttendees || 0} / {event.expectedAttendees}</span>
                      <span className="text-indigo-600 font-bold">{capacityRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          capacityRate >= 90 ? 'bg-rose-500' : capacityRate >= 50 ? 'bg-indigo-600' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${capacityRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    to={`/events/${event._id}`}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs group-hover:bg-indigo-600"
                  >
                    <span>View Details & Register</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
