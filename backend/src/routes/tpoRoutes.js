import { Router } from 'express';
import {
  getDashboardStats,
  getStudents,
  getStudentById,
  bulkImportStudents,
  createStudent,
  getDepartmentsAnalytics,
  updateDepartmentCoordinator,
} from '../controllers/tpoController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// All TPO routes require valid authentication and TPO role
router.use(authenticate);
router.use(authorizeRoles('TPO'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/departments', getDepartmentsAnalytics);
router.post('/departments/coordinator', updateDepartmentCoordinator);
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.post('/students', createStudent);
router.post('/students/bulk-import', bulkImportStudents);

export default router;
