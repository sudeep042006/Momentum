import express from 'express';
import notificationController from './notification.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

export default router;
