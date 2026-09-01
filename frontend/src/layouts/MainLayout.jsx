import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Sparkles, Heart, Shield, Award, ArrowRight } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Modern SaaS Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white font-extrabold text-base">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>AI Event Planner</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                An intelligent full-stack event planning, operational resource optimization, and what-if simulation platform powered by advanced AI.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Event Categories</h4>
              <ul className="space-y-2">
                <li><Link to="/events?category=Educational" className="hover:text-indigo-400 transition-colors">Hackathons & Tech Fests</Link></li>
                <li><Link to="/events?category=Personal" className="hover:text-indigo-400 transition-colors">Royal Weddings & Anniversaries</Link></li>
                <li><Link to="/events?category=Professional" className="hover:text-indigo-400 transition-colors">Corporate Summits & Conferences</Link></li>
                <li><Link to="/events?category=Entertainment" className="hover:text-indigo-400 transition-colors">Live Music Concerts & Fests</Link></li>
                <li><Link to="/events?category=Sports" className="hover:text-indigo-400 transition-colors">Sports Leagues & Tournaments</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">AI Capabilities</h4>
              <ul className="space-y-2">
                <li className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Automated Budget Allocation</li>
                <li className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Dynamic Multi-Day Schedule</li>
                <li className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> What-If Scenario Simulator</li>
                <li className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Contextual Event Assistant</li>
                <li className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Feedback Sentiment Analysis</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Quick Access</h4>
              <ul className="space-y-2">
                <li><Link to="/events" className="hover:text-indigo-400 transition-colors">Public Event Catalog</Link></li>
                <li><Link to="/about" className="hover:text-indigo-400 transition-colors">Architecture & AI Design</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Organizer Login</Link></li>
                <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Create Organizer Account</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500">
            <p>© {new Date().getFullYear()} AI Event Planner’s Assistant. Production Full-Stack MERN System.</p>
            <p className="mt-2 sm:mt-0 flex items-center">
              Built with precision & intelligent AI algorithms.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
