import express from 'express';
import { getOrganizerDashboard, getAdminDashboard } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/organizer', protect, authorize('organizer', 'admin'), getOrganizerDashboard);
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

export default router;
