import Task from './task.model.js';
import { 
    getDailyList,
    recordTaskCreation, 
    recordTaskCompletion, 
    recordTaskUncompletion, 
    recordTaskDeletion 
} from '../daily-lists/daily.service.js';
import scheduleService from '../schedules/schedule.service.js';
import { getIO } from '../../config/socket.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const getTodayString = () => new Date().toISOString().split('T')[0];

const decryptTask = (task) => {
    if (!task) return task;
    const taskObj = task.toObject ? task.toObject() : task;
    if (taskObj.iv && taskObj.authTag) {
        try {
            taskObj.title = decrypt(taskObj.title, taskObj.iv, taskObj.authTag);
        } catch (e) {
            console.error("Failed to decrypt task", taskObj._id);
        }
    }
    return taskObj;
};

const createTask = async (userId, taskData) => {
    const date = taskData.date || getTodayString();
    
    const taskPayload = { ...taskData, date, user: userId };
    
    if (taskPayload.title) {
        const encrypted = encrypt(taskPayload.title);
        taskPayload.title = encrypted.encryptedData;
        taskPayload.iv = encrypted.iv;
        taskPayload.authTag = encrypted.authTag;
    }

    const task = new Task(taskPayload);
    const savedTask = await task.save();
    
    await recordTaskCreation(userId, date);
    
    if (savedTask.status === 'completed') {
        await recordTaskCompletion(userId, date);
    }
    
    const decryptedSavedTask = decryptTask(savedTask);
    getIO().to(userId).emit('task_changed', { action: 'created', task: decryptedSavedTask });
    return decryptedSavedTask;
};

const getTasks = async (userId, date) => {
    // Check for auto-sync if asking for today
    if (date === getTodayString()) {
        const dailyList = await getDailyList(userId, date);
        if (!dailyList.hasSyncedSchedule) {
            await scheduleService.syncScheduleTasks(userId, date);
            dailyList.hasSyncedSchedule = true;
            await dailyList.save();
        }
    }

    const query = { user: userId };
    if (date) {
        query.date = date;
    }
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return tasks.map(decryptTask);
};

const getTaskById = async (userId, taskId) => {
    const task = await Task.findOne({ _id: taskId, user: userId });
    return decryptTask(task);
};

const updateTask = async (userId, taskId, updateData) => {
    const originalTask = await Task.findOne({ _id: taskId, user: userId });
    if (!originalTask) return null;

    if (updateData.title) {
        const encrypted = encrypt(updateData.title);
        updateData.title = encrypted.encryptedData;
        updateData.iv = encrypted.iv;
        updateData.authTag = encrypted.authTag;
    }

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
        const decryptedUpdatedTask = decryptTask(task);
        getIO().to(userId).emit('task_changed', { action: 'updated', task: decryptedUpdatedTask });
        return decryptedUpdatedTask;
    }
    
    return null;
};

const deleteTask = async (userId, taskId) => {
    const deleted = await Task.findOneAndDelete({ _id: taskId, user: userId });
    
    if (deleted) {
        const wasCompleted = deleted.status === 'completed';
        await recordTaskDeletion(userId, deleted.date, wasCompleted);
        getIO().to(userId).emit('task_changed', { action: 'deleted', taskId });
    }
    
    return decryptTask(deleted);
};

const cloneTasks = async (userId, fromDate, toDate) => {
    const existingTasks = await Task.find({ user: userId, date: fromDate });
    if (!existingTasks.length) return [];
    
    const clonedTasks = [];
    for (const task of existingTasks) {
        const decrypted = decryptTask(task);
        
        // We can just call createTask so it handles encryption and sockets
        const saved = await createTask(userId, {
            title: decrypted.title,
            priority: decrypted.priority,
            category: decrypted.category,
            status: 'pending',
            date: toDate
        });
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
