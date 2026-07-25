 import * as journalService from './journal.service.js';

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

export {createJournal, getJournals, updateJournal, deleteJournal};
