import { Router } from 'express';
import { getDailyQuote, generateQuote, saveQuoteToJournal } from './quote.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = Router();

// Public / Daily Quote
router.get('/daily', getDailyQuote);

// On-demand AI Quote Generation
router.post('/generate', generateQuote);

// Save generated quote directly to user's journal notes/quotes
router.post('/save-to-journal', authMiddleware, saveQuoteToJournal);

export default router;
