import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    createSchedule,
    getSchedules,
    updateSchedule,
    deleteSchedule
} from './schedule.controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getSchedules)
    .post(createSchedule);

router.route('/:id')
    .put(updateSchedule)
    .delete(deleteSchedule);

export default router;
