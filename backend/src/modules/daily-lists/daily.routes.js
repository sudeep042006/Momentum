import express from 'express';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';
import dailyController from './daily.controller.js';

const router = express.Router();

router.get('/heatmap', authMiddleware, dailyController.getHeatMap);

export default router;