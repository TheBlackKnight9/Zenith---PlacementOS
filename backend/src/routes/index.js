import { Router } from 'express';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import tpoRoutes from './tpoRoutes.js';
import driveRoutes from './driveRoutes.js';
import internshipRoutes from './internshipRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import interviewRoutes from './interviewRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import reportRoutes from './reportRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'PlacementOS API',
    timestamp: new Date().toISOString()
  });
});

// Mount core API modules
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/tpo', tpoRoutes);
router.use('/placement-drives', driveRoutes);
router.use('/internships', internshipRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/resources', resourceRoutes);
router.use('/assessments', assessmentRoutes);

export default router;


