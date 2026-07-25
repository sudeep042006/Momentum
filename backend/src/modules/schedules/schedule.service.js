import Schedule from './schedule.model.js';

export const createSchedule = async (userId, scheduleData) => {
    const schedule = new Schedule({
        ...scheduleData,
        user: userId
    });
    return await schedule.save();
};

export const getSchedules = async (userId) => {
    return await Schedule.find({ user: userId }).sort({ startTime: 1 });
};

export const updateSchedule = async (userId, scheduleId, updateData) => {
    return await Schedule.findOneAndUpdate(
        { _id: scheduleId, user: userId },
        updateData,
        { new: true, runValidators: true }
    );
};

export const deleteSchedule = async (userId, scheduleId) => {
    return await Schedule.findOneAndDelete({ _id: scheduleId, user: userId });
};
