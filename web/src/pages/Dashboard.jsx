import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Heatmap from '../components/dashboard/Heatmap';
import TodayOverview from '../components/dashboard/TodayOverview';
import RecentDays from '../components/dashboard/RecentDays';
import TodaysPlanWidget from '../components/dashboard/TodaysPlanWidget';
import CalendarTasksWidget from '../components/dashboard/CalendarTasksWidget';
import { getDashboardStats } from '../services/daily.api';
import { getTasks } from '../services/task.api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
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
      
      // 3. Fetch Milestones
      const milestonesRes = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/milestones`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const milestonesData = await milestonesRes.json();
      if (milestonesData.success) {
        setMilestones(milestonesData.data);
      }
      
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

  const handleOptimisticUpdate = (taskId, newStatus) => {
    setTasks(prevTasks => prevTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleMilestoneToggle = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/milestones/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setMilestones(milestones.map(m => m._id === id ? data.data : m));
      }
    } catch (err) {
      console.error('Failed to toggle milestone', err);
    }
  };

  return (
    <DashboardLayout>
      <Header showGreeting={true} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-2 pb-10 max-w-[1600px] mx-auto px-6 w-full">
        
        {/* Main Content Area (Left: Heatmap + Today's Plan + Timer) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <Heatmap 
            completedTasksCount={completedTasksCount} 
            totalTasksCount={totalTasksCount} 
          />
          
          <div className="flex-1 min-h-[300px]">
            <TodaysPlanWidget 
              tasks={tasks} 
              isNewDay={isNewDay}
              onTasksUpdated={fetchDashboardData} 
              onOptimisticUpdate={handleOptimisticUpdate}
            />
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="flex flex-col gap-6">
          <TodayOverview 
            completedTasks={completedTasksCount} 
            totalTasks={totalTasksCount} 
          />
          
          <CalendarTasksWidget milestones={milestones} onToggle={handleMilestoneToggle} />

          <RecentDays recentDays={stats?.recentDays || []} />
        </div>

      </div>
    </DashboardLayout>
  );
}
