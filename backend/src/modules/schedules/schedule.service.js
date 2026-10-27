import Schedule from './schedule.model.js';
import Task from '../tasks/task.model.js';
import { getDailyList, recordTaskCreation } from '../daily-lists/daily.service.js';
import DailyList from '../daily-lists/daily.model.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const decryptBlocks = (blocks) => {
    if (!Array.isArray(blocks)) return [];
    return blocks.map(b => {
        const bObj = b && typeof b.toObject === 'function' ? b.toObject() : { ...b };
        if (bObj.iv && bObj.authTag && bObj.title) {
            try {
                bObj.title = decrypt(bObj.title, bObj.iv, bObj.authTag);
            } catch (e) {
                console.error("Decryption failed for schedule block", bObj.id);
            }
        }
        // Sanitize any previously corrupted double-encrypted raw hex strings
        if (typeof bObj.title === 'string' && /^[0-9a-fA-F]{32,}$/.test(bObj.title.trim())) {
            bObj.title = "Free Slot";
        }
        return bObj;
    });
};

const encryptBlocks = (blocks) => {
    if (!Array.isArray(blocks)) return [];
    return blocks.map(b => {
        // ALWAYS clone to prevent mutating the caller's objects
        const bObj = b && typeof b.toObject === 'function' ? b.toObject() : { ...b };
        if (bObj.title) {
            const encrypted = encrypt(bObj.title);
            bObj.title = encrypted.encryptedData;
            bObj.iv = encrypted.iv;
            bObj.authTag = encrypted.authTag;
        }
        return bObj;
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
    
    // Clone data properties so workingDays and holidays don't share references
    const payload = { ...data };
    if (payload.workingDays) payload.workingDays = encryptBlocks(payload.workingDays);
    if (payload.holidays) payload.holidays = encryptBlocks(payload.holidays);

    if (!schedule) {
        schedule = new Schedule({ user: userId, ...payload });
    } else {
        if (payload.useScheduleForDailyTasks !== undefined) schedule.useScheduleForDailyTasks = payload.useScheduleForDailyTasks;
        if (payload.workingDays) schedule.workingDays = payload.workingDays;
        if (payload.holidays) schedule.holidays = payload.holidays;
    }
    
    await schedule.save();
    
    const schedObj = schedule.toObject();
    if (schedObj.workingDays) schedObj.workingDays = decryptBlocks(schedObj.workingDays);
    if (schedObj.holidays) schedObj.holidays = decryptBlocks(schedObj.holidays);
    
    return schedObj;
};

const generateTemplate = async (userId) => {
    // 12-Hour Blank Template: 08:00 AM to 08:00 PM (12 one-hour slots)
    const create12HourBlocks = () => {
        const blocks = [];
        for (let i = 8; i < 20; i++) {
            const start = i.toString().padStart(2, '0') + ':00';
            const end = (i + 1).toString().padStart(2, '0') + ':00';
            blocks.push({
                id: `template-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                startTime: start,
                endTime: end,
                title: 'Free Slot',
                category: 'LEARNING',
                color: 'blue',
                addToDailyList: false
            });
        }
        return blocks;
    };

    const workingDays = create12HourBlocks();
    const holidays = create12HourBlocks();

    return await updateSchedule(userId, { workingDays, holidays });
};

const syncScheduleTasks = async (userId, dateStr) => {
    const schedule = await getSchedule(userId);
    if (!schedule.useScheduleForDailyTasks) return { tasksCreatedCount: 0, scheduleType: '' };

    const parts = (dateStr || '').split('-').map(Number);
    let isHoliday = false;
    if (parts.length === 3 && !isNaN(parts[0])) {
        const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        const day = dateObj.getUTCDay();
        isHoliday = (day === 0 || day === 6);
    } else {
        const dateObj = new Date();
        const day = dateObj.getDay();
        isHoliday = (day === 0 || day === 6);
    }
    const scheduleType = isHoliday ? 'Holidays' : 'Working Days';
    
    const blocks = isHoliday ? (schedule.holidays || []) : (schedule.workingDays || []);
    
    const tasksToCreate = blocks.filter(b => Boolean(b.addToDailyList));
    const uniqueTaskTitles = [...new Set(tasksToCreate.map(b => b.title).filter(Boolean))];
    
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

    for (const rawTitle of uniqueTaskTitles) {
        const title = (typeof rawTitle === 'string' && /^[0-9a-fA-F]{24,}$/.test(rawTitle.trim()))
            ? 'Schedule Task'
            : rawTitle;
        if (!existingTitles.has(title)) {
            const block = tasksToCreate.find(b => b.title === rawTitle || b.title === title);
            
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
