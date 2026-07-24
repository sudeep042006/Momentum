import Task from './task.model.js';
import { recordTaskCompletion } from '../daily-lists/daily.service.js';

const createTask = async (userId, taskData) => {
    const task = new Task({
        ...taskData,
        user: userId
    });
    return await task.save();
};

const getTasks = async (userId) => {
    return await Task.find({ user: userId }).sort({ createdAt: -1 });
};

const getTaskById = async (userId, taskId) => {
    return await Task.findOne({ _id: taskId, user: userId });
};

const updateTask = async (userId, taskId, updateData) => {
    const task = await Task.findOneAndUpdate(
        { _id: taskId, user: userId },
        updateData,
        { new: true, runValidators: true }
    );
    
    if (task && updateData.status === 'completed') {
        const totalTasks = await Task.countDocuments({ user: userId });
        await recordTaskCompletion(userId, totalTasks);
    }
    
    return task;
};

const deleteTask = async (userId, taskId) => {
    return await Task.findOneAndDelete({ _id: taskId, user: userId });
};

export default {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};
