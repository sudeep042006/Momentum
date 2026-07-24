import express from 'express';
import { register, Login, authMiddleware } from '../../core/middlewares/auth.middleware.js';
import userController from './user.controller.js';
import upload from '../../core/middlewares/multer.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', Login);

// Profile routes
router.post('/profile', authMiddleware, upload.single('profilePic'), userController.createOrUpdateProfile);
router.get('/profile', authMiddleware, userController.getProfile);

export default router;
