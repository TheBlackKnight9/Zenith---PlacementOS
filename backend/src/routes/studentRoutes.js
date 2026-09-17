import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  addSkill,
  removeSkill,
  getDrivesWithEligibility,
  getInternshipsWithEligibility,
  getDashboardStats
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// Guard all student routes
router.use(authenticate);
router.use(authorizeRoles('STUDENT'));

// Profile and Skills
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/skills', addSkill);
router.delete('/skills/:skillId', removeSkill);

// Opportunities & Eligibility Engine
router.get('/placement-drives', getDrivesWithEligibility);
router.get('/internships', getInternshipsWithEligibility);

// Metrics
router.get('/dashboard-stats', getDashboardStats);

export default router;
