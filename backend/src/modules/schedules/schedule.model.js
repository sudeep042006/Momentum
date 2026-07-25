import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    days: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekday', 'Weekend', 'Everyday']
    }],
    startTime: {
        type: String,
        required: true // Format HH:mm
    },
    endTime: {
        type: String, // Format HH:mm
        required: true
    },
    type: {
        type: String,
        enum: ['routine', 'milestone'],
        default: 'routine'
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
