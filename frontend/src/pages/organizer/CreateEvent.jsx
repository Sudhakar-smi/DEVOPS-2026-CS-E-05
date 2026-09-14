import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  Layers,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    categoryGroup: 'Educational',
    type: 'Hackathon',
    description: '',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: '2 days',
    location: 'Bangalore Tech Park',
    venueName: 'Main Innovation Center',
    budget: 500000,
    expectedAttendees: 350,
    preferences: {
      cateringType: 'Buffet + Refreshments',
      theme: 'Modern / Tech',
      indoorOutdoor: 'Indoor',
      specialRequirements: ''
    },
    requirements: ''
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const eventTypesByGroup = {
    Personal: ['Wedding', 'Birthday Party', 'Anniversary', 'Baby Shower', 'Private Party', 'Custom Personal'],
    Professional: ['Corporate Event', 'Conference', 'Networking Event', 'Product Launch', 'Fundraiser', 'Executive Summit'],
    Educational: ['Hackathon', 'College Event', 'Seminar', 'Workshop', 'Technical Symposium'],
    Entertainment: ['Concert', 'Cultural Event', 'Festival', 'Live Band Showcase'],
    Sports: ['Sports Tournament', 'Fitness Event', 'Athletics Meet', 'Marathon Rally'],
    Custom: ['Custom Bespoke Event']
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const handleGenerateAIPlan = async () => {
    if (!formData.name || !formData.budget || !formData.expectedAttendees) {
      error('Please complete all basic event details before generating AI plan');
      return;
    }

    setAiGenerating(true);
    try {
      const res = await api.post('/ai/generate-plan', formData);
      if (res.data.success) {
        setAiPlan(res.data.data);
        setStep(4);
        success('AI Event Plan successfully synthesized!');
      }
    } catch (err) {
      console.error('AI generation failed:', err.message);
      error('Failed to generate AI plan. Please check inputs.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    try {
      // 1. Create Event
      const res = await api.post('/events', {
        ...formData,
        autoGeneratePlan: false
      });

      if (res.data.success) {
        const createdEvent = res.data.data;

        // 2. Save AI Plan and sync to budget/schedule/tasks
        if (aiPlan) {
          await api.post('/ai/save-plan', {
            eventId: createdEvent._id,
            plan: aiPlan,
            applyToBudget: true,
            applyToSchedule: true,
            applyToChecklist: true
          });
        }

        success(`Event "${createdEvent.name}" created and configured!`);
        navigate(`/organizer/events/${createdEvent._id}`);
      }
    } catch (err) {
      console.error('Failed to save event:', err.message);
      error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/organizer/events"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Events
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create New Event
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step assisted event creator powered by AI
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
          <span className="w-4 h-0.5 bg-slate-200"></span>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
          <span className="w-4 h-0.5 bg-slate-200"></span>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
          <span className="w-4 h-0.5 bg-slate-200"></span>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
        </div>
      </div>

      {/* STEP 1: Basic Information */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center">
            <Layers className="w-4 h-4 mr-2 text-indigo-600" />
            Step 1: Event Identity & Category
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. National AI & Cloud Hackathon 2026"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Group</label>
              <select
                value={formData.categoryGroup}
                onChange={(e) => {
                  const grp = e.target.value;
                  handleInputChange('categoryGroup', grp);
                  handleInputChange('type', eventTypesByGroup[grp][0]);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {Object.keys(eventTypesByGroup).map((grp) => (
                  <option key={grp} value={grp}>{grp} Events</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Specific Event Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {(eventTypesByGroup[formData.categoryGroup] || []).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event Description & Objectives</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the main goals, target audience, and key highlights..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                if (!formData.name.trim()) {
                  error('Please enter an event name');
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center"
            >
              Next: Logistics & Budget <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Logistics & Budget */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-indigo-600" />
            Step 2: Dates, Capacity & Financial Ceiling
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Start Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (e.g. 1 day, 2 days, 36 hours)</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g. 2 days"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Landmark Name</label>
              <input
                type="text"
                value={formData.venueName}
                onChange={(e) => handleInputChange('venueName', e.target.value)}
                placeholder="e.g. Grand Convention Center"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Total Sanctioned Budget (INR ₹) *</label>
              <input
                type="number"
                min="1000"
                step="5000"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="block text-[11px] text-indigo-600 font-semibold mt-1">
                {formatCurrency(formData.budget)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Expected Attendee Count *</label>
              <input
                type="number"
                min="1"
                value={formData.expectedAttendees}
                onChange={(e) => handleInputChange('expectedAttendees', Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="block text-[11px] text-slate-500 mt-1">
                Used to calculate meals, seating & staff ratios
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (formData.budget <= 0 || formData.expectedAttendees <= 0) {
                  error('Please specify a positive budget and expected attendees');
                  return;
                }
                setStep(3);
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center"
            >
              Next: Preferences & Setup <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preferences & Requirements */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-indigo-600" />
            Step 3: Event Setup & Special Requirements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catering Preferences</label>
              <input
                type="text"
                value={formData.preferences.cateringType}
                onChange={(e) => handlePreferenceChange('cateringType', e.target.value)}
                placeholder="e.g. Vegetarian Buffet, High Tea"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Theme / Ambiance</label>
              <input
                type="text"
                value={formData.preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                placeholder="e.g. Cyberpunk Tech, Royal Heritage"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Setting</label>
              <select
                value={formData.preferences.indoorOutdoor}
                onChange={(e) => handlePreferenceChange('indoorOutdoor', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="Indoor">Indoor (AC Hall)</option>
                <option value="Outdoor">Outdoor Lawn / Grounds</option>
                <option value="Both">Both (Indoor + Outdoor)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Special Equipment / Logistics Requirements</label>
            <textarea
              rows={3}
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="e.g. High-speed 1Gbps internet, 4K LED screen, VIP valet parking, medical ambulance on standby..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* AI Generator Trigger Banner */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs mb-1">
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                <span>AI Operational Synthesis</span>
              </div>
              <h4 className="text-sm font-bold text-white">Generate Complete Event Plan & Budget</h4>
              <p className="text-xs text-indigo-200">
                Calculates line-item budget, hour-by-hour timeline, volunteer counts, and risk mitigation.
              </p>
            </div>

            <button
              type="button"
              disabled={aiGenerating}
              onClick={handleGenerateAIPlan}
              className="px-6 py-3 rounded-xl bg-white text-indigo-900 text-xs font-extrabold hover:bg-slate-100 shadow-md transition-all active:scale-95 flex items-center flex-shrink-0"
            >
              {aiGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
                  Generate AI Plan
                </>
              )}
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AI Plan Preview & Approval */}
      {step === 4 && aiPlan && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Plan Synthesis Preview</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {formData.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{aiPlan.summary}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateAIPlan}
                  disabled={aiGenerating}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Regenerate
                </button>
              </div>
            </div>

            {/* 1. Budget Breakdown */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                1. Recommended Budget Distribution (Total: {formatCurrency(formData.budget)})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aiPlan.budgetPlan?.map((b, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{b.category}</span>
                      <span className="text-[10px] text-slate-500">{b.description}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-indigo-600 block">{formatCurrency(b.amount)}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{b.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Resources Required */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                2. Operational Resource Formula
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aiPlan.resources?.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{r.item}</span>
                      <span className="text-indigo-700">{r.quantity}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{r.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Top Risks Identified */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                3. Risk Assessment & Mitigations
              </h3>
              <div className="space-y-2">
                {aiPlan.risks?.map((risk, i) => (
                  <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <span className="flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                        {risk.title}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded-md bg-amber-200 text-amber-900">
                        {risk.severity} Severity
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1"><strong>Mitigation:</strong> {risk.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ← Back to Edit
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleFinalSubmit}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center active:scale-95"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving Event & Initializing Workspace...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Plan & Launch Event Workspace
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
