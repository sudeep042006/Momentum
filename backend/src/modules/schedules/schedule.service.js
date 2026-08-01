import Schedule from './schedule.model.js';
import Task from '../tasks/task.model.js';
import { getDailyList, recordTaskCreation } from '../daily-lists/daily.service.js';
import DailyList from '../daily-lists/daily.model.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const decryptBlocks = (blocks) => {
    return blocks.map(b => {
        if (b.iv && b.authTag) {
            try {
                b.title = decrypt(b.title, b.iv, b.authTag);
            } catch (e) {
                console.error("Decryption failed for schedule block", b.id);
            }
        }
        return b;
    });
};

const encryptBlocks = (blocks) => {
    return blocks.map(b => {
        // Only encrypt if it's not already encrypted (i.e. missing iv/authTag from client)
        // If the client sends back the same plaintext, we just re-encrypt it.
        const encrypted = encrypt(b.title);
        b.title = encrypted.encryptedData;
        b.iv = encrypted.iv;
        b.authTag = encrypted.authTag;
        return b;
    });
};

const getSchedule = async (userId) => {
    let schedule = await Schedule.findOne({ user: userId });
    if (!schedule) {
        schedule = new Schedule({ user: userId, workingDays: [], holidays: [] });
        await schedule.save();
    }
    
    const schedObj = schedule.toObject();
    if (schedObj.workingDays) schedObj.workingDays = decryptBlocks(schedObj.workingDays);
    if (schedObj.holidays) schedObj.holidays = decryptBlocks(schedObj.holidays);
    
    return schedObj;
};

const updateSchedule = async (userId, data) => {
    let schedule = await Schedule.findOne({ user: userId });
    
    if (data.workingDays) data.workingDays = encryptBlocks(data.workingDays);
    if (data.holidays) data.holidays = encryptBlocks(data.holidays);

    if (!schedule) {
        schedule = new Schedule({ user: userId, ...data });
    } else {
        if (data.useScheduleForDailyTasks !== undefined) schedule.useScheduleForDailyTasks = data.useScheduleForDailyTasks;
        if (data.workingDays) schedule.workingDays = data.workingDays;
        if (data.holidays) schedule.holidays = data.holidays;
    }
    
    await schedule.save();
    
    const schedObj = schedule.toObject();
    if (schedObj.workingDays) schedObj.workingDays = decryptBlocks(schedObj.workingDays);
    if (schedObj.holidays) schedObj.holidays = decryptBlocks(schedObj.holidays);
    
    return schedObj;
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
    
    // existingTasks will have encrypted titles, we need to decrypt them to check uniqueness
    const existingTasks = await Task.find({ user: userId, date: dateStr });
    const existingTitles = new Set(existingTasks.map(t => {
        if (t.iv && t.authTag) {
            try { return decrypt(t.title, t.iv, t.authTag); } catch(e) {}
        }
        return t.title;
    }));
    
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
            
            const encryptedTitle = encrypt(title);
            
            const newTask = new Task({
                user: userId,
                title: encryptedTitle.encryptedData,
                iv: encryptedTitle.iv,
                authTag: encryptedTitle.authTag,
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
