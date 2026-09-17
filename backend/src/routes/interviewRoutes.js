import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getInterviews,
  getCandidatesForScheduling,
  createInterview,
  updateInterview,
  updateInterviewFeedback,
  deleteInterview
} from '../controllers/interviewController.js';

const router = Router();

// All interview management endpoints require authenticated TPO access
router.use(authenticate);
router.use(authorizeRoles('TPO'));

router.get('/', getInterviews);
router.get('/candidates', getCandidatesForScheduling);
router.post('/', createInterview);
router.put('/:id', updateInterview);
router.patch('/:id/feedback', updateInterviewFeedback);
router.delete('/:id', deleteInterview);

export default router;
