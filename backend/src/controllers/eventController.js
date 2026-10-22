import Event from '../models/Event.js';
import Attendee from '../models/Attendee.js';
import Budget from '../models/Budget.js';
import Task from '../models/Task.js';
import Schedule from '../models/Schedule.js';
import Feedback from '../models/Feedback.js';
import AIPlan from '../models/AIPlan.js';
import { generateEventPlan } from '../services/aiPlanService.js';

// @desc    Get all public events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res, next) => {
  try {
    const { category, type, search, status = 'published', page = 1, limit = 12 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category && category !== 'All') query.categoryGroup = category;
    if (type) query.type = new RegExp(type, 'i');
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizerId', 'name email organization avatar')
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach real registration counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const attendeeCount = await Attendee.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } });
        return {
          ...event.toObject(),
          registeredAttendees: attendeeCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: eventsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organizer's own events with aggregated stats
// @route   GET /api/events/my-events
// @access  Private (Organizer / Admin)
export const getMyEvents = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { organizerId: req.user.id };
    const events = await Event.find(query).sort({ createdAt: -1 });

    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const attendeeCount = await Attendee.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } });
        const budgets = await Budget.find({ eventId: event._id });
        const tasks = await Task.find({ eventId: event._id });
        const feedbacks = await Feedback.find({ eventId: event._id });
        const hasAIPlan = await AIPlan.exists({ eventId: event._id });

        const plannedSum = budgets.reduce((sum, b) => sum + (b.plannedAmount || 0), 0);
        const actualSum = budgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const avgRating = feedbacks.length > 0
          ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
          : 0;

        return {
          ...event.toObject(),
          registeredAttendees: attendeeCount,
          budgetPlanned: plannedSum,
          budgetSpent: actualSum,
          tasksTotal: tasks.length,
          tasksCompleted: completedTasks,
          averageRating: Number(avgRating),
          hasAIPlan: !!hasAIPlan
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedEvents.length,
      data: enrichedEvents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizerId', 'name email organization avatar bio phone');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const attendeeCount = await Attendee.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } });
    const budgets = await Budget.find({ eventId: event._id });
    const tasks = await Task.find({ eventId: event._id });
    const schedules = await Schedule.find({ eventId: event._id }).sort({ day: 1, order: 1 });
    const feedbacks = await Feedback.find({ eventId: event._id }).populate('userId', 'name avatar');
    const aiPlan = await AIPlan.findOne({ eventId: event._id }).sort({ createdAt: -1 });

    const plannedSum = budgets.reduce((sum, b) => sum + (b.plannedAmount || 0), 0);
    const actualSum = budgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ...event.toObject(),
        registeredAttendees: attendeeCount,
        budgetSummary: {
          totalBudget: event.budget,
          planned: plannedSum,
          spent: actualSum,
          remaining: event.budget - actualSum,
          utilizationRate: event.budget > 0 ? Math.round((actualSum / event.budget) * 100) : 0
        },
        taskSummary: {
          total: tasks.length,
          completed: completedTasks,
          pending: tasks.length - completedTasks,
          completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
        },
        averageRating: Number(avgRating),
        feedbackCount: feedbacks.length,
        hasAIPlan: !!aiPlan,
        aiPlan: aiPlan || null,
        scheduleCount: schedules.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer / Admin)
export const createEvent = async (req, res, next) => {
  try {
    const {
      name,
      type,
      categoryGroup,
      description,
      date,
      endDate,
      duration,
      location,
      venueName,
      budget,
      expectedAttendees,
      preferences,
      requirements,
      tags,
      bannerImage,
      autoGeneratePlan = false
    } = req.body;

    const event = await Event.create({
      organizerId: req.user.id,
      name,
      type,
      categoryGroup: categoryGroup || 'Personal',
      description: description || `Planning for ${name}`,
      date,
      endDate,
      duration: duration || '1 day',
      location,
      venueName: venueName || '',
      budget: Number(budget),
      expectedAttendees: Number(expectedAttendees),
      preferences: preferences || {},
      requirements: requirements || '',
      tags: tags || [type],
      bannerImage: bannerImage || ''
    });

    let generatedPlan = null;
    if (autoGeneratePlan) {
      try {
        const rawPlan = await generateEventPlan(event);
        generatedPlan = await AIPlan.create({
          eventId: event._id,
          ...rawPlan
        });

        // Initialize budget line items from AI plan
        if (rawPlan.budgetPlan && rawPlan.budgetPlan.length > 0) {
          const budgetDocs = rawPlan.budgetPlan.map(b => ({
            eventId: event._id,
            category: b.category,
            plannedAmount: b.amount,
            actualAmount: 0,
            notes: b.description || ''
          }));
          await Budget.insertMany(budgetDocs);
        }

        // Initialize schedule items from AI plan
        if (rawPlan.schedule && rawPlan.schedule.length > 0) {
          const scheduleDocs = rawPlan.schedule.map((s, idx) => ({
            eventId: event._id,
            day: s.day || 1,
            startTime: s.time || '09:00 AM',
            endTime: s.time ? `${parseInt(s.time) + 1 || 10}:00 AM` : '10:00 AM',
            title: s.activity,
            description: s.description || '',
            location: s.location || 'Main Hall',
            order: idx
          }));
          await Schedule.insertMany(scheduleDocs);
        }

        // Initialize checklist items as Tasks
        if (rawPlan.checklist && rawPlan.checklist.length > 0) {
          const taskDocs = rawPlan.checklist.map(c => ({
            eventId: event._id,
            title: c.task,
            description: `Auto-generated from AI Plan (${c.timeline || 'Phase 1'})`,
            assignedTo: 'Event Coordinator',
            priority: 'medium',
            deadline: new Date(new Date(event.date).getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before event
            status: c.completed ? 'completed' : 'pending',
            category: c.category || 'General'
          }));
          await Task.insertMany(taskDocs);
        }
      } catch (aiErr) {
        console.warn('Auto AI plan generation warning:', aiErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
      aiPlan: generatedPlan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Organizer / Admin)
export const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Organizer / Admin)
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    // Cascade delete associated items
    await Promise.all([
      Attendee.deleteMany({ eventId: event._id }),
      Budget.deleteMany({ eventId: event._id }),
      Task.deleteMany({ eventId: event._id }),
      Schedule.deleteMany({ eventId: event._id }),
      Feedback.deleteMany({ eventId: event._id }),
      AIPlan.deleteMany({ eventId: event._id })
    ]);

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
