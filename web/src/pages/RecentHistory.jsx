import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { getTasks } from '../services/task.api';
import { CheckCircle2, CalendarDays } from 'lucide-react';

export default function RecentHistory() {
  const [tasksByDate, setTasksByDate] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getTasks();
      const allTasks = response.data.data;
      
      // Group by date
      const grouped = {};
      const todayStr = new Date().toISOString().split('T')[0];
      
      allTasks.forEach(task => {
        // Skip today's tasks if we only want "history"
        if (task.date === todayStr) return;
        
        if (!grouped[task.date]) {
          grouped[task.date] = {
            date: task.date,
            tasks: [],
            completedCount: 0,
            totalCount: 0
          };
        }
        grouped[task.date].tasks.push(task);
        grouped[task.date].totalCount++;
        if (task.status === 'completed') {
          grouped[task.date].completedCount++;
        }
      });
      
      // Convert to array and sort descending
      const sortedHistory = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
      setTasksByDate(sortedHistory);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Header />
      <div className="max-w-[1200px] mx-auto px-6 w-full pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <CalendarDays className="text-momentum-green-bright" size={32} />
            Recent History
          </h1>
          <p className="text-momentum-text-secondary">A record of your past executions and accomplishments.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-momentum-green-bright/20 border-t-momentum-green-bright rounded-full animate-spin"></div>
          </div>
        ) : tasksByDate.length === 0 ? (
          <div className="text-center py-20 bg-momentum-panel rounded-2xl border border-dashed border-momentum-border">
            <p className="text-momentum-text-secondary text-lg">No history available yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {tasksByDate.map((day, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={day.date} 
                className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 shadow-lg"
              >
                <div className="flex justify-between items-center border-b border-momentum-border pb-4 mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="bg-momentum-green-bright/20 border border-momentum-green-bright/50 text-momentum-green-bright px-3 py-1 rounded-lg text-sm uppercase tracking-wider">
                      {new Date(day.date).toDateString()}
                    </span>
                  </h2>
                  <div className="text-right">
                    <p className="text-momentum-green-bright font-bold text-lg">{day.completedCount} / {day.totalCount}</p>
                    <p className="text-xs text-momentum-text-secondary uppercase tracking-widest">Completed</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {day.tasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div key={task._id} className={`p-4 rounded-xl border flex items-start gap-3 ${
                        isCompleted 
                          ? 'bg-[#0a2e15] border-momentum-green-bright/30' 
                          : 'bg-momentum-bg border-momentum-border opacity-60'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 size={20} className="text-momentum-green-bright shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-momentum-text-secondary shrink-0 mt-0.5"></div>
                        )}
                        <div>
                          <p className={`text-sm font-medium ${isCompleted ? 'text-momentum-green-bright line-through opacity-90' : 'text-white'}`}>
                            {task.title}
                          </p>
                          <p className={`text-xs uppercase font-mono mt-2 ${isCompleted ? 'text-momentum-green-bright/60' : 'text-momentum-text-secondary'}`}>
                            {task.category || 'Work'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
