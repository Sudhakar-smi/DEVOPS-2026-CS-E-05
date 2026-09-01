import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AIChatWidget from '../components/AIChatWidget';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role="organizer" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      {/* Floating Assistant Accessible Anywhere in Dashboard */}
      <AIChatWidget />
    </div>
  );
}
