import express from 'express';
import { updateBudgetItem, deleteBudgetItem } from '../controllers/budgetController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.put('/:id', protect, authorize('organizer', 'admin'), updateBudgetItem);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteBudgetItem);

export default router;
