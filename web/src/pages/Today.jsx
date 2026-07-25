import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { getTasks, updateTask } from '../services/task.api';
import { CheckCircle2, Circle } from 'lucide-react';

const PRIORITY_COLORS = {
  high: 'text-red-400 border-red-400/30 bg-red-400/10',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  low: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
};

export default function Today() {
  const [tasks, setTasks] = useState([]);
  const [totalTasksToday, setTotalTasksToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const response = await getTasks(todayStr);
      setTotalTasksToday(response.data.data.length);
      const activeTasks = response.data.data.filter(t => t.status === 'pending');
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      activeTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      setTasks(activeTasks);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (task) => {
    setTasks(tasks.filter(t => t._id !== task._id));
    try {
      await updateTask(task._id, { status: 'completed' });
    } catch (error) {
      console.error('Failed to update task', error);
      fetchTasks();
    }
  };

  const primaryTask = tasks[0];
  const remainingTasks = tasks.slice(1);

  return (
    <DashboardLayout>
      <Header />
      <div className="p-6 max-w-5xl mx-auto w-full h-full flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">Today's Focus</h1>
          <p className="text-momentum-text-secondary text-lg">
            {totalTasksToday === 0 
              ? "You haven't scheduled any tasks for today yet."
              : tasks.length === 0 
                ? "You've crushed all your tasks for today. Time to rest!" 
                : `You have ${tasks.length} tasks lined up. Let's build momentum.`}
          </p>
        </motion.div>

        {primaryTask ? (
          <div className="w-full max-w-2xl">
            {/* Primary Focus Card */}
            <motion.div 
              layoutId={primaryTask._id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-momentum-panel border border-momentum-green/40 shadow-2xl shadow-momentum-green/5 rounded-3xl p-8 mb-8 relative overflow-hidden group cursor-pointer"
              onClick={() => handleCompleteTask(primaryTask)}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-momentum-green-glow to-momentum-green"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${PRIORITY_COLORS[primaryTask.priority]}`}>
                    {primaryTask.priority} Priority
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-momentum-border bg-momentum-bg text-momentum-text-secondary">
                    {primaryTask.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button className="text-momentum-text-secondary hover:text-momentum-green-glow transition-colors focus:outline-none shrink-0 group-hover:scale-110 duration-300">
                  <Circle size={48} strokeWidth={1.5} />
                </button>
                <h2 className="text-3xl font-bold text-white leading-tight group-hover:text-momentum-green-glow transition-colors">
                  {primaryTask.title}
                </h2>
              </div>
            </motion.div>

            {/* Up Next List */}
            {remainingTasks.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold text-momentum-text-secondary uppercase tracking-widest pl-2 mb-4">Up Next</h3>
                {remainingTasks.map((task) => (
                  <motion.div
                    layoutId={task._id}
                    key={task._id}
                    className="flex items-center justify-between p-5 bg-momentum-panel/50 border border-momentum-border rounded-2xl hover:bg-momentum-panel hover:border-momentum-text-secondary/30 transition-all cursor-pointer"
                    onClick={() => handleCompleteTask(task)}
                  >
                    <div className="flex items-center gap-4">
                      <button className="text-momentum-text-secondary hover:text-momentum-green transition-colors focus:outline-none">
                        <Circle size={24} />
                      </button>
                      <span className="text-xl text-momentum-text-primary">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-60">
                       <span className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[task.priority].split(' ')[2]}`}></span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          !isLoading && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center p-12 bg-momentum-panel border border-momentum-green/20 rounded-3xl"
            >
              <CheckCircle2 size={80} className="text-momentum-green mb-6 opacity-80" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {totalTasksToday === 0 ? "No Tasks Today" : "Day Complete"}
              </h2>
              <p className="text-momentum-text-secondary text-center max-w-sm">
                {totalTasksToday === 0 
                  ? "Take a moment to plan your day or enjoy the rest." 
                  : "You've cleared all your active tasks. Great job building momentum today!"}
              </p>
            </motion.div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
