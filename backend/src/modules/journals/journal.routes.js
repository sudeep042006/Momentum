import { Router } from "express";
import { createJournal, getJournals, getJournalById, updateJournal, deleteJournal, uploadJournalImage } from "./journal.controller.js";
import { authMiddleware } from "../../core/middlewares/auth.middleware.js";
import upload from "../../core/middlewares/multer.js";

const router = Router();

// Upload image specifically for journal notes
router.post('/upload', authMiddleware, upload.single('image'), uploadJournalImage);

router.route('/')
    .post(authMiddleware, createJournal)
    .get(authMiddleware, getJournals);
    
router.route('/:id')
    .get(authMiddleware, getJournalById)
    .put(authMiddleware, updateJournal)
    .delete(authMiddleware, deleteJournal);

export default router;