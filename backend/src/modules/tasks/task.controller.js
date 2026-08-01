import taskService from './task.service.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const createTask = async (req, res) => {
    try {
        const { title, status, priority, category } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Task title is required" });
        }

        const encryptedTitle = encrypt(title);

        const task = await taskService.createTask(req.user.id, { title: encryptedTitle.encryptedData, status, priority, category, iv: encryptedTitle.iv, authTag: encryptedTitle.authTag });
        res.status(201).json({ data: task });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getTasks = async (req, res) => {
    try {
        const { date } = req.query;
        const tasks = await taskService.getTasks(req.user.id, date);

        const decryptedTasks = tasks.map((task) => {
            let decryptedTitle = task.title;
            // Only attempt to decrypt if the encryption keys exist
            if (task.iv && task.authTag) {
                try {
                    decryptedTitle = decrypt(task.title, task.iv, task.authTag);
                } catch (e) {
                    console.error("Failed to decrypt task:", task._id);
                }
            }
            // Mongoose documents need to be converted to objects or have their properties directly mapped
            const taskObj = task.toObject ? task.toObject() : task;
            return { ...taskObj, title: decryptedTitle };
        });
        res.status(200).json({ data: decryptedTasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const cloneTasks = async (req, res) => {
    try {
        const { fromDate, toDate } = req.body;
        if (!fromDate || !toDate) {
            return res.status(400).json({ message: "fromDate and toDate are required" });
        }
        const cloned = await taskService.cloneTasks(req.user.id, fromDate, toDate);
        res.status(201).json({ data: cloned });
    } catch (error) {
        console.error("Error cloning tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateTasks = async (req, res) => {
    try {
        const { title, status, priority, category } = req.body;

        const updateData = { status, priority, category };
        
        if (title) {
            const encryptedTitle = encrypt(title);
            updateData.title = encryptedTitle.encryptedData;
            updateData.iv = encryptedTitle.iv;
            updateData.authTag = encryptedTitle.authTag;
        }

        const updatedTask = await taskService.updateTask(req.user.id, req.params.id, updateData);

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        let decryptedTitle = updatedTask.title;
        if (updatedTask.iv && updatedTask.authTag) {
            try {
                decryptedTitle = decrypt(updatedTask.title, updatedTask.iv, updatedTask.authTag);
            } catch (e) {
                console.error("Failed to decrypt updated task");
            }
        }
        
        const taskObj = updatedTask.toObject ? updatedTask.toObject() : updatedTask;
        taskObj.title = decryptedTitle;

        res.status(200).json({ data: taskObj });
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

export default { createTask, getTasks, updateTasks, deleteTasks, cloneTasks };