import Event from '../models/Event.js';
import Attendee from '../models/Attendee.js';
import Budget from '../models/Budget.js';
import Task from '../models/Task.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

// @desc    Get comprehensive organizer dashboard analytics
// @route   GET /api/dashboard/organizer
// @access  Private (Organizer / Admin)
export const getOrganizerDashboard = async (req, res, next) => {
  try {
    const isMasterAdmin = req.user.role === 'admin';
    const eventQuery = isMasterAdmin ? {} : { organizerId: req.user.id };

    const events = await Event.find(eventQuery).sort({ date: 1 });
    const eventIds = events.map(e => e._id);

    // Total events count
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date() && e.status !== 'cancelled');
    const pastEvents = events.filter(e => new Date(e.date) < new Date() || e.status === 'completed');

    // Attendees
    const attendees = await Attendee.find({ eventId: { $in: eventIds }, status: { $ne: 'cancelled' } });
    const totalAttendees = attendees.length;

    // Budgets
    const budgets = await Budget.find({ eventId: { $in: eventIds } });
    const totalPlannedBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0);
    const totalSpentBudget = budgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0);
    const overallBudgetUtilization = totalPlannedBudget > 0 ? Math.round((totalSpentBudget / totalPlannedBudget) * 100) : 0;

    // Tasks
    const tasks = await Task.find({ eventId: { $in: eventIds } });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const overallTaskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Feedbacks & Average Rating
    const feedbacks = await Feedback.find({ eventId: { $in: eventIds } });
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
      : 0;

    // Category breakdown for chart
    const categoryCounts = {};
    events.forEach(e => {
      const cat = e.categoryGroup || 'Personal';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryData = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      count: categoryCounts[cat]
    }));

    // Upcoming events with registration metrics
    const upcomingEventsWithStats = await Promise.all(
      upcomingEvents.slice(0, 5).map(async (event) => {
        const regCount = await Attendee.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } });
        const eventBudgets = await Budget.find({ eventId: event._id });
        const spent = eventBudgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0);
        return {
          id: event._id,
          name: event.name,
          type: event.type,
          categoryGroup: event.categoryGroup,
          date: event.date,
          location: event.location,
          expectedAttendees: event.expectedAttendees,
          registeredAttendees: regCount,
          budget: event.budget,
          budgetSpent: spent,
          status: event.status
        };
      })
    );

    // AI Smart Alerts & Risk Warnings generated from live database conditions
    const aiAlerts = [];
    if (overallBudgetUtilization > 85) {
      aiAlerts.push({
        type: 'warning',
        title: 'Budget Threshold Notice',
        message: `Your aggregate budget utilization has reached ${overallBudgetUtilization}%. Monitor pending vendor payments to avoid unplanned debt.`
      });
    }

    if (pendingTasks > 5) {
      aiAlerts.push({
        type: 'info',
        title: 'Operational Task Backlog',
        message: `You have ${pendingTasks} pending tasks across active events. Delegate urgent logistics to coordinators.`
      });
    }

    upcomingEvents.forEach(e => {
      if (e.expectedAttendees > 300) {
        aiAlerts.push({
          type: 'risk',
          title: `Capacity Notice: ${e.name}`,
          message: `Expected guest volume (${e.expectedAttendees}) requires at least ${Math.ceil(e.expectedAttendees / 120)} check-in desks and high-capacity WiFi.`
        });
      }
    });

    if (aiAlerts.length === 0) {
      aiAlerts.push({
        type: 'success',
        title: 'Operations on Track',
        message: 'All scheduled events, budget allocations, and staff assignments are operating within safe parameters.'
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        upcomingCount: upcomingEvents.length,
        pastCount: pastEvents.length,
        totalAttendees,
        totalPlannedBudget,
        totalSpentBudget,
        overallBudgetUtilization,
        totalTasks,
        completedTasks,
        pendingTasks,
        overallTaskRate,
        averageRating: Number(averageRating),
        totalFeedbacks
      },
      categoryDistribution: categoryData,
      upcomingEvents: upcomingEventsWithStats,
      aiAlerts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get master admin dashboard analytics
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const organizersCount = await User.countDocuments({ role: 'organizer' });
    const attendeesCount = await User.countDocuments({ role: 'attendee' });
    const adminsCount = await User.countDocuments({ role: 'admin' });

    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: { $in: ['published', 'in-progress'] } });
    const totalRegistrations = await Attendee.countDocuments({ status: { $ne: 'cancelled' } });
    const categoriesCount = await Category.countDocuments();

    const allEvents = await Event.find().select('budget');
    const totalBudgetManaged = allEvents.reduce((sum, e) => sum + (e.budget || 0), 0);

    const feedbacks = await Feedback.find();
    const avgPlatformRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;

    // Recent registered users
    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);

    // Recent events
    const recentEvents = await Event.find().populate('organizerId', 'name email').sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        organizersCount,
        attendeesCount,
        adminsCount,
        totalEvents,
        activeEvents,
        totalRegistrations,
        categoriesCount,
        totalBudgetManaged,
        avgPlatformRating: Number(avgPlatformRating),
        totalFeedbacks: feedbacks.length
      },
      recentUsers,
      recentEvents
    });
  } catch (error) {
    next(error);
  }
};
