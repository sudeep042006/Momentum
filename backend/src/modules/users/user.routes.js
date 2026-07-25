import express from 'express';
import { register, Login, authMiddleware, refreshToken } from '../../core/middlewares/auth.middleware.js';
import userController from './user.controller.js';
import upload from '../../core/middlewares/multer.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', Login);
router.post('/refresh', refreshToken);

// Profile routes
router.post('/profile', authMiddleware, upload.single('profilePic'), userController.createOrUpdateProfile);
router.get('/profile', authMiddleware, userController.getProfile);

// Get current authenticated user details from Supabase & MongoDB
router.get('/me', authMiddleware, userController.getMe);

// Search users (e.g. for community page)
router.get('/search', authMiddleware, userController.searchUsers);

// Public profile endpoint (can be accessed by username or name)
router.get('/public/:username', userController.getPublicProfile);

// Follow / Unfollow endpoints
router.post('/:username/follow', authMiddleware, userController.followUser);
router.post('/:username/unfollow', authMiddleware, userController.unfollowUser);

export default router;
