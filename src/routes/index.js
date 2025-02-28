import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import userRoutes from './userRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', authMiddleware, userRoutes);
export default router;