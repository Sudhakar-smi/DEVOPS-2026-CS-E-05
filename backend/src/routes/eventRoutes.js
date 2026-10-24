import express from 'express';
import {
  getEvents,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { getEventAttendees, registerForEvent, exportAttendeesCSV, registerGuestManual } from '../controllers/attendeeController.js';
import { getEventTasks, createTask } from '../controllers/taskController.js';
import { getEventBudget, addBudgetItem } from '../controllers/budgetController.js';
import { getEventSchedule, createScheduleItem } from '../controllers/scheduleController.js';
import { getEventFeedback, submitFeedback } from '../controllers/feedbackController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateEventInput } from '../middleware/validate.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);

// Organizer routes (My events must come before /:id)
router.get('/organizer/my-events', protect, authorize('organizer', 'admin'), getMyEvents);

// Public single event detail
router.get('/:id', getEventById);

// Protected event modification routes
router.post('/', protect, authorize('organizer', 'admin'), validateEventInput, createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

// Sub-resource endpoints
router.post('/:id/register', protect, registerForEvent);
router.get('/:id/attendees', protect, getEventAttendees);
router.post('/:id/attendees/manual', protect, authorize('organizer', 'admin'), registerGuestManual);
router.get('/:id/attendees/export-csv', protect, exportAttendeesCSV);

router.get('/:id/tasks', protect, getEventTasks);
router.post('/:id/tasks', protect, authorize('organizer', 'admin'), createTask);

router.get('/:id/budget', protect, getEventBudget);
router.post('/:id/budget', protect, authorize('organizer', 'admin'), addBudgetItem);

router.get('/:id/schedule', getEventSchedule);
router.post('/:id/schedule', protect, authorize('organizer', 'admin'), createScheduleItem);

router.get('/:id/feedback', getEventFeedback);
router.post('/:id/feedback', protect, submitFeedback);

export default router;
