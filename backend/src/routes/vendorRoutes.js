import express from 'express';
import { getVendors, getVendorSuggestions } from '../controllers/vendorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getVendors);
router.get('/suggestions/:category', protect, getVendorSuggestions);

export default router;
