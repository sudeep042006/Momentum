import DailyList from "./daily.model.js";

const calculateRank = (completed, total) => {
    if (total === 0) return 0;
    const percentage = (completed / total) * 100;
    
    if (percentage === 0) return 0;
    if (percentage <= 25) return 1;
    if (percentage <= 50) return 2;
    if (percentage <= 75) return 3;
    if (percentage < 100) return 4;
    return 5; // 100% -> Brightest Green
};

const getDailyList = async (userId, dateStr) => {
    let dailyList = await DailyList.findOne({ user: userId, date: dateStr });
    if (!dailyList) {
        dailyList = new DailyList({ user: userId, date: dateStr, totalTasks: 0, tasksCompleted: 0, rank: 0 });
        await dailyList.save();
    }
    return dailyList;
};

const recordTaskCreation = async (userId, dateStr) => {
    try {
        const dailyList = await getDailyList(userId, dateStr);
        dailyList.totalTasks++;
        dailyList.rank = calculateRank(dailyList.tasksCompleted, dailyList.totalTasks);
        return await dailyList.save();
    } catch(error) {
        console.error("Error recording task creation:", error);
    }
};

const recordTaskCompletion = async (userId, dateStr) => {
    try {
        const dailyList = await getDailyList(userId, dateStr);
        dailyList.tasksCompleted++;
        dailyList.rank = calculateRank(dailyList.tasksCompleted, dailyList.totalTasks);
        return await dailyList.save();
    } catch(error) {
        console.error("Error recording task completion:", error);
    }
};

const recordTaskUncompletion = async (userId, dateStr) => {
    try {
        const dailyList = await getDailyList(userId, dateStr);
        if (dailyList.tasksCompleted > 0) dailyList.tasksCompleted--;
        dailyList.rank = calculateRank(dailyList.tasksCompleted, dailyList.totalTasks);
        return await dailyList.save();
    } catch(error) {
        console.error("Error recording task uncompletion:", error);
    }
};

const recordTaskDeletion = async (userId, dateStr, wasCompleted) => {
    try {
        const dailyList = await getDailyList(userId, dateStr);
        if (dailyList.totalTasks > 0) dailyList.totalTasks--;
        if (wasCompleted && dailyList.tasksCompleted > 0) dailyList.tasksCompleted--;
        dailyList.rank = calculateRank(dailyList.tasksCompleted, dailyList.totalTasks);
        return await dailyList.save();
    } catch(error) {
        console.error("Error recording task deletion:", error);
    }
};

const getActivityData = async (userId, startDate, endDate) => {
    try {
        return await DailyList.find({ 
            user: userId, 
            date: { $gte: startDate, $lte: endDate } 
        });
    } catch(error) {
        console.log(error);
    }
}

// Stats for dashboard
const getDashboardStats = async (userId) => {
    try {
        const lists = await DailyList.find({ user: userId }).sort({ date: -1 });
        let currentStreak = 0;
        let totalCompleted = 0;
        let totalCreated = 0;

        for (let i = 0; i < lists.length; i++) {
            if (lists[i].tasksCompleted > 0) {
                currentStreak++;
            } else {
                break;
            }
        }

        lists.forEach(l => {
            totalCompleted += l.tasksCompleted;
            totalCreated += l.totalTasks;
        });

        const avgCompletion = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
        const recentDays = lists.slice(0, 7);

        return {
            currentStreak,
            avgCompletion,
            tasksFinished: totalCompleted,
            focusHours: Math.round(totalCompleted * 0.75),
            recentDays
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

export { 
    recordTaskCreation, 
    recordTaskCompletion, 
    recordTaskUncompletion, 
    recordTaskDeletion, 
    getActivityData, 
    getDashboardStats 
};
