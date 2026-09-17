import { Router } from 'express';
import {
  createInternship,
  getAllInternships,
  getInternshipById,
  updateInternshipStatus
} from '../controllers/internshipController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

// View internships (Students & TPO)
router.get('/', getAllInternships);
router.get('/:id', getInternshipById);

// Manage internships (TPO only)
router.post('/', authorizeRoles('TPO'), createInternship);
router.patch('/:id/status', authorizeRoles('TPO'), updateInternshipStatus);

export default router;
