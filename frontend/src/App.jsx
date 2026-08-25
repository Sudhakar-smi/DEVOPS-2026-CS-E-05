import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Route Guards
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Events from './pages/public/Events';
import EventDetailsPublic from './pages/public/EventDetailsPublic';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import MyEvents from './pages/organizer/MyEvents';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import EventDetails from './pages/organizer/EventDetails';
import AIPlannerStandalone from './pages/organizer/AIPlannerStandalone';
import OrganizerProfile from './pages/organizer/OrganizerProfile';

// Attendee Pages
import MyRegistrations from './pages/attendee/MyRegistrations';
import AttendeeProfile from './pages/attendee/AttendeeProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import EventMonitoring from './pages/admin/EventMonitoring';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetailsPublic />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Attendee Protected Pages */}
        <Route
          path="/attendee/my-registrations"
          element={
            <ProtectedRoute>
              <MyRegistrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendee/profile"
          element={
            <ProtectedRoute>
              <AttendeeProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Organizer Workspace (Protected, Role-based) */}
      <Route
        path="/organizer"
        element={
          <RoleRoute allowedRoles={['organizer', 'admin']}>
            <DashboardLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/organizer/dashboard" replace />} />
        <Route path="dashboard" element={<OrganizerDashboard />} />
        <Route path="events" element={<MyEvents />} />
        <Route path="events/new" element={<CreateEvent />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="events/:id/edit" element={<EditEvent />} />
        <Route path="ai-planner" element={<AIPlannerStandalone />} />
        <Route path="profile" element={<OrganizerProfile />} />
      </Route>

      {/* Admin Portal (Protected, Admin Only) */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="events" element={<EventMonitoring />} />
        <Route path="profile" element={<OrganizerProfile />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
