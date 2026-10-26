import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    user: {
        type: String, // Supabase user ID
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['milestone', 'task', 'streak', 'system', 'update', 'badge'],
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    actionUrl: {
        type: String,
        default: ''
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
