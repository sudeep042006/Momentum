import { getBadge } from "./badge.controller.js";
import express from 'express';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);

// Only allow fetching badges. Badges are awarded automatically by the backend.
router.get('/', getBadge);

export default router;