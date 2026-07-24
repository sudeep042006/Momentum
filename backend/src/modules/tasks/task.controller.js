import taskService from './task.service.js';

const createTask = async (req, res) => {
    try {
        const { title, status } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Task title is required" });
        }

        const task = await taskService.createTask(req.user.id, { title, status });
        res.status(201).json({ data: task });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getTasks = async (req, res) => {
    try {
        const tasks = await taskService.getTasks(req.user.id);
        res.status(200).json({ data: tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateTasks = async (req, res) => {
    try {
        const { title, status } = req.body;
        const updatedTask = await taskService.updateTask(req.user.id, req.params.id, { title, status });

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ data: updatedTask });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteTasks = async (req, res) => {
    try {
        const deletedTask = await taskService.deleteTask(req.user.id, req.params.id);

        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export default { createTask, getTasks, updateTasks, deleteTasks };