import scheduleService from './schedule.service.js';

const getSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.getSchedule(req.user.id);
        res.status(200).json({ data: schedule });
    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.updateSchedule(req.user.id, req.body);
        res.status(200).json({ data: schedule });
    } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const generateTemplate = async (req, res) => {
    try {
        const schedule = await scheduleService.generateTemplate(req.user.id);
        res.status(200).json({ data: schedule });
    } catch (error) {
        console.error("Error generating schedule template:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const syncToday = async (req, res) => {
    try {
        const dateStr = new Date().toISOString().split('T')[0];
        const result = await scheduleService.syncScheduleTasks(req.user.id, dateStr);
        res.status(200).json({ message: "Synced successfully", count: result.tasksCreatedCount, scheduleType: result.scheduleType });
    } catch (error) {
        console.error("Error syncing schedule:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export default { getSchedule, updateSchedule, generateTemplate, syncToday };
