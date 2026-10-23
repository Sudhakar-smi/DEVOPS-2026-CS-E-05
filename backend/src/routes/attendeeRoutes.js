import express from 'express';
import { getMyRegistrations, updateAttendeeStatus } from '../controllers/attendeeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-registrations', protect, getMyRegistrations);
router.put('/:id/status', protect, updateAttendeeStatus);

export default router;
