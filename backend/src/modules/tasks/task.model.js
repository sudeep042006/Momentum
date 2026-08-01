import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    iv: { type: String },
    authTag: { type: String },
    date: {
        type: String,
        required: true,
        default: () => new Date().toISOString().split('T')[0] // Fallback for old tasks
    },
    startTime: {
        type: String,
        default: null
    },
    endTime: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['work', 'personal', 'health', 'learning'],
        default: 'work'
    }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;