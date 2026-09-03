import React from 'react';
import { Sparkles, Cpu, Database, Shield, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="py-12 lg:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>System Architecture & Engineering</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          AI Event Planner’s Assistant
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-4 leading-relaxed">
          An Intelligent Full-Stack Event Planning and Management System designed to transform how individuals and organizations orchestrate large-scale events.
        </p>
      </div>

      {/* Architecture Diagram Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-12">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
          <Cpu className="w-5 h-5 mr-2 text-indigo-600" />
          Full-Stack Processing Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">1</span>
            <h4 className="font-bold text-xs text-slate-800">Event Parameters</h4>
            <p className="text-[11px] text-slate-500 mt-1">Category, guest count, budget, duration & preferences collected.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">2</span>
            <h4 className="font-bold text-xs text-slate-800">AI Synthesizer</h4>
            <p className="text-[11px] text-slate-500 mt-1">Modular AI service generates budget, multi-day schedule, tasks & risks.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">3</span>
            <h4 className="font-bold text-xs text-slate-800">Mongoose DB Sync</h4>
            <p className="text-[11px] text-slate-500 mt-1">Structured JSON parsed and stored into relational MongoDB models.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="w-7 h-7 rounded-full bg-pink-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">4</span>
            <h4 className="font-bold text-xs text-slate-800">Live Management</h4>
            <p className="text-[11px] text-slate-500 mt-1">Real-time What-If simulator, context-aware chatbot & feedback analytics.</p>
          </div>
        </div>
      </div>

      {/* Core Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-base text-slate-900 mb-3 flex items-center text-indigo-700">
            <Zap className="w-4 h-4 mr-2" />
            Why Traditional Spreadsheets Fail
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start">
              <span className="text-rose-500 mr-2 font-bold">✕</span>
              Static spreadsheets don't automatically adjust volunteer ratios when headcount surges.
            </li>
            <li className="flex items-start">
              <span className="text-rose-500 mr-2 font-bold">✕</span>
              Risk detection and queue bottleneck predictions are missing.
            </li>
            <li className="flex items-start">
              <span className="text-rose-500 mr-2 font-bold">✕</span>
              Attendee registrations, check-in statuses, and reviews are disconnected from the budget.
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-base text-slate-900 mb-3 flex items-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            How Our AI Solves This
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2 font-bold">✓</span>
              Mathematically guaranteed budget allocations that never exceed your financial ceiling.
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2 font-bold">✓</span>
              Interactive What-If simulation engine to model sudden scope changes.
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2 font-bold">✓</span>
              Context-aware chatbot assistant answering live queries from the real event database.
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-3xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold">Experience the System in Action</h3>
        <p className="text-xs text-indigo-100 mt-2 max-w-md mx-auto">
          Explore public events or sign in with 1-click Demo credentials to launch the organizer workspace.
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            to="/events"
            className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-bold shadow-md hover:bg-slate-50 transition-all"
          >
            Explore Events
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-indigo-900/60 text-white border border-indigo-300/30 text-xs font-bold hover:bg-indigo-900 transition-all"
          >
            Demo Login
          </Link>
        </div>
      </div>
    </div>
  );
}
