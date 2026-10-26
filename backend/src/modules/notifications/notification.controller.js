import Notification from './notification.model.js';
import Milestone from '../milestones/milestone.model.js';
import { decrypt } from '../../utils/encryption.js';

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Auto-generate genuine notifications for approaching milestones if not already notified
        try {
            const now = new Date();
            const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            
            // Find active milestones due within 3 days or today
            const upcomingMilestones = await Milestone.find({
                user: userId,
                isCompleted: false,
                targetDate: { $gte: new Date(now.setHours(0,0,0,0)), $lte: threeDaysFromNow }
            }).limit(5);

            for (const milestone of upcomingMilestones) {
                let milestoneTitle = milestone.title;
                if (milestone.iv && milestone.authTag) {
                    try {
                        milestoneTitle = decrypt(milestone.title, milestone.iv, milestone.authTag);
                    } catch (e) {
                        // Keep encrypted string or fallback
                    }
                }

                // Check if notification already logged today for this milestone
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const existing = await Notification.findOne({
                    user: userId,
                    'metadata.milestoneId': milestone._id.toString(),
                    createdAt: { $gte: twentyFourHoursAgo }
                });

                if (!existing) {
                    const daysLeft = Math.ceil((new Date(milestone.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const dueText = daysLeft <= 0 ? 'due today' : `due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
                    
                    await Notification.create({
                        user: userId,
                        title: 'Milestone Deadline Approaching',
                        message: `Your milestone "${milestoneTitle}" is ${dueText}. Stay focused and maintain momentum!`,
                        type: 'milestone',
                        metadata: { milestoneId: milestone._id.toString() }
                    });
                }
            }
        } catch (genError) {
            console.error('Auto milestone notification check failed:', genError.message);
        }

        // Fetch all notifications for user
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

        return res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createNotification = async (req, res) => {
    try {
        const { title, message, type, metadata, actionUrl } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        const notification = await Notification.create({
            user: req.user.id,
            title,
            message,
            type: type || 'system',
            metadata: metadata || {},
            actionUrl: actionUrl || ''
        });

        return res.status(201).json({ success: true, data: notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

        return res.status(200).json({ success: true, data: notification, unreadCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findOneAndDelete({ _id: id, user: req.user.id });

        const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

        return res.status(200).json({ success: true, message: 'Notification deleted', unreadCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user.id });
        return res.status(200).json({ success: true, message: 'All notifications cleared', unreadCount: 0 });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
};
