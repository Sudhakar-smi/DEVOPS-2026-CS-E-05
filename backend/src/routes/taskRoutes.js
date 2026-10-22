import express from 'express';
import { updateTask, deleteTask } from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.put('/:id', protect, authorize('organizer', 'admin'), updateTask);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteTask);

export default router;
