import express from 'express';
import { updateScheduleItem, deleteScheduleItem } from '../controllers/scheduleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.put('/:id', protect, authorize('organizer', 'admin'), updateScheduleItem);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteScheduleItem);

export default router;
