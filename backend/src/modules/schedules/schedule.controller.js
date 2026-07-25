import * as scheduleService from './schedule.service.js';

export const createSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.createSchedule(req.user.id, req.body);
        res.status(201).json({ success: true, data: schedule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getSchedules = async (req, res) => {
    try {
        const schedules = await scheduleService.getSchedules(req.user.id);
        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.updateSchedule(req.user.id, req.params.id, req.body);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        res.status(200).json({ success: true, data: schedule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.deleteSchedule(req.user.id, req.params.id);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
