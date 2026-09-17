import { Router } from 'express';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import tpoRoutes from './tpoRoutes.js';
import driveRoutes from './driveRoutes.js';
import internshipRoutes from './internshipRoutes.js';
import applicationRoutes from './applicationRoutes.js';

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

export default router;


