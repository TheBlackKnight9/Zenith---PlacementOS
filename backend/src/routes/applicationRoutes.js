import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  apply,
  getMyApplications,
  withdrawApplication,
  getTpoApplications,
  updateApplicationStatus
} from '../controllers/applicationController.js';

const router = Router();

// All application routes require authentication
router.use(authenticate);

// Student endpoints
router.post('/', authorizeRoles('STUDENT'), apply);
router.get('/my-applications', authorizeRoles('STUDENT'), getMyApplications);
router.post('/:id/withdraw', authorizeRoles('STUDENT'), withdrawApplication);

// TPO endpoints
router.get('/tpo', authorizeRoles('TPO'), getTpoApplications);
router.patch('/:id/status', authorizeRoles('TPO'), updateApplicationStatus);

export default router;
