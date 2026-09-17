import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getReportTemplates,
  getNirfReport,
  getNaacReport,
  getUnplacedStudentsReport,
  generateCustomReport,
  getReportsHistory,
} from '../controllers/reportController.js';

const router = Router();

// Placement reports require authenticated TPO access
router.use(authenticate);
router.use(authorizeRoles('TPO'));

router.get('/templates', getReportTemplates);
router.get('/nirf', getNirfReport);
router.get('/naac', getNaacReport);
router.get('/unplaced', getUnplacedStudentsReport);
router.post('/generate', generateCustomReport);
router.get('/history', getReportsHistory);

export default router;
