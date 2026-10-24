import express from 'express';
import { submitFeedback, getEventFeedback } from '../controllers/feedbackController.js';
import { protect } from '../middleware/auth.js';
import { validateFeedbackInput } from '../middleware/validate.js';

const router = express.Router();

router.get('/event/:id', getEventFeedback);
router.post('/event/:id', protect, validateFeedbackInput, submitFeedback);

export default router;
