import {Router} from 'express';
import taskController from './task.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.delete('/:id', taskController.deleteTasks);
router.put('/:id', taskController.updateTasks);

export default router;