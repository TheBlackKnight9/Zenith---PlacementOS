import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getResources,
  uploadPdfResource,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/resourceController.js';

const router = Router();

// Resources are accessible by authenticated users
router.use(authenticate);

// Listing resources (accessible by both TPO and Student)
router.get('/', getResources);

// Mutation routes require TPO authority
router.post('/upload-pdf', authorizeRoles('TPO'), uploadPdfResource);
router.post('/', authorizeRoles('TPO'), createResource);
router.put('/:id', authorizeRoles('TPO'), updateResource);
router.delete('/:id', authorizeRoles('TPO'), deleteResource);

export default router;
