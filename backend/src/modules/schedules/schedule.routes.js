import express from 'express';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';
import {
    createSchedule,
    getSchedules,
    updateSchedule,
    deleteSchedule
} from './schedule.controller.js';

const router = express.Router();

router.use(authMiddleware);

router.route('/')
    .get(getSchedules)
    .post(createSchedule);

router.route('/:id')
    .put(updateSchedule)
    .delete(deleteSchedule);

export default router;
