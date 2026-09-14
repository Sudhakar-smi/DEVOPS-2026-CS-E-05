import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  CheckSquare,
  Clock,
  MapPin,
  AlertTriangle,
  Star,
  Plus,
  Edit,
  Trash2,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  Send,
  MessageSquare,
  Bot,
  ShieldAlert,
  Printer,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Filter,
  UserPlus,
  FileJson
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, downloadCSV } from '../../utils/formatters';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AIChatWidget from '../../components/AIChatWidget';

export default function EventDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error, info } = useToast();

  // Child data states
  const [aiPlan, setAiPlan] = useState(null);
  const [budgetData, setBudgetData] = useState({ summary: {}, data: [] });
  const [tasks, setTasks] = useState([]);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState(null);
  const [attendeeAnalysis, setAttendeeAnalysis] = useState(null);
  const [vendors, setVendors] = useState([]);

  // Filter & Search states
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState('all');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all');

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [manualGuestModalOpen, setManualGuestModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [customAIRequirement, setCustomAIRequirement] = useState('');

  // Form states for modals
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    deadline: '',
    category: 'General',
    status: 'pending'
  });

  const [budgetForm, setBudgetForm] = useState({
    category: '',
    plannedAmount: '',
    actualAmount: 0,
    notes: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    day: 1,
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    title: '',
    description: '',
    location: 'Main Stage',
    speakerOrLead: ''
  });

  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    ticketType: 'General Admission',
    dietaryPreferences: 'Standard',
    notes: '',
    status: 'registered'
  });

  // What-If Simulator State
  const [simGuests, setSimGuests] = useState(100);
  const [simBudget, setSimBudget] = useState(100000);
  const [simDuration, setSimDuration] = useState('1 day');
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchEverything();
  }, [id]);

  const fetchEverything = async () => {
    try {
      setLoading(true);
      const [resEvent, resPlan, resBudget, resTasks, resSchedule, resAttendees, resFeedback, resVendors] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/ai/plan/${id}`).catch(() => ({ data: { data: null } })),
        api.get(`/events/${id}/budget`),
        api.get(`/events/${id}/tasks`),
        api.get(`/events/${id}/schedule`),
        api.get(`/events/${id}/attendees`),
        api.get(`/events/${id}/feedback`),
        api.get('/vendors')
      ]);

      if (resEvent.data.success) {
        setEvent(resEvent.data.data);
        setSimGuests(resEvent.data.data.expectedAttendees || 100);
        setSimBudget(resEvent.data.data.budget || 100000);
        setSimDuration(resEvent.data.data.duration || '1 day');
      }
      if (resPlan.data?.data) setAiPlan(resPlan.data.data);
      if (resBudget.data.success) setBudgetData(resBudget.data);
      if (resTasks.data.success) setTasks(resTasks.data.data);
      if (resSchedule.data.success) setScheduleDays(resSchedule.data.days || []);
      if (resAttendees.data.success) setAttendees(resAttendees.data.data);
      if (resFeedback.data.success) setFeedbacks(resFeedback.data.data);
      if (resVendors.data.success) setVendors(resVendors.data.data || []);
    } catch (err) {
      console.error('Failed to load event details:', err.message);
      error('Could not load complete event workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // --- AI ACTIONS ---

  const handleGenerateAIPlan = async () => {
    setAiGenerating(true);
    try {
      const res = await api.post('/ai/generate-plan', {
        eventId: id,
        name: event.name,
        type: event.type,
        categoryGroup: event.categoryGroup,
        budget: event.budget,
        expectedAttendees: event.expectedAttendees,
        duration: event.duration,
        location: event.location,
        preferences: event.preferences,
        requirements: customAIRequirement
          ? `${event.requirements || ''}. Specific instruction: ${customAIRequirement}`
          : event.requirements
      });

      if (res.data.success) {
        setAiPlan(res.data.data);
        success('AI Plan generated! Review recommendations and click "Sync to Workspace".');
        setActiveTab('ai-plan');
      }
    } catch (err) {
      error('Failed to generate AI plan');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAIPlan = async () => {
    if (!aiPlan) return;
    try {
      const res = await api.post('/ai/save-plan', {
        eventId: id,
        plan: aiPlan,
        applyToBudget: true,
        applyToSchedule: true,
        applyToChecklist: true
      });
      if (res.data.success) {
        success('AI Plan synced to Budget, Schedule & Task modules!');
        fetchEverything();
      }
    } catch (err) {
      error('Failed to apply AI Plan');
    }
  };

  const handleExportPlanJSON = () => {
    if (!aiPlan) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(aiPlan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai_plan_${event.name.replace(/[^a-z0-9]/gi, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('AI Plan exported as JSON file');
  };

  const handleRunWhatIf = async () => {
    setSimulating(true);
    try {
      const res = await api.post('/ai/what-if', {
        eventId: id,
        currentValues: {
          guests: event.expectedAttendees,
          budget: event.budget,
          duration: event.duration,
          type: event.type,
          location: event.location
        },
        simulatedValues: {
          guests: simGuests,
          budget: simBudget,
          duration: simDuration,
          location: event.location
        }
      });
      if (res.data.success) {
        setSimResult(res.data.data);
        success('Scenario simulated successfully!');
      }
    } catch (err) {
      error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyWhatIfChanges = async () => {
    if (!simResult) return;
    try {
      const res = await api.post('/ai/apply-what-if', {
        eventId: id,
        simulatedValues: {
          guests: simGuests,
          budget: simBudget,
          duration: simDuration
        }
      });
      if (res.data.success) {
        success('Simulated changes applied to real event! Refreshing metrics...');
        fetchEverything();
      }
    } catch (err) {
      error('Failed to apply simulation changes');
    }
  };

  const handleAnalyzeFeedback = async () => {
    try {
      const res = await api.post('/ai/analyze-feedback', { eventId: id });
      if (res.data.success) {
        setFeedbackAnalysis(res.data.data);
        success('Feedback analyzed with AI Sentiment Engine');
      }
    } catch (err) {
      error('Failed to analyze feedback');
    }
  };

  const handleAnalyzeAttendees = async () => {
    try {
      const res = await api.post('/ai/analyze-attendees', { eventId: id });
      if (res.data.success) {
        setAttendeeAnalysis(res.data.data);
        success('Attendee capacity insights updated');
      }
    } catch (err) {
      error('Failed to analyze attendees');
    }
  };

  // --- TASK CRUD ---

  const handleOpenTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedTo || '',
        priority: task.priority || 'medium',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        category: task.category || 'General',
        status: task.status || 'pending'
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        deadline: '',
        category: 'General',
        status: 'pending'
      });
    }
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, taskForm);
        success('Task updated successfully');
      } else {
        await api.post(`/events/${id}/tasks`, taskForm);
        success('Task created successfully');
      }
      setTaskModalOpen(false);
      const refTasks = await api.get(`/events/${id}/tasks`);
      setTasks(refTasks.data.data);
    } catch (err) {
      error('Failed to save task');
    }
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/tasks/${task._id}`, { status: nextStatus });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: nextStatus } : t));
    } catch (err) {
      error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      success('Task removed');
    } catch (err) {
      error('Failed to delete task');
    }
  };

  // --- BUDGET CRUD ---

  const handleOpenBudgetModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetForm({
        category: budget.category,
        plannedAmount: budget.plannedAmount,
        actualAmount: budget.actualAmount || 0,
        notes: budget.notes || ''
      });
    } else {
      setEditingBudget(null);
      setBudgetForm({
        category: '',
        plannedAmount: '',
        actualAmount: 0,
        notes: ''
      });
    }
    setBudgetModalOpen(true);
  };

  const handleSaveBudgetItem = async (e) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await api.put(`/budget/${editingBudget._id}`, budgetForm);
        success('Budget item updated');
      } else {
        await api.post(`/events/${id}/budget`, budgetForm);
        success('Budget item logged');
      }
      setBudgetModalOpen(false);
      const refBud = await api.get(`/events/${id}/budget`);
      setBudgetData(refBud.data);
    } catch (err) {
      error('Failed to save budget item');
    }
  };

  const handleDeleteBudgetItem = async (budgetId) => {
    try {
      await api.delete(`/budget/${budgetId}`);
      const refBud = await api.get(`/events/${id}/budget`);
      setBudgetData(refBud.data);
      success('Budget item removed');
    } catch (err) {
      error('Failed to delete budget item');
    }
  };

  // --- SCHEDULE CRUD ---

  const handleOpenScheduleModal = (session = null) => {
    if (session) {
      setEditingSchedule(session);
      setScheduleForm({
        day: session.day || 1,
        startTime: session.startTime || '09:00 AM',
        endTime: session.endTime || '10:30 AM',
        title: session.title || '',
        description: session.description || '',
        location: session.location || 'Main Stage',
        speakerOrLead: session.speakerOrLead || ''
      });
    } else {
      setEditingSchedule(null);
      setScheduleForm({
        day: 1,
        startTime: '09:00 AM',
        endTime: '10:30 AM',
        title: '',
        description: '',
        location: 'Main Stage',
        speakerOrLead: ''
      });
    }
    setScheduleModalOpen(true);
  };

  const handleSaveScheduleItem = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await api.put(`/schedule/${editingSchedule._id}`, scheduleForm);
        success('Schedule session updated');
      } else {
        await api.post(`/events/${id}/schedule`, scheduleForm);
        success('Schedule session added');
      }
      setScheduleModalOpen(false);
      const refSched = await api.get(`/events/${id}/schedule`);
      setScheduleDays(refSched.data.days || []);
    } catch (err) {
      error('Failed to save schedule item');
    }
  };

  // --- ATTENDEE & GUEST ACTIONS ---

  const handleAddGuestManual = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/events/${id}/attendees/manual`, guestForm);
      if (res.data.success) {
        success(`Guest ${guestForm.name} added to roster`);
        setManualGuestModalOpen(false);
        setGuestForm({ name: '', email: '', ticketType: 'General Admission', dietaryPreferences: 'Standard', notes: '', status: 'registered' });
        const refAtt = await api.get(`/events/${id}/attendees`);
        setAttendees(refAtt.data.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add guest');
    }
  };

  const handleToggleAttendeeCheckIn = async (attendee) => {
    const nextStatus = attendee.status === 'checked-in' ? 'registered' : 'checked-in';
    try {
      await api.put(`/attendees/${attendee._id}/status`, { status: nextStatus });
      setAttendees(prev => prev.map(a => a._id === attendee._id ? { ...a, status: nextStatus } : a));
      success(`Attendee marked as ${nextStatus}`);
    } catch (err) {
      error('Failed to update attendee status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get(`/events/${id}/attendees/export-csv`, { responseType: 'blob' });
      downloadCSV(`attendees-${event.name.replace(/[^a-z0-9]/gi, '_')}.csv`, res.data);
      success('Attendee CSV roster downloaded');
    } catch (err) {
      error('Export failed');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Opening event management workspace & AI engine..." isAI />;
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Event Not Found</h2>
        <Link to="/organizer/events" className="text-indigo-600 font-semibold text-xs mt-2 inline-block">
          ← Return to My Events
        </Link>
      </div>
    );
  }

  const budgetChartData = budgetData.data?.map(b => ({
    name: b.category,
    planned: b.plannedAmount,
    actual: b.actualAmount
  })) || [];

  // Filtered lists
  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(taskSearch.toLowerCase()));
    const matchStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
    const matchPriority = taskPriorityFilter === 'all' || t.priority === taskPriorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const filteredAttendees = attendees.filter(a => {
    const nameMatch = a.userId?.name?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      a.userId?.email?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      (a.qrCodeRef && a.qrCodeRef.toLowerCase().includes(attendeeSearch.toLowerCase()));
    const statusMatch = attendeeStatusFilter === 'all' || a.status === attendeeStatusFilter;
    return nameMatch && statusMatch;
  });

  const filteredFeedbacks = feedbacks.filter(f => {
    if (feedbackRatingFilter === 'all') return true;
    return f.rating === Number(feedbackRatingFilter);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700">
                {event.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700">
                {event.categoryGroup}
              </span>
              <Badge variant={event.status}>{event.status}</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {event.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                {formatDate(event.date)} ({event.duration})
              </span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                {event.venueName ? `${event.venueName}, ` : ''}{event.location}
              </span>
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                {event.registeredAttendees || attendees.length} / {event.expectedAttendees} Guests
              </span>
              <span className="flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                Budget: {formatCurrency(event.budget)}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateAIPlan}
              disabled={aiGenerating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {aiGenerating ? 'Synthesizing...' : 'Generate AI Plan'}
            </button>

            <button
              onClick={() => handleTabChange('what-if')}
              className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-colors flex items-center"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              What-If Simulator
            </button>

            <Link
              to={`/events/${id}`}
              target="_blank"
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Public View
            </Link>

            <Link
              to={`/organizer/events/${id}/edit`}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Edit Event Parameters"
            >
              <Edit className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* HORIZONTAL WORKSPACE TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-4 overflow-x-auto">
        <div className="flex space-x-1 min-w-max py-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'ai-plan', label: 'AI Plan & Synthesis', isAI: true },
            { id: 'budget', label: `Budget (${formatCurrency(budgetData.summary?.actualSum || 0)})` },
            { id: 'schedule', label: `Schedule (${scheduleDays.length} Days)` },
            { id: 'tasks', label: `Tasks (${tasks.length})` },
            { id: 'attendees', label: `Attendees (${attendees.length})` },
            { id: 'what-if', label: 'What-If Simulator', isAI: true },
            { id: 'ai-assistant', label: 'AI Assistant', isAI: true },
            { id: 'feedback', label: `Feedback (${feedbacks.length})` },
            { id: 'ai-insights', label: 'Attendee Insights', isAI: true },
            { id: 'vendors', label: 'Vendors' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.isAI && <Sparkles className={`w-3 h-3 ${activeTab === tab.id ? 'text-white' : 'text-purple-600'}`} />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Budget Spent</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(budgetData.summary?.actualSum || 0)}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Sanctioned: {formatCurrency(event.budget)}</span>
                <span className="font-bold text-indigo-600">{budgetData.summary?.utilizationRate || 0}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Confirmed Attendees</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {attendees.length} Guests
              </p>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Target: {event.expectedAttendees}</span>
                <span className="font-bold text-indigo-600">
                  {Math.round((attendees.length / (event.expectedAttendees || 1)) * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Task Completion</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {tasks.filter(t => t.status === 'completed').length} / {tasks.length} Done
              </p>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Pending: {tasks.filter(t => t.status !== 'completed').length}</span>
                <span className="font-bold text-indigo-600">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Attendee Rating</span>
              <p className="text-xl font-extrabold text-amber-500 mt-1 flex items-center">
                {event.averageRating ? `${event.averageRating} ★` : 'No reviews'}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                Based on {feedbacks.length} submitted reviews
              </div>
            </div>
          </div>

          {/* Strategic Overview & Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Event Overview & Plan Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {event.description}
              </p>

              {aiPlan && (
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="flex items-center space-x-2 text-purple-800 font-bold text-xs mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Plan Operational Strategy</span>
                  </div>
                  <p className="text-xs text-purple-950 leading-relaxed">{aiPlan.summary}</p>
                </div>
              )}

              {/* Quick Health Indicators */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Key Operational Ratios</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Volunteers</span>
                    <span className="font-extrabold text-indigo-700">{Math.max(4, Math.ceil(event.expectedAttendees / 40))} Staff</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Entry Desks</span>
                    <span className="font-extrabold text-indigo-700">{Math.max(2, Math.ceil(event.expectedAttendees / 120))} Desks</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Meals (+8%)</span>
                    <span className="font-extrabold text-indigo-700">{Math.round(event.expectedAttendees * 1.08)} Plates</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Chairs</span>
                    <span className="font-extrabold text-indigo-700">{Math.round(event.expectedAttendees * 1.05)} Units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Module Shortcuts</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleTabChange('ai-plan')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 transition-colors flex items-center justify-between text-xs font-bold text-slate-800"
                >
                  <span className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                    AI Plan & Risk Blueprint
                  </span>
                  <span className="text-indigo-600">→</span>
                </button>

                <button
                  onClick={() => handleTabChange('what-if')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 transition-colors flex items-center justify-between text-xs font-bold text-slate-800"
                >
                  <span className="flex items-center">
                    <Sliders className="w-4 h-4 mr-2 text-indigo-600" />
                    Simulate Headcount/Budget
                  </span>
                  <span className="text-purple-600">→</span>
                </button>

                <button
                  onClick={() => handleTabChange('budget')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 transition-colors flex items-center justify-between text-xs font-bold text-slate-800"
                >
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-emerald-600" />
                    Manage Line-Item Expenses
                  </span>
                  <span className="text-emerald-600">→</span>
                </button>

                <button
                  onClick={() => handleTabChange('tasks')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 transition-colors flex items-center justify-between text-xs font-bold text-slate-800"
                >
                  <span className="flex items-center">
                    <CheckSquare className="w-4 h-4 mr-2 text-amber-600" />
                    Assign Team Logistics Tasks
                  </span>
                  <span className="text-amber-600">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI PLAN & SYNTHESIS */}
      {/* ========================================================================= */}
      {activeTab === 'ai-plan' && (
        <div className="space-y-6">
          {/* Custom Instruction Box for AI Plan */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Optional AI Directive (e.g. 'Prioritize organic farm-to-table food' or 'Include VIP red carpet')..."
              value={customAIRequirement}
              onChange={(e) => setCustomAIRequirement(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleGenerateAIPlan}
              disabled={aiGenerating}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex-shrink-0 flex items-center shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {aiGenerating ? 'Synthesizing...' : 'Generate Blueprint'}
            </button>
          </div>

          {!aiPlan ? (
            <EmptyState
              icon={Sparkles}
              title="No AI Plan Generated Yet"
              description="Click the button below to generate a tailored budget breakdown, schedule, resources formula, and risk analysis for this event."
              actionText="Generate AI Plan Now"
              onActionClick={handleGenerateAIPlan}
            />
          ) : (
            <>
              {/* AI Plan Header Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Event Blueprint</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{aiPlan.summary}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportPlanJSON}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center"
                    title="Export Plan as JSON"
                  >
                    <FileJson className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                    Export JSON
                  </button>
                  <button
                    onClick={handleGenerateAIPlan}
                    disabled={aiGenerating}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Regenerate
                  </button>
                  <button
                    onClick={handleApplyAIPlan}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Sync to Workspace
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                    title="Print / Save as PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Recommended Budget Allocation */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-indigo-600" />
                  AI Recommended Budget Allocation (Total: {formatCurrency(event.budget)})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiPlan.budgetPlan?.map((b, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs text-slate-900">{b.category}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                            {b.percentage}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{b.description}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/60 text-right">
                        <span className="font-extrabold text-sm text-indigo-600">{formatCurrency(b.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Resources & Infrastructure Formulas */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-600" />
                  Required Resources & Crowd Management Formula
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiPlan.resources?.map((r, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>{r.item}</span>
                        <span className="text-purple-700 font-extrabold text-sm">{r.quantity}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{r.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Risk Assessment & Mitigations */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2 text-rose-600" />
                  Operational Risk Matrix & Mitigation Strategies
                </h3>

                <div className="space-y-3">
                  {aiPlan.risks?.map((risk, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="text-slate-900 text-xs flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                          {risk.title}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          risk.severity === 'High' || risk.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {risk.severity} Severity
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1"><strong>Reason:</strong> {risk.reason}</p>
                      <p className="text-[11px] text-indigo-900 font-semibold mt-1 bg-indigo-50 p-2 rounded-xl">
                        💡 <strong>Mitigation:</strong> {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Actionable Recommendations & Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Strategic AI Recommendations</h3>
                  <div className="space-y-3">
                    {aiPlan.recommendations?.map((rec, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950">
                        <h4 className="font-bold mb-1">{rec.title}</h4>
                        <p className="text-[11px] text-slate-600">{rec.explanation}</p>
                        <p className="text-[11px] font-semibold text-emerald-800 mt-1">Action: {rec.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Preparation Checklist Timeline</h3>
                  <div className="space-y-2">
                    {aiPlan.checklist?.map((chk, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        <span className="font-medium text-slate-800">{chk.task}</span>
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 bg-white rounded-md border">
                          {chk.timeline}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BUDGET MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Sanctioned</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(event.budget)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Planned</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(budgetData.summary?.plannedSum || 0)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Actual Logged Spend</span>
              <p className="text-xl font-extrabold text-indigo-600 mt-1">{formatCurrency(budgetData.summary?.actualSum || 0)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Remaining Balance</span>
              <p className={`text-xl font-extrabold mt-1 ${budgetData.summary?.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(budgetData.summary?.remaining || 0)}
              </p>
            </div>
          </div>

          {/* Budget Warnings */}
          {budgetData.summary?.isOverPlanned && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Planned allocations exceed total sanctioned budget by {formatCurrency(budgetData.summary.overPlannedAmount)}</span>
              </div>
              <span className="text-[11px]">Adjust line items to balance the total</span>
            </div>
          )}

          {/* Budget Table and Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Line Item Expenditures</h3>
                <button
                  onClick={() => handleOpenBudgetModal()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
                </button>
              </div>

              {budgetData.data?.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No budget items logged. Click "Add Expense" or sync from AI Plan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Planned</th>
                        <th className="pb-3">Actual Spent</th>
                        <th className="pb-3">Progress</th>
                        <th className="pb-3">Notes</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {budgetData.data.map((item) => {
                        const itemPct = item.plannedAmount > 0 ? Math.min(100, Math.round((item.actualAmount / item.plannedAmount) * 100)) : 0;
                        return (
                          <tr key={item._id} className="hover:bg-slate-50/60">
                            <td className="py-3 font-bold text-slate-800">{item.category}</td>
                            <td className="py-3 font-semibold text-slate-600">{formatCurrency(item.plannedAmount)}</td>
                            <td className="py-3 font-extrabold text-indigo-600">{formatCurrency(item.actualAmount)}</td>
                            <td className="py-3 w-28">
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${item.actualAmount > item.plannedAmount ? 'bg-rose-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${itemPct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">{itemPct}%</span>
                              </div>
                            </td>
                            <td className="py-3 text-slate-500 max-w-xs truncate">{item.notes || '—'}</td>
                            <td className="py-3 text-right space-x-2">
                              <button
                                onClick={() => handleOpenBudgetModal(item)}
                                className="text-slate-400 hover:text-indigo-600 p-1"
                                title="Edit Expense"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBudgetItem(item._id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Planned vs Actual Bar Chart (1 col) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Planned vs Actual Spend</h3>
                <p className="text-[11px] text-slate-500 mb-4">Category comparison chart</p>

                <div className="h-64">
                  {budgetChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 9 }} interval={0} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip formatter={(val) => formatCurrency(val)} />
                        <Bar dataKey="planned" fill="#c7d2fe" name="Planned" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" fill="#4f46e5" name="Actual" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No budget data for chart
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Event Agenda & Sessions</h3>
              <p className="text-[11px] text-slate-500">Multi-day itinerary and track coordination</p>
            </div>

            <button
              onClick={() => handleOpenScheduleModal()}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Session
            </button>
          </div>

          {scheduleDays.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No schedule items yet"
              description="Add sessions or sync the complete timetable from your AI Plan."
              actionText="Add First Session"
              onActionClick={() => handleOpenScheduleModal()}
            />
          ) : (
            <div className="space-y-6">
              {scheduleDays.map((dayGroup) => (
                <div key={dayGroup.day} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                      Day {dayGroup.day}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">Day {dayGroup.day} Timeline</h4>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dayGroup.sessions.map((session) => (
                      <div key={session._id} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-24 text-xs font-bold text-indigo-600 flex-shrink-0 pt-0.5">
                            {session.startTime} - {session.endTime}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">{session.title}</h5>
                            {session.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{session.description}</p>
                            )}
                            {session.speakerOrLead && (
                              <span className="inline-block mt-1 text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                                Lead: {session.speakerOrLead}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            📍 {session.location}
                          </span>
                          <button
                            onClick={() => handleOpenScheduleModal(session)}
                            className="text-slate-400 hover:text-indigo-600 p-1"
                            title="Edit Session"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              await api.delete(`/schedule/${session._id}`);
                              const refSched = await api.get(`/events/${id}/schedule`);
                              setScheduleDays(refSched.data.days || []);
                              success('Session deleted');
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TASKS */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Management & Team Checklist</h3>
              <p className="text-[11px] text-slate-500">
                {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed
              </p>
            </div>

            <button
              onClick={() => handleOpenTaskModal()}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search tasks or assignee..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks match criteria"
              description="Add tasks or change your search/filter settings."
              actionText="Create Task"
              onActionClick={() => handleOpenTaskModal()}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Done</th>
                    <th className="pb-3">Task Title</th>
                    <th className="pb-3">Assigned To</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Deadline</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50/60">
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            task.status === 'completed'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-indigo-600'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-3">
                        <span className={`font-bold text-slate-900 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="block text-[11px] text-slate-400 mt-0.5">{task.description}</span>
                        )}
                      </td>
                      <td className="py-3 font-semibold text-slate-700">{task.assignedTo || 'Team'}</td>
                      <td className="py-3">
                        <Badge variant={task.priority}>{task.priority}</Badge>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{formatDate(task.deadline)}</td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenTaskModal(task)}
                          className="text-slate-400 hover:text-indigo-600 p-1"
                          title="Edit Task"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ATTENDEES */}
      {/* ========================================================================= */}
      {activeTab === 'attendees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendee Roster & Check-In</h3>
              <p className="text-[11px] text-slate-500">
                {attendees.length} confirmed registrations ({attendees.filter(a => a.status === 'checked-in').length} checked-in)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setManualGuestModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add Guest Manually
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search guest name, email, or pass reference..."
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <div className="flex items-center space-x-2">
              {['all', 'registered', 'checked-in', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAttendeeStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-colors ${
                    attendeeStatusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredAttendees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No attendees match criteria"
              description="Invite attendees or register guests manually using the button above."
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Attendee</th>
                    <th className="pb-3">Pass Ref</th>
                    <th className="pb-3">Ticket Type</th>
                    <th className="pb-3">Dietary</th>
                    <th className="pb-3">Registered</th>
                    <th className="pb-3">Check-In Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendees.map((att) => (
                    <tr key={att._id} className="hover:bg-slate-50/60">
                      <td className="py-3">
                        <span className="font-bold text-slate-900 block">{att.userId?.name || 'Attendee'}</span>
                        <span className="text-[11px] text-slate-400">{att.userId?.email}</span>
                      </td>
                      <td className="py-3 font-mono text-[10px] font-extrabold text-indigo-600">
                        {att.qrCodeRef || '—'}
                      </td>
                      <td className="py-3 font-semibold text-slate-700">{att.ticketType}</td>
                      <td className="py-3 text-slate-600">{att.dietaryPreferences || 'Standard'}</td>
                      <td className="py-3 text-slate-500">{formatDate(att.registrationDate)}</td>
                      <td className="py-3">
                        <Badge variant={att.status}>{att.status}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleAttendeeCheckIn(att)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                            att.status === 'checked-in'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {att.status === 'checked-in' ? 'Undo Check-In' : 'Mark Checked-In'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: WHAT-IF SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'what-if' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Dedicated What-If Simulation Engine</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Simulate Operational & Headcount Changes
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Adjust variables below to calculate mathematical impact on meals, staff, check-in desks, budget deficit/surplus, and venue safety risks.
              </p>
            </div>

            {/* Sliders Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Simulated Guest Count:</span>
                    <span className="text-indigo-600 font-extrabold text-sm">{simGuests} Guests (Original: {event.expectedAttendees})</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="25"
                    value={simGuests}
                    onChange={(e) => setSimGuests(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Simulated Budget:</span>
                    <span className="text-indigo-600 font-extrabold text-sm">{formatCurrency(simBudget)} (Original: {formatCurrency(event.budget)})</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="3500000"
                    step="25000"
                    value={simBudget}
                    onChange={(e) => setSimBudget(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Simulated Duration</label>
                  <select
                    value={simDuration}
                    onChange={(e) => setSimDuration(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1 day">1 Day</option>
                    <option value="2 days">2 Days</option>
                    <option value="3 days">3 Days</option>
                    <option value="5 days">5 Days / 1 Week</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleRunWhatIf}
                    disabled={simulating}
                    className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-purple-200 transition-all flex items-center justify-center active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {simulating ? 'Calculating Impacts...' : 'Run Simulation'}
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Results Display */}
            {simResult && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Executive Simulation Summary</h4>
                  <p className="text-xs text-indigo-950 font-medium">{simResult.analysis?.summary}</p>
                </div>

                {/* Resource Delta Cards */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Resource & Staffing Deltas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {simResult.analysis?.resourceDeltas?.map((res, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{res.item}</span>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-base font-extrabold text-slate-900">{res.simulated}</span>
                          <span className="text-xs font-bold text-purple-600">({res.delta})</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{res.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Feasibility & Risk Assessment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Financial Impact</h4>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-500">Estimated Additional Cost:</span>
                      <span className="font-extrabold text-slate-900">{formatCurrency(simResult.analysis?.financialImpact?.estimatedAdditionalCost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-500">Feasibility Status:</span>
                      <span className="font-bold text-indigo-600">{simResult.analysis?.financialImpact?.feasibility}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-500">Net Budget Balance:</span>
                      <span className="font-bold text-slate-800">{simResult.analysis?.financialImpact?.budgetStatus}</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Simulation Risk Assessment</h4>
                    {simResult.analysis?.riskAssessment?.map((r, i) => (
                      <div key={i} className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{r.risk}</span>
                          <Badge variant={r.severity}>{r.severity}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Changes Button */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold">Apply Simulation to Live Event?</h4>
                    <p className="text-[11px] text-slate-300">This will update your real event capacity to {simGuests} guests and budget to {formatCurrency(simBudget)}.</p>
                  </div>
                  <button
                    onClick={handleApplyWhatIfChanges}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex-shrink-0"
                  >
                    Apply Changes to Live Event
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: AI ASSISTANT CHAT */}
      {/* ========================================================================= */}
      {activeTab === 'ai-assistant' && (
        <div className="space-y-6">
          <div className="max-w-3xl mx-auto">
            <AIChatWidget eventId={id} eventName={event.name} embedded={true} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: FEEDBACK & SENTIMENT */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendee Reviews & AI Sentiment Analysis</h3>
              <p className="text-[11px] text-slate-500">{feedbacks.length} total feedback submissions received</p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={feedbackRatingFilter}
                onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
                <option value="2">2 Stars Only</option>
                <option value="1">1 Star Only</option>
              </select>

              <button
                onClick={handleAnalyzeFeedback}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 flex items-center"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Analyze Sentiment
              </button>
            </div>
          </div>

          {/* AI Sentiment Analysis Card */}
          {feedbackAnalysis && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900">AI Sentiment Breakdown</h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {feedbackAnalysis.sentiment} ({feedbackAnalysis.sentimentScore}% Positive)
                </span>
              </div>

              <p className="text-xs text-slate-600">{feedbackAnalysis.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs">
                  <h5 className="font-bold text-emerald-900 mb-2">🌟 Top Positive Themes</h5>
                  <ul className="space-y-1 text-[11px] text-emerald-950">
                    {feedbackAnalysis.positivePoints?.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs">
                  <h5 className="font-bold text-rose-900 mb-2">⚠️ Areas for Improvement</h5>
                  <ul className="space-y-1 text-[11px] text-rose-950">
                    {feedbackAnalysis.improvementSuggestions?.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Feedbacks Grid */}
          {filteredFeedbacks.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No attendee reviews match criteria"
              description="Feedback submitted by attendees on the public event page will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedbacks.map((f) => (
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
                  <p className="text-xs text-slate-600 italic mt-2 leading-relaxed">"{f.comment}"</p>
                  <span className="inline-block mt-3 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {f.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: ATTENDEE INSIGHTS */}
      {/* ========================================================================= */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Attendee & Turnout Analytics</h3>
              <p className="text-[11px] text-slate-500">Forecasting attendance rates and crowd velocity</p>
            </div>
            <button
              onClick={handleAnalyzeAttendees}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700"
            >
              Update Analytics
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Capacity Utilization</span>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                {Math.round((attendees.length / (event.expectedAttendees || 1)) * 100)}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{attendees.length} of {event.expectedAttendees} target</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Projected Turnout</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                ~{Math.round(attendees.length * 0.9)} Guests
              </p>
              <p className="text-[11px] text-slate-500 mt-1">90% historical arrival probability</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Entry Desks Needed</span>
              <p className="text-2xl font-extrabold text-purple-600 mt-1">
                {Math.max(2, Math.ceil(attendees.length / 120))} Desks
              </p>
              <p className="text-[11px] text-slate-500 mt-1">To ensure &lt; 15s check-in speed</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: VENDORS */}
      {/* ========================================================================= */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Recommended Verified Vendors</h3>
            <p className="text-[11px] text-slate-500 mb-4">Matched for {event.type} in {event.location}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((v) => (
                <div key={v._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs text-slate-900">{v.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                        {v.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-600 mb-2">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                        {v.rating}
                      </span>
                      <span className="text-slate-400">({v.reviewCount} reviews)</span>
                      <span className="text-indigo-600 font-semibold">{v.priceRange}</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500">
                      <p>📍 {v.location}</p>
                      <p>Services: {v.services?.join(', ')}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{v.contact?.phone || 'Contact on request'}</span>
                    <button
                      onClick={() => info(`Contact request initiated for ${v.name}`)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Connect →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Task Modal (Create & Edit) */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        subtitle="Assign to team coordinator with priority & deadline"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Confirm AV Sound Check"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned To</label>
              <input
                type="text"
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                placeholder="e.g. Operations Lead"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deadline Date *</label>
              <input
                type="date"
                required
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Action items and checklist notes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setTaskModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Budget Item Modal (Create & Edit) */}
      <Modal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title={editingBudget ? 'Edit Expense Item' : 'Add Expense / Budget Item'}
        subtitle="Log planned allocations and actual expenditures"
      >
        <form onSubmit={handleSaveBudgetItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={budgetForm.category}
              onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              placeholder="e.g. Venue Booking, Catering, AV Audio"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Planned Amount (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={budgetForm.plannedAmount}
                onChange={(e) => setBudgetForm({ ...budgetForm, plannedAmount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Actual Amount Spent (₹)</label>
              <input
                type="number"
                min="0"
                value={budgetForm.actualAmount}
                onChange={(e) => setBudgetForm({ ...budgetForm, actualAmount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Vendor Description</label>
            <textarea
              rows={2}
              value={budgetForm.notes}
              onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
              placeholder="Invoice reference or vendor quote details..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setBudgetModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {editingBudget ? 'Save Changes' : 'Save Line Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Item Modal (Create & Edit) */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={editingSchedule ? 'Edit Schedule Session' : 'Add Schedule Session'}
        subtitle="Manage itinerary timeline"
      >
        <form onSubmit={handleSaveScheduleItem} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Day</label>
              <input
                type="number"
                min="1"
                value={scheduleForm.day}
                onChange={(e) => setScheduleForm({ ...scheduleForm, day: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time *</label>
              <input
                type="text"
                required
                value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                placeholder="09:00 AM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time *</label>
              <input
                type="text"
                required
                value={scheduleForm.endTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                placeholder="10:30 AM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Session / Activity Title *</label>
            <input
              type="text"
              required
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
              placeholder="e.g. Inaugural Keynote & Awards"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / Stage</label>
              <input
                type="text"
                value={scheduleForm.location}
                onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                placeholder="Main Auditorium"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Speaker / Lead</label>
              <input
                type="text"
                value={scheduleForm.speakerOrLead}
                onChange={(e) => setScheduleForm({ ...scheduleForm, speakerOrLead: e.target.value })}
                placeholder="Dr. Speaker"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={scheduleForm.description}
              onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {editingSchedule ? 'Save Changes' : 'Add Session'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Guest Registration Modal */}
      <Modal
        isOpen={manualGuestModalOpen}
        onClose={() => setManualGuestModalOpen(false)}
        title="Add Guest to Roster"
        subtitle="Manually register an attendee or VIP guest"
      >
        <form onSubmit={handleAddGuestManual} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Guest Name *</label>
              <input
                type="text"
                required
                value={guestForm.name}
                onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Guest Email *</label>
              <input
                type="email"
                required
                value={guestForm.email}
                onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ticket Type</label>
              <select
                value={guestForm.ticketType}
                onChange={(e) => setGuestForm({ ...guestForm, ticketType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              >
                <option value="General Admission">General Admission</option>
                <option value="VIP Access Pass">VIP Access Pass</option>
                <option value="Speaker / Panelist">Speaker / Panelist</option>
                <option value="Media & Press">Media & Press</option>
                <option value="Sponsor Delegate">Sponsor Delegate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dietary Preference</label>
              <select
                value={guestForm.dietaryPreferences}
                onChange={(e) => setGuestForm({ ...guestForm, dietaryPreferences: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              >
                <option value="Standard">Standard</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Gluten-Free">Gluten-Free</option>
                <option value="Halal">Halal</option>
                <option value="Jain">Jain</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Check-in Status</label>
            <select
              value={guestForm.status}
              onChange={(e) => setGuestForm({ ...guestForm, status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
            >
              <option value="registered">Registered (Pending Arrival)</option>
              <option value="checked-in">Checked-In (On Site)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setManualGuestModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Add to Roster
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
