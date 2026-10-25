import express from 'express';
import {
  generatePlan,
  savePlan,
  getEventAIPlan,
  chatWithAI,
  whatIfSimulator,
  applyWhatIfChanges,
  analyzeFeedback,
  analyzeAttendees
} from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// AI generation and saving
router.post('/generate-plan', protect, authorize('organizer', 'admin'), generatePlan);
router.post('/save-plan', protect, authorize('organizer', 'admin'), savePlan);
router.get('/plan/:eventId', protect, authorize('organizer', 'admin'), getEventAIPlan);

// AI Chat Assistant (accessible by all authenticated users)
router.post('/chat', protect, chatWithAI);

// What-If Scenario Simulator
router.post('/what-if', protect, authorize('organizer', 'admin'), whatIfSimulator);
router.post('/apply-what-if', protect, authorize('organizer', 'admin'), applyWhatIfChanges);

// Analytics
router.post('/analyze-feedback', protect, authorize('organizer', 'admin'), analyzeFeedback);
router.post('/analyze-attendees', protect, authorize('organizer', 'admin'), analyzeAttendees);

export default router;
