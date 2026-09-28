import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, DollarSign, Users, Calendar, AlertTriangle, Printer, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AIPlannerStandalone() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: 'Tech & Music Youth Festival 2026',
    categoryGroup: 'Entertainment',
    type: 'Concert',
    budget: 800000,
    expectedAttendees: 600,
    duration: '2 days',
    location: 'Mumbai Arena',
    preferences: {
      cateringType: 'Food Trucks & Refreshments',
      theme: 'Neon Music & Light',
      indoorOutdoor: 'Outdoor'
    },
    requirements: '100kW Sound Rig, Artist green rooms, medical ambulance on standby'
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setAiGenerating(true);
    try {
      const res = await api.post('/ai/generate-plan', formData);
      if (res.data.success) {
        setGeneratedPlan(res.data.data);
        success('AI Event Blueprint synthesized successfully!');
      }
    } catch (err) {
      error('Failed to generate AI plan');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateRealEventFromPlan = async () => {
    try {
      const res = await api.post('/events', {
        ...formData,
        autoGeneratePlan: false
      });
      if (res.data.success) {
        const createdEvent = res.data.data;
        if (generatedPlan) {
          await api.post('/ai/save-plan', {
            eventId: createdEvent._id,
            plan: generatedPlan,
            applyToBudget: true,
            applyToSchedule: true,
            applyToChecklist: true
          });
        }
        success('Event created and initialized in your dashboard!');
        navigate(`/organizer/events/${createdEvent._id}`);
      }
    } catch (err) {
      error('Failed to create event');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Standalone AI Planner Sandbox</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          AI Event Architect Sandbox
        </h1>
        <p className="text-xs text-purple-200 mt-1 max-w-2xl">
          Synthesize custom event blueprints on demand. Test line-item budget distributions, multi-day schedules, and operational risk mitigation formulas before saving to your live portfolio.
        </p>
      </div>

      {/* Input Parameters Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          Define Hypothetical Event Parameters
        </h3>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Concept / Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Type / Category</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Budget (₹)</label>
              <input
                type="number"
                min="10000"
                step="25000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Attendees</label>
              <input
                type="number"
                min="10"
                value={formData.expectedAttendees}
                onChange={(e) => setFormData({ ...formData, expectedAttendees: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1 day">1 Day</option>
                <option value="2 days">2 Days</option>
                <option value="3 days">3 Days</option>
                <option value="5 days">5 Days</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={aiGenerating}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {aiGenerating ? 'Synthesizing Architecture...' : 'Generate Blueprint'}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Blueprint View */}
      {generatedPlan && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Synthesized Blueprint</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{formData.name}</h2>
                <p className="text-xs text-slate-500 mt-1">{generatedPlan.summary}</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center"
                >
                  <Printer className="w-4 h-4 mr-1.5" /> Print
                </button>
                <button
                  onClick={handleCreateRealEventFromPlan}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Convert to Real Event
                </button>
              </div>
            </div>

            {/* Budget Breakdown */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                1. Budget Allocations (Ceiling: {formatCurrency(formData.budget)})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {generatedPlan.budgetPlan?.map((b, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{b.category}</span>
                      <span className="text-[10px] text-slate-500">{b.percentage}% Allocation</span>
                    </div>
                    <span className="font-extrabold text-indigo-600">{formatCurrency(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Required */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                2. Calculated Operational Resources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {generatedPlan.resources?.map((r, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{r.item}</span>
                      <span className="text-purple-700 font-extrabold">{r.quantity}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{r.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Risks */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                3. Risk Matrix & Mitigations
              </h3>
              <div className="space-y-2">
                {generatedPlan.risks?.map((r, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs">
                    <div className="flex justify-between font-bold text-amber-900 mb-0.5">
                      <span>⚠️ {r.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 rounded-md uppercase">{r.severity}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Mitigation: {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
