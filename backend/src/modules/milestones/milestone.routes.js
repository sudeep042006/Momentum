import express from 'express';
import milestoneController from './milestone.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', milestoneController.getMilestones);
router.post('/', milestoneController.createMilestone);
router.put('/:id/toggle', milestoneController.toggleMilestone);
router.delete('/:id', milestoneController.deleteMilestone);

export default router;
