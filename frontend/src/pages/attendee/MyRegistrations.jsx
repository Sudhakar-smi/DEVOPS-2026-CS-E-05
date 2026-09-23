import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Star, QrCode, CheckCircle2, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  // Feedback Modal State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventName, setSelectedEventName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('General');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendees/my-registrations');
      if (res.data.success) {
        setRegistrations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err.message);
      error('Failed to load your event registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = (event) => {
    setSelectedEventId(event._id);
    setSelectedEventName(event.name);
    setRating(5);
    setComment('');
    setCategory('General');
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      error('Please write a feedback comment');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await api.post(`/events/${selectedEventId}/feedback`, {
        rating: Number(rating),
        comment,
        category
      });
      if (res.data.success) {
        success('Thank you! Your feedback has been submitted to the organizer.');
        setFeedbackModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your event passes..." />;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Registered Events & Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your digital QR passes, schedule itineraries, and submit post-event reviews
          </p>
        </div>

        <Link
          to="/events"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all self-start sm:self-auto"
        >
          <Ticket className="w-4 h-4 mr-2" />
          Explore More Events
        </Link>
      </div>

      {registrations.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No registered events yet"
          description="Browse public events and register to secure your digital pass."
          actionText="Browse Upcoming Events"
          actionLink="/events"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map((reg) => {
            const event = reg.eventId;
            if (!event) return null;

            return (
              <div
                key={reg._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Top Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                      {event.type}
                    </span>
                    <Badge variant={reg.status}>{reg.status}</Badge>
                  </div>

                  <Link to={`/events/${event._id}`}>
                    <h3 className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {event.name}
                    </h3>
                  </Link>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                      <span>{formatDate(event.date)} ({event.duration})</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  {/* Digital Pass Box */}
                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Pass Reference</span>
                      <span className="font-mono font-extrabold text-xs text-indigo-700 block">
                        {reg.qrCodeRef || 'TKT-CONFIRMED'}
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        {reg.ticketType} • {reg.dietaryPreferences || 'Standard'}
                      </span>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs">
                      <QrCode className="w-7 h-7" />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenFeedback(event)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center"
                  >
                    <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    Leave Review
                  </button>

                  <Link
                    to={`/events/${event._id}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center"
                  >
                    <span>View Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title={`Submit Review for "${selectedEventName}"`}
        subtitle="Your feedback is analyzed directly by the organizer's AI Sentiment system"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Overall Rating</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 ml-2">{rating} of 5 Stars</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="General">General Experience</option>
              <option value="Organization">Event Organization & Timeliness</option>
              <option value="Catering">Catering & Food Quality</option>
              <option value="Venue">Venue & Facilities</option>
              <option value="Speakers/Content">Speakers, Mentors & Content</option>
              <option value="Registration">Check-in & Registration Process</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Comments & Experience *</label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went exceptionally well? What could the organizing team improve next year?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingFeedback}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200"
            >
              {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
