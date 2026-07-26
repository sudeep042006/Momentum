import mongoose from "mongoose";

const DailyListSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    totalTasks: {
        type: Number,
        default: 0
    },
    hasSyncedSchedule: {
        type: Boolean,
        default: false
    },
    tasksCompleted: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const DailyList = mongoose.model('DailyList', DailyListSchema);
export default DailyList;