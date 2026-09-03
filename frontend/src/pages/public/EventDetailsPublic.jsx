import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
  Ticket,
  Star,
  MessageSquare,
  Share2,
  Building,
  ArrowLeft,
  QrCode
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EventDetailsPublic() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Registration Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [ticketType, setTicketType] = useState('General Admission');
  const [dietary, setDietary] = useState('Standard');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registeredTicket, setRegisteredTicket] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const [resEvent, resSchedule, resFeedback] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/events/${id}/schedule`),
        api.get(`/events/${id}/feedback`)
      ]);

      if (resEvent.data.success) setEvent(resEvent.data.data);
      if (resSchedule.data.success) setScheduleDays(resSchedule.data.days || []);
      if (resFeedback.data.success) setFeedbacks(resFeedback.data.data || []);
    } catch (err) {
      console.error('Error fetching public event details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/events/${id}/register`, {
        ticketType,
        dietaryPreferences: dietary,
        notes
      });

      if (response.data.success) {
        success('Registration Confirmed! Your digital pass has been issued.');
        setRegisteredTicket(response.data.data);
        fetchEventDetails();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to complete event registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading event details & schedule..." />;
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Event Not Found</h2>
        <Link to="/events" className="text-indigo-600 font-semibold text-xs mt-2 inline-block">
          ← Back to All Events
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        to="/events"
        className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Events Catalog
      </Link>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-10 text-white relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {event.type}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
              {event.categoryGroup}
            </span>
            <Badge variant={event.status}>{event.status}</Badge>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{event.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            {event.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-slate-800 pt-6">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
              <span>{formatDate(event.date)} ({event.duration})</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-indigo-400" />
              <span>{event.venueName ? `${event.venueName}, ` : ''}{event.location}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-indigo-400" />
              <span>{event.registeredAttendees || 0} / {event.expectedAttendees} Attendees</span>
            </div>
            {event.averageRating > 0 && (
              <div className="flex items-center text-amber-400 font-bold">
                <Star className="w-4 h-4 mr-1 fill-amber-400" />
                <span>{event.averageRating} / 5.0 ({event.feedbackCount} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Strip */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {event.organizerId?.name?.charAt(0) || 'O'}
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Organized by {event.organizerId?.name || 'Event Host'}
              </span>
              <span className="block text-[11px] text-slate-500">
                {event.organizerId?.organization || 'Event Management Team'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setRegisteredTicket(null);
                setRegisterModalOpen(true);
              }}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center active:scale-95"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Register for Event
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 flex space-x-6">
        {[
          { id: 'overview', label: 'Overview & Requirements' },
          { id: 'schedule', label: `Schedule & Agenda (${event.scheduleCount || 0})` },
          { id: 'feedback', label: `Attendee Reviews (${feedbacks.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">About the Event</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>

              {event.requirements && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Participant Requirements</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {event.requirements}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Event Highlights</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Catering Style:</span>
                  <span className="font-semibold text-slate-800">{event.preferences?.cateringType || 'Standard'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Venue Setting:</span>
                  <span className="font-semibold text-slate-800">{event.preferences?.indoorOutdoor || 'Indoor'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Theme:</span>
                  <span className="font-semibold text-slate-800">{event.preferences?.theme || 'Standard'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {scheduleDays.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-500">
              Schedule agenda will be announced shortly by the organizing committee.
            </div>
          ) : (
            scheduleDays.map((dayGroup) => (
              <div key={dayGroup.day} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    Day {dayGroup.day}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">Agenda & Sessions</h4>
                </div>

                <div className="divide-y divide-slate-100">
                  {dayGroup.sessions.map((sess) => (
                    <div key={sess._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start space-x-3">
                        <div className="w-20 text-xs font-bold text-indigo-600 flex-shrink-0 pt-0.5">
                          {sess.startTime}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{sess.title}</h5>
                          {sess.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{sess.description}</p>
                          )}
                          {sess.speakerOrLead && (
                            <span className="inline-block mt-1 text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                              Lead: {sess.speakerOrLead}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-center">
                        📍 {sess.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: Feedback */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-500">
              No feedback reviews submitted yet. Be the first to leave a review after attending!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((f) => (
                <div key={f._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {f.userId?.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">{f.userId?.name || 'Verified Attendee'}</span>
                        <span className="block text-[10px] text-slate-400">{formatDate(f.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(f.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 italic leading-relaxed">
                    "{f.comment}"
                  </p>
                  <span className="inline-block mt-3 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {f.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={registeredTicket ? 'Digital Ticket Confirmed!' : `Register for ${event.name}`}
        subtitle={registeredTicket ? 'Your QR entry pass is active' : 'Complete quick registration'}
      >
        {registeredTicket ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">You are Registered!</h4>
              <p className="text-xs text-slate-500 mt-1">Ticket Reference: <span className="font-mono font-bold text-indigo-600">{registeredTicket.qrCodeRef}</span></p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Attendee:</span>
                <span className="font-bold text-slate-800">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket Type:</span>
                <span className="font-bold text-slate-800">{registeredTicket.ticketType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dietary Option:</span>
                <span className="font-bold text-slate-800">{registeredTicket.dietaryPreferences}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center space-x-3">
              <Link
                to="/attendee/my-registrations"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                View in My Tickets
              </Link>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {!isAuthenticated && (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 mb-3">
                You will be asked to sign in or create an account to secure your pass.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ticket Type</label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="General Admission">General Admission (Standard Pass)</option>
                <option value="VIP Delegate">VIP Delegate Pass</option>
                <option value="Student Pass">Student Pass (College ID required)</option>
                <option value="Speaker / Mentor">Speaker / Mentor Pass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dietary Preferences</label>
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="Standard">Standard / Mixed</option>
                <option value="Vegetarian">Pure Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Gluten-Free">Gluten-Free</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Notes / Accessibility</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any special assistance required..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRegisterModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all"
              >
                {submitting ? 'Confirming...' : 'Confirm Registration'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
