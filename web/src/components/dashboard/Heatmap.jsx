import { useState, useEffect } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
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

export default function Heatmap() {
  const [calendarData, setCalendarData] = useState(generateEmptyCalendar());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const today = new Date();
        const lastYear = new Date();
        lastYear.setDate(today.getDate() - 365);
        
        const startDate = lastYear.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        const response = await getHeatmap(startDate, endDate);
        const realData = response.data.data;
        
        // Merge real data into the empty calendar
        const baseCalendar = generateEmptyCalendar();
        
        if (realData && realData.length > 0) {
          realData.forEach(day => {
            const index = baseCalendar.findIndex(d => d.date === day.date.split('T')[0]);
            if (index !== -1) {
              baseCalendar[index] = {
                date: baseCalendar[index].date,
                count: day.tasksCompleted,
                level: day.rank || 0
              };
            }
          });
        }
        
        setCalendarData(baseCalendar);
      } catch (error) {
        console.error("Failed to fetch heatmap data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

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

      <div className="w-full overflow-x-auto pb-4 flex justify-center">
        {isLoading ? (
          <div className="h-[120px] flex items-center justify-center text-momentum-text-secondary">
            Loading heatmap...
          </div>
        ) : (
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
          />
        )}
      </div>
    </div>
  );
}
