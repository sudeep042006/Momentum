import React, { useState, useEffect, useRef } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { Tooltip } from 'react-tooltip';
import { getHeatmap } from '../../services/daily.api';

const HEATMAP_THEME = {
  light: ['#1e293b', '#064e3b', '#059669', '#10b981', '#22c55e', '#4ade80'],
  dark: ['#1e293b', '#064e3b', '#059669', '#10b981', '#22c55e', '#4ade80'],
};

// Generate an empty calendar for the last 365 days
function generateEmptyCalendar() {
  const data = [];
  const today = new Date();
  for (let i = 365; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      count: 0,
      level: 0
    });
  }
  return data;
}

export default function Heatmap({ completedTasksCount, totalTasksCount, heatmapData }) {
  const [calendarData, setCalendarData] = useState(generateEmptyCalendar());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // Scroll to the right end to show the most recent days by default
    if (!isInitialLoading && scrollContainerRef.current) {
      // Small timeout ensures the DOM has fully painted the calendar before scrolling
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
      }, 50);
    }
  }, [isInitialLoading]);

  // 1. Initial network fetch only happens ONCE when the dashboard loads
  useEffect(() => {
    const loadHeatmapData = async () => {
      try {
        let realData = heatmapData;

        if (!heatmapData) {
          const today = new Date();
          const lastYear = new Date();
          lastYear.setDate(today.getDate() - 365);
          
          const startDate = lastYear.toISOString().split('T')[0];
          const endDate = today.toISOString().split('T')[0];

          const response = await getHeatmap(startDate, endDate);
          realData = response.data.data;
        }
        
        // Merge real data into the empty calendar
        const baseCalendar = generateEmptyCalendar();
        
        if (realData && realData.length > 0) {
          realData.forEach(day => {
            const index = baseCalendar.findIndex(d => d.date === day.date.split('T')[0]);
            if (index !== -1) {
              baseCalendar[index] = {
                date: baseCalendar[index].date,
                count: day.tasksCompleted,
                level: day.rank || 0,
                total: day.totalTasks || 0
              };
            }
          });
        }
        
        setCalendarData(baseCalendar);
      } catch (error) {
        console.error("Failed to fetch heatmap data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadHeatmapData();
  }, [heatmapData]);

  // 2. Instant Optimistic UI update whenever a task is completed/uncompleted
  useEffect(() => {
    if (isInitialLoading) return; // Wait until initial fetch is done

    setCalendarData(prevData => {
      const newData = [...prevData];
      const todayStr = new Date().toISOString().split('T')[0];
      const todayIndex = newData.findIndex(d => d.date === todayStr);
      
      if (todayIndex !== -1 && totalTasksCount !== undefined && completedTasksCount !== undefined) {
        // Calculate new level locally (0 to 5)
        let newLevel = 0;
        if (totalTasksCount > 0) {
          const percentage = completedTasksCount / totalTasksCount;
          newLevel = Math.ceil(percentage * 5); // 0.2 -> 1, 1.0 -> 5
        }

        newData[todayIndex] = {
          ...newData[todayIndex],
          count: completedTasksCount,
          level: newLevel,
          total: totalTasksCount
        };
      }
      return newData;
    });
  }, [completedTasksCount, totalTasksCount, isInitialLoading]);

  return (
    <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Momentum Heatmap</h2>
          <p className="text-momentum-text-secondary text-sm">Daily completion percentage over the past year.</p>
        </div>
        <select className="bg-momentum-bg border border-momentum-border text-momentum-text-primary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-momentum-green-bright">
          <option>Last 12 Months</option>
          <option>2024</option>
          <option>2023</option>
          <option>2022</option>
          <option>2021</option>
          <option>2020</option>
          <option>2019</option>

        </select>
      </div>

      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-4"
      >
        {isInitialLoading ? (
          <div className="h-[120px] flex items-center justify-center text-momentum-text-secondary">
            Loading heatmap...
          </div>
        ) : (
          <div className="w-max mx-auto pr-2">
            <ActivityCalendar
              data={calendarData}
              theme={HEATMAP_THEME}
              colorScheme="dark"
              maxLevel={5}
              labels={{
                legend: {
                  less: '0%',
                  more: '100%',
                },
                months: [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ],
                weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
              }}
              blockSize={14}
              blockRadius={2}
              blockMargin={4}
              fontSize={12}
              showWeekdayLabels={false}
              renderBlock={(block, activity) => {
                const total = activity.total || 0;
                const completed = activity.count || 0;
                
                // Format date as ddmmyy (e.g. 250726 or 25/07/26)
                const d = new Date(activity.date);
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yy = String(d.getFullYear()).slice(-2);
                const formattedDate = `${dd}/${mm}/${yy}`;
                
                const tooltipText = `${completed} tasks completed out of ${total} tasks on date ${formattedDate}`;

                return React.cloneElement(block, {
                  'data-tooltip-id': 'heatmap-tooltip',
                  'data-tooltip-content': tooltipText,
                });
              }}
            />
            <Tooltip 
              id="heatmap-tooltip" 
              className="z-50 !bg-momentum-panel !border !border-momentum-border !text-white !rounded-xl !shadow-2xl !px-4 !py-2 !text-sm font-medium"
              style={{ backdropFilter: 'blur(12px)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
