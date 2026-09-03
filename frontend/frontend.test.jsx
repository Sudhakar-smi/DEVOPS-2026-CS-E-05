import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './src/pages/public/Login';
import Register from './src/pages/public/Register';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import api from './src/services/api';

// Helper wrapper providing Router, Auth, and Toast contexts
const renderWithProviders = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <ToastProvider>
          {ui}
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Authentication Pages', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the Login page with all required headings, inputs, demo buttons, and navigation links', () => {
    renderWithProviders(<Login />, { route: '/login' });

    // Verify main headings and descriptive text
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByText(/access your ai event management workspace/i)).toBeInTheDocument();

    // Verify 1-Click Instant Demo Login evaluation box and buttons
    expect(screen.getByText(/1-click instant demo login/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /organizer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /attendee/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();

    // Verify Email field with correct attributes
    expect(screen.getByText(/^email address$/i)).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText('name@company.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toBeRequired();

    // Verify Password field with correct attributes
    expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toBeRequired();

    // Verify Submit button
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');

    // Verify Register link
    const registerLink = screen.getByRole('link', { name: /create an account/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('renders the Register page with headings, role selector, form inputs, and navigation links', () => {
    renderWithProviders(<Register />, { route: '/register' });

    // Verify main headings and descriptive text
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByText(/join thousands of event organizers and attendees/i)).toBeInTheDocument();

    // Verify Role Selector buttons
    expect(screen.getByText(/i am signing up as:/i)).toBeInTheDocument();
    const organizerRoleBtn = screen.getByRole('button', { name: /🎉 event organizer/i });
    const attendeeRoleBtn = screen.getByRole('button', { name: /🎟️ event attendee/i });
    expect(organizerRoleBtn).toBeInTheDocument();
    expect(attendeeRoleBtn).toBeInTheDocument();

    // Verify Full Name input
    expect(screen.getByText(/full name \*/i)).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('e.g. Priya Sharma');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('name', 'name');
    expect(nameInput).toBeRequired();

    // Verify Email Address input
    expect(screen.getByText(/email address \*/i)).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText('priya@company.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('name', 'email');
    expect(emailInput).toBeRequired();

    // Verify Password input
    expect(screen.getByText(/password \* \(min 6 chars\)/i)).toBeInTheDocument();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('name', 'password');
    expect(passwordInput).toBeRequired();

    // Verify optional fields: Organization & Phone Number
    expect(screen.getByText(/organization \/ college/i)).toBeInTheDocument();
    const orgInput = screen.getByPlaceholderText('e.g. Apex Events');
    expect(orgInput).toBeInTheDocument();
    expect(orgInput).toHaveAttribute('name', 'organization');

    expect(screen.getByText(/phone number/i)).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('+91 98765 43210');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('name', 'phone');

    // Verify Submit button
    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');

    // Verify Sign In link
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });
});

describe('Login/Register Form Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('validates empty/missing fields on Login and shows toast error', async () => {
    renderWithProviders(<Login />, { route: '/login' });
    const spyPost = vi.spyOn(api, 'post');

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);

    expect(await screen.findByText('Please enter both email and password')).toBeInTheDocument();
    expect(spyPost).not.toHaveBeenCalled();
  });

  it('handles backend authentication failure on Login with invalid credentials', async () => {
    renderWithProviders(<Login />, { route: '/login' });

    vi.spyOn(api, 'post').mockRejectedValueOnce({
      response: { data: { message: 'Invalid email or password' } }
    });

    const emailInput = screen.getByPlaceholderText('name@company.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.submit(form);

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('handles successful Login submission with valid credentials and sets token', async () => {
    renderWithProviders(<Login />, { route: '/login' });

    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        token: 'jwt-auth-test-token-12345',
        user: {
          _id: 'u1',
          name: 'Rajesh Kumar',
          email: 'rajesh@example.com',
          role: 'organizer'
        }
      }
    });

    const emailInput = screen.getByPlaceholderText('name@company.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');

    fireEvent.change(emailInput, { target: { value: 'rajesh@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
    fireEvent.submit(form);

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'rajesh@example.com',
      password: 'correctpassword'
    });

    expect(await screen.findByText('Welcome back, Rajesh Kumar!')).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('jwt-auth-test-token-12345');
    });
  });

  it('validates required fields on Register and shows toast error', async () => {
    renderWithProviders(<Register />, { route: '/register' });
    const spyPost = vi.spyOn(api, 'post');

    const form = screen.getByRole('button', { name: /complete registration/i }).closest('form');
    fireEvent.submit(form);

    expect(await screen.findByText('Please fill in all required fields')).toBeInTheDocument();
    expect(spyPost).not.toHaveBeenCalled();
  });

  it('enforces password length validation (minimum 6 characters) on Register', async () => {
    renderWithProviders(<Register />, { route: '/register' });
    const spyPost = vi.spyOn(api, 'post');

    const nameInput = screen.getByPlaceholderText('e.g. Priya Sharma');
    const emailInput = screen.getByPlaceholderText('priya@company.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = screen.getByRole('button', { name: /complete registration/i }).closest('form');

    fireEvent.change(nameInput, { target: { value: 'Priya Sharma' } });
    fireEvent.change(emailInput, { target: { value: 'priya@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } }); // 5 chars (< 6)
    fireEvent.submit(form);

    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(spyPost).not.toHaveBeenCalled();
  });

  it('handles successful Register submission with valid credentials and sets token', async () => {
    renderWithProviders(<Register />, { route: '/register' });

    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        token: 'jwt-register-token-67890',
        user: {
          _id: 'u2',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          role: 'organizer',
          organization: 'Apex Events',
          phone: '+91 98765 43210'
        }
      }
    });

    const nameInput = screen.getByPlaceholderText('e.g. Priya Sharma');
    const emailInput = screen.getByPlaceholderText('priya@company.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const orgInput = screen.getByPlaceholderText('e.g. Apex Events');
    const phoneInput = screen.getByPlaceholderText('+91 98765 43210');
    const form = screen.getByRole('button', { name: /complete registration/i }).closest('form');

    fireEvent.change(nameInput, { target: { value: 'Priya Sharma' } });
    fireEvent.change(emailInput, { target: { value: 'priya@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securePass123' } });
    fireEvent.change(orgInput, { target: { value: 'Apex Events' } });
    fireEvent.change(phoneInput, { target: { value: '+91 98765 43210' } });
    fireEvent.submit(form);

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'securePass123',
      role: 'organizer',
      organization: 'Apex Events',
      phone: '+91 98765 43210'
    });

    expect(await screen.findByText('Account created! Welcome, Priya Sharma')).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('jwt-register-token-67890');
    });
  });

  it('handles backend registration failure and displays error toast', async () => {
    renderWithProviders(<Register />, { route: '/register' });

    vi.spyOn(api, 'post').mockRejectedValueOnce({
      response: { data: { message: 'User already exists with this email' } }
    });

    const nameInput = screen.getByPlaceholderText('e.g. Priya Sharma');
    const emailInput = screen.getByPlaceholderText('priya@company.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = screen.getByRole('button', { name: /complete registration/i }).closest('form');

    fireEvent.change(nameInput, { target: { value: 'Priya Sharma' } });
    fireEvent.change(emailInput, { target: { value: 'priya@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securePass123' } });
    fireEvent.submit(form);

    expect(await screen.findByText('User already exists with this email')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
