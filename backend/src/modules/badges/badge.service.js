import Badge from "./badge.model.js";
import DailyList from "../daily-lists/daily.model.js";

const HARDCODED_BADGES = {
    10: { name: "Getting Started", image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" }, // Replace with real 10 day badge URL
    50: { name: "Half Century", image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" }, // Replace with real 50 day badge URL
    100: { name: "Momentum Master", image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" } // Replace with real 100 day badge URL
};

const calculateStreak = async (userId) => {
    // Get all dates where tasks were completed, sorted newest first
    const lists = await DailyList.find({ user: userId, tasksCompleted: { $gt: 0 } })
        .sort({ date: -1 })
        .select('date');
        
    if (lists.length === 0) return 0;

    const completedDates = new Set(lists.map(l => l.date));
    
    // Normalize today
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let currentDateToCheck = new Date(today);
    const todayStr = currentDateToCheck.toISOString().split('T')[0];
    
    // Normalise yesterday
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    let streak = 0;

    // Check if streak is alive
    if (completedDates.has(todayStr)) {
        streak = 1;
        currentDateToCheck = new Date(today);
    } else if (completedDates.has(yesterdayStr)) {
        streak = 1;
        currentDateToCheck = new Date(yesterdayDate);
    } else {
        return 0; // Streak is broken (missed yesterday and today)
    }

    // Count backwards for consecutive days
    while (true) {
        currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
        const dateStr = currentDateToCheck.toISOString().split('T')[0];
        
        if (completedDates.has(dateStr)) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
};

const checkAndAwardBadges = async (userId, currentStreak) => {
    let badgeDoc = await Badge.findOne({ user: userId });
    
    if (!badgeDoc) {
        badgeDoc = new Badge({ user: userId, total_streak: currentStreak, badges: [] });
    } else {
        badgeDoc.total_streak = currentStreak;
    }

    const currentBadgeNames = badgeDoc.badges.map(b => b.badge_name);
    
    // Check milestones
    for (const [milestone, badgeData] of Object.entries(HARDCODED_BADGES)) {
        if (currentStreak >= parseInt(milestone)) {
            if (!currentBadgeNames.includes(badgeData.name)) {
                // Award new badge!
                badgeDoc.badges.push({
                    badge_name: badgeData.name,
                    badge_image: badgeData.image
                });
            }
        }
    }

    return await badgeDoc.save();
};

const getBadge = async (userId) => {
    // 1. Calculate the exact consecutive streak dynamically
    const currentStreak = await calculateStreak(userId);
    
    // 2. Award any missing badges and update the streak in DB
    const updatedBadgeDoc = await checkAndAwardBadges(userId, currentStreak);
    
    return updatedBadgeDoc;
};

export default { getBadge };