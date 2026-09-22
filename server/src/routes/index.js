import { Router } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import skillRoutes from './skill.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

// Liveness + database check (used by Render/Railway health checks).
router.get('/health', (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Database is not connected');
  }
  sendSuccess(res, { status: 'ok', uptime: Math.round(process.uptime()) });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/skills', skillRoutes);
router.use('/projects', projectRoutes);

export default router;
