import AIPlan from '../models/AIPlan.js';
import Event from '../models/Event.js';
import Budget from '../models/Budget.js';
import Schedule from '../models/Schedule.js';
import Task from '../models/Task.js';
import { generateEventPlan } from '../services/aiPlanService.js';
import { handleAIChat } from '../services/aiChatService.js';
import { simulateWhatIf } from '../services/aiWhatIfService.js';
import { analyzeEventFeedback } from '../services/aiFeedbackService.js';
import { analyzeEventAttendees } from '../services/aiAttendeeService.js';

// @desc    Generate AI Event Plan
// @route   POST /api/ai/generate-plan
// @access  Private (Organizer / Admin)
export const generatePlan = async (req, res, next) => {
  try {
    const {
      eventId,
      name,
      type,
      categoryGroup,
      budget,
      expectedAttendees,
      duration,
      location,
      preferences,
      requirements
    } = req.body;

    let eventData = {
      name,
      type,
      categoryGroup,
      budget: Number(budget || 100000),
      expectedAttendees: Number(expectedAttendees || 100),
      duration: duration || '1 day',
      location: location || 'City Center',
      preferences: preferences || {},
      requirements: requirements || ''
    };

    if (eventId) {
      const event = await Event.findById(eventId);
      if (event) {
        eventData = {
          name: name || event.name,
          type: type || event.type,
          categoryGroup: categoryGroup || event.categoryGroup,
          budget: Number(budget || event.budget),
          expectedAttendees: Number(expectedAttendees || event.expectedAttendees),
          duration: duration || event.duration,
          location: location || event.location,
          preferences: preferences || event.preferences,
          requirements: requirements || event.requirements
        };
      }
    }

    const plan = await generateEventPlan(eventData);

    res.status(200).json({
      success: true,
      message: 'AI plan generated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Apply AI Event Plan to database
// @route   POST /api/ai/save-plan
// @access  Private (Organizer / Admin)
export const savePlan = async (req, res, next) => {
  try {
    const { eventId, plan, applyToBudget = true, applyToSchedule = true, applyToChecklist = true } = req.body;

    if (!eventId || !plan) {
      return res.status(400).json({ success: false, message: 'Event ID and Plan data are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Save or update AIPlan record
    const savedPlan = await AIPlan.findOneAndUpdate(
      { eventId },
      {
        eventId,
        summary: plan.summary || '',
        budgetPlan: plan.budgetPlan || [],
        schedule: plan.schedule || [],
        resources: plan.resources || [],
        checklist: plan.checklist || [],
        risks: plan.risks || [],
        recommendations: plan.recommendations || [],
        isApplied: true
      },
      { upsert: true, new: true }
    );

    // Apply to Budget collection if requested
    if (applyToBudget && plan.budgetPlan && plan.budgetPlan.length > 0) {
      await Budget.deleteMany({ eventId });
      const budgetDocs = plan.budgetPlan.map(b => ({
        eventId,
        category: b.category,
        plannedAmount: Number(b.amount || 0),
        actualAmount: 0,
        notes: b.description || ''
      }));
      await Budget.insertMany(budgetDocs);
    }

    // Apply to Schedule collection if requested
    if (applyToSchedule && plan.schedule && plan.schedule.length > 0) {
      await Schedule.deleteMany({ eventId });
      const scheduleDocs = plan.schedule.map((s, idx) => ({
        eventId,
        day: Number(s.day || 1),
        startTime: s.time || '09:00 AM',
        endTime: s.time ? `${parseInt(s.time) + 1 || 10}:00 AM` : '10:00 AM',
        title: s.activity,
        description: s.description || '',
        location: s.location || 'Main Stage',
        order: idx
      }));
      await Schedule.insertMany(scheduleDocs);
    }

    // Apply to Tasks collection if requested
    if (applyToChecklist && plan.checklist && plan.checklist.length > 0) {
      const taskDocs = plan.checklist.map(c => ({
        eventId,
        title: c.task,
        description: `Generated from AI Plan checklist (${c.timeline || 'Phase 1'})`,
        assignedTo: 'Event Operations Team',
        priority: 'medium',
        deadline: new Date(new Date(event.date).getTime() - 2 * 24 * 60 * 60 * 1000),
        status: c.completed ? 'completed' : 'pending',
        category: c.category || 'Operations'
      }));
      await Task.insertMany(taskDocs);
    }

    res.status(200).json({
      success: true,
      message: 'AI Plan saved and applied to event management modules successfully!',
      data: savedPlan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest AI Plan for an event
// @route   GET /api/ai/plan/:eventId
// @access  Private (Organizer / Admin)
export const getEventAIPlan = async (req, res, next) => {
  try {
    const plan = await AIPlan.findOne({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'No AI plan found for this event' });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Contextual Chat Assistant
// @route   POST /api/ai/chat
// @access  Private (Organizer / Admin / All authenticated)
export const chatWithAI = async (req, res, next) => {
  try {
    const { eventId, message, history = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const result = await handleAIChat({
      eventId,
      message,
      conversationHistory: history
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    What-If Scenario Simulation
// @route   POST /api/ai/what-if
// @access  Private (Organizer / Admin)
export const whatIfSimulator = async (req, res, next) => {
  try {
    const { eventId, currentValues, simulatedValues } = req.body;

    if (!simulatedValues) {
      return res.status(400).json({ success: false, message: 'Simulated parameters are required' });
    }

    const simulation = await simulateWhatIf({
      eventId,
      currentValues,
      simulatedValues
    });

    res.status(200).json({
      success: true,
      message: 'Simulation computed successfully',
      data: simulation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply What-If simulation results directly to real Event
// @route   POST /api/ai/apply-what-if
// @access  Private (Organizer / Admin)
export const applyWhatIfChanges = async (req, res, next) => {
  try {
    const { eventId, simulatedValues } = req.body;

    if (!eventId || !simulatedValues) {
      return res.status(400).json({ success: false, message: 'Event ID and simulated values are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (simulatedValues.guests) event.expectedAttendees = Number(simulatedValues.guests);
    if (simulatedValues.budget) event.budget = Number(simulatedValues.budget);
    if (simulatedValues.duration) event.duration = simulatedValues.duration;
    if (simulatedValues.location) event.location = simulatedValues.location;

    await event.save();

    res.status(200).json({
      success: true,
      message: 'What-If changes applied to live event successfully!',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze Event Feedback using AI
// @route   POST /api/ai/analyze-feedback
// @access  Private (Organizer / Admin)
export const analyzeFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const analysis = await analyzeEventFeedback(eventId);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze Attendee Demographics & Trends
// @route   POST /api/ai/analyze-attendees
// @access  Private (Organizer / Admin)
export const analyzeAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const analysis = await analyzeEventAttendees(eventId);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};
