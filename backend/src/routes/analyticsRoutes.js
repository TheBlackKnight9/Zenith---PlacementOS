import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getPlacementAnalytics } from '../controllers/analyticsController.js';

const router = Router();

// Placement Analytics requires authenticated TPO access
router.use(authenticate);
router.use(authorizeRoles('TPO'));

router.get('/', getPlacementAnalytics);

export default router;
