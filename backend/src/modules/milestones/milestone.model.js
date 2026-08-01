import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
    user: {
        type: String, // Supabase user ID
        required: true
    },
    title: {
        type: String,
        required: true
    },
    iv: { type: String },
    authTag: { type: String },
    description: {
        type: String,
        default: ""
    },
    targetDate: {
        type: Date,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

const Milestone = mongoose.model('Milestone', MilestoneSchema);
export default Milestone;
