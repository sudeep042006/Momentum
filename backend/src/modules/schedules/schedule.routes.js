import { Router } from 'express';
import scheduleController from './schedule.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', scheduleController.getSchedule);
router.put('/', scheduleController.updateSchedule);
router.post('/generate', scheduleController.generateTemplate);
router.post('/sync', scheduleController.syncToday);

export default router;
