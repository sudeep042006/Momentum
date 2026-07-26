import Schedule from './schedule.model.js';
import Task from '../tasks/task.model.js';
import { getDailyList, recordTaskCreation } from '../daily-lists/daily.service.js';
import DailyList from '../daily-lists/daily.model.js';

const getSchedule = async (userId) => {
    let schedule = await Schedule.findOne({ user: userId });
    if (!schedule) {
        schedule = new Schedule({ user: userId, workingDays: [], holidays: [] });
        await schedule.save();
    }
    return schedule;
};

const updateSchedule = async (userId, data) => {
    let schedule = await Schedule.findOne({ user: userId });
    if (!schedule) {
        schedule = new Schedule({ user: userId, ...data });
    } else {
        if (data.useScheduleForDailyTasks !== undefined) schedule.useScheduleForDailyTasks = data.useScheduleForDailyTasks;
        if (data.workingDays) schedule.workingDays = data.workingDays;
        if (data.holidays) schedule.holidays = data.holidays;
    }
    return await schedule.save();
};

const generateTemplate = async (userId) => {
    const blocks = [];
    for(let i=6; i<24; i++) {
        const start = i.toString().padStart(2, '0') + ':00';
        const end = (i+1 === 24 ? '00' : (i+1).toString().padStart(2, '0')) + ':00';
        blocks.push({
            id: `template-${i}-${Date.now()}`,
            startTime: start,
            endTime: end,
            title: 'Empty Block',
            category: 'Empty',
            color: 'grey',
            addToDailyList: false
        });
    }
    return await updateSchedule(userId, { workingDays: blocks, holidays: blocks });
};

const syncScheduleTasks = async (userId, dateStr) => {
    const schedule = await getSchedule(userId);
    if (!schedule.useScheduleForDailyTasks) return;

    const dateObj = new Date(dateStr);
    const day = dateObj.getDay(); 
    const isHoliday = (day === 0 || day === 6);
    const scheduleType = isHoliday ? 'Holidays' : 'Working Days';
    
    const blocks = isHoliday ? schedule.holidays : schedule.workingDays;
    
    const tasksToCreate = blocks.filter(b => b.addToDailyList);
    const uniqueTaskTitles = [...new Set(tasksToCreate.map(b => b.title))];
    
    const existingTasks = await Task.find({ user: userId, date: dateStr });
    const existingTitles = new Set(existingTasks.map(t => t.title));
    
    let tasksCreatedCount = 0;
    
    const mapCategory = (cat) => {
        const lower = (cat || '').toLowerCase();
        if (['work', 'personal', 'health', 'learning'].includes(lower)) return lower;
        if (lower === 'routine') return 'health';
        if (lower === 'break') return 'personal';
        return 'work';
    };

    for (const title of uniqueTaskTitles) {
        if (!existingTitles.has(title)) {
            const block = tasksToCreate.find(b => b.title === title);
            const newTask = new Task({
                user: userId,
                title: title,
                date: dateStr,
                status: 'pending',
                priority: 'medium',
                category: mapCategory(block.category),
                startTime: block.startTime,
                endTime: block.endTime
            });
            await newTask.save();
            await recordTaskCreation(userId, dateStr);
            tasksCreatedCount++;
        }
    }
    
    const dailyList = await getDailyList(userId, dateStr);
    dailyList.hasSyncedSchedule = true;
    await dailyList.save();
    
    return { tasksCreatedCount, scheduleType };
};

export default { getSchedule, updateSchedule, generateTemplate, syncScheduleTasks };
