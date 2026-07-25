import { Router } from "express";
import { createJournal, getJournals, updateJournal, deleteJournal } from "./journal.controller.js";
import { authMiddleware } from "../../core/middlewares/auth.middleware.js";

const router = Router();

router.route('/')
    .post(authMiddleware, createJournal)
    .get(authMiddleware, getJournals);
    
router.route('/:id')
    .put(authMiddleware, updateJournal)
    .delete(authMiddleware, deleteJournal);

export default router;