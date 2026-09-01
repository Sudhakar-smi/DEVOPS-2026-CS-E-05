import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role="admin" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
