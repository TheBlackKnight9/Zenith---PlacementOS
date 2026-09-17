import { Router } from 'express';
import {
  createPlacementDrive,
  getAllPlacementDrives,
  getDriveById,
  updateDriveStatus,
  updatePlacementDrive,
  deletePlacementDrive
} from '../controllers/driveController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

// View drives (Students & TPO)
router.get('/', getAllPlacementDrives);
router.get('/:id', getDriveById);

// Manage drives (TPO only)
router.post('/', authorizeRoles('TPO'), createPlacementDrive);
router.put('/:id', authorizeRoles('TPO'), updatePlacementDrive);
router.patch('/:id/status', authorizeRoles('TPO'), updateDriveStatus);
router.delete('/:id', authorizeRoles('TPO'), deletePlacementDrive);

export default router;
