import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Heatmap from '../components/dashboard/Heatmap';
import TodayOverview from '../components/dashboard/TodayOverview';
import KeyStats from '../components/dashboard/KeyStats';
import RecentDays from '../components/dashboard/RecentDays';
import TodaysPlanWidget from '../components/dashboard/TodaysPlanWidget';
import DeepWorkTimer from '../components/dashboard/DeepWorkTimer';
import { getDashboardStats } from '../services/daily.api';
import { getTasks } from '../services/task.api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDay, setIsNewDay] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await getDashboardStats();
      setStats(statsRes.data.data);

      // 2. Fetch Tasks for Today
      const today = new Date().toISOString().split('T')[0];
      const tasksRes = await getTasks(today);
      const todayTasks = tasksRes.data.data;
      
      setTasks(todayTasks);
      
      // If there are no tasks for today, it might be a new day to clone
      setIsNewDay(todayTasks.length === 0);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate today's completion for the Overview ring
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = tasks.length;

  return (
    <DashboardLayout>
      <Header />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-2 pb-10 max-w-[1600px] mx-auto px-6 w-full">
        
        {/* Main Content Area (Left: Heatmap + Today's Plan + Timer) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <Heatmap key={`heatmap-${completedTasksCount}-${totalTasksCount}`} />
          
          <div className="flex-1 min-h-[300px]">
            <TodaysPlanWidget 
              tasks={tasks} 
              isNewDay={isNewDay}
              onTasksUpdated={fetchDashboardData} 
            />
          </div>

          <div className="h-[150px]">
            <DeepWorkTimer />
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="flex flex-col gap-6">
          <TodayOverview 
            completedTasks={completedTasksCount} 
            totalTasks={totalTasksCount} 
          />
          
          <KeyStats stats={stats} />
          
          <RecentDays recentDays={stats?.recentDays || []} />
        </div>

      </div>
    </DashboardLayout>
  );
}
