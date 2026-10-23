import express from 'express';
import {
  getUsers,
  createUserAdmin,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllEventsAdmin,
  updateEventStatusAdmin
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Users
router.get('/users', getUsers);
router.post('/users', createUserAdmin);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Events
router.get('/events', getAllEventsAdmin);
router.put('/events/:id/status', updateEventStatusAdmin);

export default router;
