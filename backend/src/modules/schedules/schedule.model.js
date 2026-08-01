import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
    id: { type: String, required: true }, // For frontend drag/drop or stable keys
    startTime: { type: String, required: true }, // e.g. "06:00"
    endTime: { type: String, required: true },   // e.g. "07:00"
    title: { type: String, required: true },
    iv: { type: String },
    authTag: { type: String },
    category: { type: String, default: 'Work' }, // e.g. 'work', 'health', 'learning'
    color: { type: String, default: 'blue' },    // blue, green, purple, yellow, orange
    addToDailyList: { type: Boolean, default: false }
});

const scheduleSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    useScheduleForDailyTasks: {
        type: Boolean,
        default: false
    },
    workingDays: [blockSchema],
    holidays: [blockSchema]
}, { timestamps: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
