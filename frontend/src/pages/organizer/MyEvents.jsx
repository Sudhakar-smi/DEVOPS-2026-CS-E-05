import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  PlusCircle,
  Search,
  Filter,
  Users,
  DollarSign,
  CheckSquare,
  Sparkles,
  Star,
  Trash2,
  Edit,
  ExternalLink,
  ArrowRight,
  MapPin
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/organizer/my-events');
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err.message);
      error('Could not load your events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEventId) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/events/${selectedEventId}`);
      if (res.data.success) {
        success('Event and all associated records deleted successfully');
        setEvents((prev) => prev.filter((e) => e._id !== selectedEventId));
        setDeleteModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Events Portfolio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your AI plans, live budgets, attendee rosters, and schedules
          </p>
        </div>

        <Link
          to="/organizer/events/new"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Event
        </Link>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by event title, location, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'published', 'in-progress', 'draft', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching your organized events..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description="You don't have any events matching your filter criteria."
          actionText="Create New Event"
          actionLink="/organizer/events/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const taskRate = event.tasksTotal > 0
              ? Math.round((event.tasksCompleted / event.tasksTotal) * 100)
              : 0;

            const budgetUtil = event.budget > 0
              ? Math.round((event.budgetSpent / event.budget) * 100)
              : 0;

            return (
              <div
                key={event._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        {event.type}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {event.hasAIPlan && (
                          <span className="p-1 rounded-md bg-purple-50 text-purple-700 title='AI Plan Active'">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <Badge variant={event.status}>{event.status}</Badge>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Operational Metrics Block */}
                  <div className="px-5 py-3 space-y-2.5 bg-slate-50/70 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                        {formatDate(event.date)}
                      </span>
                      <span className="font-semibold text-slate-700">{event.duration}</span>
                    </div>

                    <div className="flex items-center text-slate-600">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Guests</span>
                        <span className="font-extrabold text-xs text-slate-800">
                          {event.registeredAttendees}/{event.expectedAttendees}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Budget</span>
                        <span className="font-extrabold text-xs text-slate-800">{budgetUtil}%</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Tasks</span>
                        <span className="font-extrabold text-xs text-slate-800">{taskRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <Link
                      to={`/events/${event._id}`}
                      target="_blank"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Public Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/organizer/events/${event._id}/edit`}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Edit Event Parameters"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedEventId(event._id);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/organizer/events/${event._id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Event Permanently?"
        subtitle="This action cannot be undone"
      >
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          Are you sure you want to delete this event? All associated AI plans, budget allocations, schedules, task checklists, and registered attendee records will be permanently removed.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200"
          >
            {deleting ? 'Deleting...' : 'Yes, Delete Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
