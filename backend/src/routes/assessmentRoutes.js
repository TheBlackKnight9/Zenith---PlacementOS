import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  addQuestionToAssessment,
  deleteAssessment,
} from '../controllers/assessmentController.js';

const router = Router();

// Assessments require authentication
router.use(authenticate);

// Listing & details (accessible by both TPO and Student)
router.get('/', getAssessments);
router.get('/:id', getAssessmentById);

// Creation, question addition, deletion require TPO role
router.post('/', authorizeRoles('TPO'), createAssessment);
router.post('/:id/questions', authorizeRoles('TPO'), addQuestionToAssessment);
router.delete('/:id', authorizeRoles('TPO'), deleteAssessment);

export default router;
