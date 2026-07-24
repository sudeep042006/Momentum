import Task from './task.model.js';
import { 
    recordTaskCreation, 
    recordTaskCompletion, 
    recordTaskUncompletion, 
    recordTaskDeletion 
} from '../daily-lists/daily.service.js';
import { getIO } from '../../config/socket.js';

const getTodayString = () => new Date().toISOString().split('T')[0];

const createTask = async (userId, taskData) => {
    const date = taskData.date || getTodayString();
    
    const task = new Task({
        ...taskData,
        date,
        user: userId
    });
    const savedTask = await task.save();
    
    await recordTaskCreation(userId, date);
    
    if (savedTask.status === 'completed') {
        await recordTaskCompletion(userId, date);
    }
    
    getIO().to(userId).emit('task_changed', { action: 'created', task: savedTask });
    return savedTask;
};

const getTasks = async (userId, date) => {
    // If date is provided, filter by it. Otherwise return all (or just today by default).
    const query = { user: userId };
    if (date) {
        query.date = date;
    }
    return await Task.find(query).sort({ createdAt: -1 });
};

const getTaskById = async (userId, taskId) => {
    return await Task.findOne({ _id: taskId, user: userId });
};

const updateTask = async (userId, taskId, updateData) => {
    const originalTask = await Task.findOne({ _id: taskId, user: userId });
    if (!originalTask) return null;

    const task = await Task.findOneAndUpdate(
        { _id: taskId, user: userId },
        updateData,
        { new: true, runValidators: true }
    );
    
    if (task) {
        if (originalTask.status === 'pending' && task.status === 'completed') {
            await recordTaskCompletion(userId, task.date);
        } else if (originalTask.status === 'completed' && task.status === 'pending') {
            await recordTaskUncompletion(userId, task.date);
        }
        getIO().to(userId).emit('task_changed', { action: 'updated', task });
    }
    
    return task;
};

const deleteTask = async (userId, taskId) => {
    const deleted = await Task.findOneAndDelete({ _id: taskId, user: userId });
    
    if (deleted) {
        const wasCompleted = deleted.status === 'completed';
        await recordTaskDeletion(userId, deleted.date, wasCompleted);
        getIO().to(userId).emit('task_changed', { action: 'deleted', taskId });
    }
    
    return deleted;
};

const cloneTasks = async (userId, fromDate, toDate) => {
    const existingTasks = await Task.find({ user: userId, date: fromDate });
    if (!existingTasks.length) return [];
    
    const clonedTasks = [];
    for (const task of existingTasks) {
        const cloned = new Task({
            user: userId,
            title: task.title,
            priority: task.priority,
            category: task.category,
            status: 'pending',
            date: toDate
        });
        const saved = await cloned.save();
        await recordTaskCreation(userId, toDate);
        clonedTasks.push(saved);
    }
    
    getIO().to(userId).emit('tasks_cloned', { fromDate, toDate });
    return clonedTasks;
};

export default {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    cloneTasks
};
