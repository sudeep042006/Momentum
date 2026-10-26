import * as journalService from './journal.service.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

const createJournal = async (req, res) => {
    try {
        const journal = await journalService.createJournal(req.user.id, req.body);
        res.status(201).json({ success: true, data: journal });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getJournals = async (req, res) => {
    try {
        const journals = await journalService.getJournals(req.user.id);
        res.status(200).json({ success: true, data: journals });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getJournalById = async (req, res) => {
    try {
        const journal = await journalService.getJournalById(req.user.id, req.params.id);
        if (!journal) return res.status(404).json({ success: false, message: 'Journal not found' });
        res.status(200).json({ success: true, data: journal });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateJournal = async (req, res) => {
    try {
        const journal = await journalService.updateJournal(req.user.id, req.params.id, req.body);
        if (!journal) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: journal });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteJournal = async (req, res) => {
    try {
        const journal = await journalService.deleteJournal(req.user.id, req.params.id);
        if (!journal) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const uploadJournalImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        return res.status(200).json({ success: true, url: uploadResult.secure_url });
    } catch (error) {
        console.error('Journal image upload error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to upload image' });
    }
};

export { createJournal, getJournals, getJournalById, updateJournal, deleteJournal, uploadJournalImage };
