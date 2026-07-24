import DailyList from "./daily.model.js";

const getTodayString = () => new Date().toISOString().split('T')[0];

const calculateRank = (tasksCompleted, totalTasks) => {
    if (totalTasks === 0 || tasksCompleted === 0) return 0;
    
    const percentage = (tasksCompleted / totalTasks) * 100;
    
    if (percentage <= 25) return 1;
    if (percentage <= 50) return 2;
    if (percentage <= 75) return 3;
    if (percentage < 100) return 4;
    return 5; // 100% -> Brightest Green + Diamond
};

const recordTaskCompletion = async (userId, totalTasks) => {
    try {
        const today = getTodayString();
        let dailyList = await DailyList.findOne({ user: userId, date: today });
        
        if (!dailyList) {
            dailyList = new DailyList({
                user: userId,
                date: today,
                tasksCompleted: 1,
                rank: calculateRank(1, totalTasks)
            });
        } else {
            dailyList.tasksCompleted++;
            dailyList.rank = calculateRank(dailyList.tasksCompleted, totalTasks);
        }
        
        return await dailyList.save();
    } catch(error) {
        console.error("Error recording task completion:", error);
    }
}

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

export { recordTaskCompletion, getActivityData };
