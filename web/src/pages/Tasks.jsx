import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { getTasks, createTask, updateTask, deleteTask } from '../services/task.api';
import { CheckCircle2, Circle, Plus, Clock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonList } from '../components/ui/Skeleton';
const PRIORITY_COLORS = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
};

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export default function Tasks() {
  const [todayTasks, setTodayTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const [todayRes, yesterdayRes] = await Promise.all([
        getTasks(todayStr),
        getTasks(yesterdayStr)
      ]);

      setTodayTasks(todayRes.data.data);
      setHistoryTasks(yesterdayRes.data.data.filter(t => t.status === 'completed'));
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await createTask({ 
        title: newTaskTitle, 
        status: 'pending',
        priority: 'medium',
        category: 'work'
      });
      setTodayTasks([response.data.data, ...todayTasks]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      setTodayTasks(todayTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
      await updateTask(task._id, { status: newStatus, priority: task.priority, category: task.category });
    } catch (error) {
      console.error('Failed to update task', error);
      fetchData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setTodayTasks(todayTasks.filter(t => t._id !== taskId));
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task', error);
      fetchData();
    }
  };

  const sortedTasks = [...todayTasks].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime && !b.startTime) return -1; // tasks with time go first
    if (!a.startTime && b.startTime) return 1;
    return 0;
  });

  const pendingTasks = sortedTasks.filter(t => t.status === 'pending');
  const completedTasks = sortedTasks.filter(t => t.status === 'completed');

  const yesterdayDateString = new Date(new Date().setDate(new Date().getDate() - 1))
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
    .replace(/,/g, ''); // Removes commas to match format like "SAT JUL 25 2026"

  return (
    <DashboardLayout>
      <Header />
      <div className="p-6 max-w-[1600px] mx-auto w-full grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
        
        {/* LEFT COLUMN: TODAY'S WORKSPACE */}
        <div className="xl:col-span-2 flex flex-col gap-8 h-[calc(100vh-140px)]">
          
          {/* Input Box */}
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateTask} 
            className="bg-momentum-panel border border-momentum-border rounded-xl p-2 shadow-lg flex items-center shrink-0"
          >
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-momentum-text-secondary focus:outline-none text-base"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-momentum-green hover:bg-momentum-green-glow text-momentum-bg px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={18} />
              Add
            </button>
          </motion.form>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {isLoading ? (
               <div className="py-4">
                 <SkeletonList count={6} />
               </div>
            ) : (
              <div className="space-y-8">
                {/* Active Tasks */}
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {pendingTasks.map((task) => (
                        <TaskCard 
                          key={task._id} 
                          task={task} 
                          onToggle={() => handleToggleStatus(task)}
                          onDelete={() => handleDeleteTask(task._id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold text-momentum-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-momentum-green" />
                      COMPLETED ({completedTasks.length})
                    </h2>
                    <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                      <AnimatePresence>
                        {completedTasks.map((task) => (
                          <TaskCard 
                            key={task._id} 
                            task={task} 
                            onToggle={() => handleToggleStatus(task)}
                            onDelete={() => handleDeleteTask(task._id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {todayTasks.length === 0 && (
                  <div className="text-center py-20 text-momentum-text-secondary border border-dashed border-momentum-border rounded-xl">
                    Your slate is clean today. Add a task above to begin.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT HISTORY */}
        <div className="xl:col-span-1 h-[calc(100vh-140px)]">
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 shadow-lg h-full flex flex-col">
            
            <div className="mb-6 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                <Clock size={20} className="text-momentum-green" />
                Recent History
              </h2>
              <p className="text-sm text-momentum-text-secondary">Your execution from the previous day.</p>
            </div>

            <div className="mb-6 shrink-0">
              <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest text-momentum-green bg-momentum-green/10 border border-momentum-green/20">
                {yesterdayDateString}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
              {historyTasks.length > 0 ? (
                historyTasks.map(task => (
                  <div key={task._id} className="bg-[#0e2a14] border border-[#1e4a2c] rounded-xl p-4 flex items-start gap-3 transition-colors">
                    <CheckCircle2 size={18} className="text-[#22c55e] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#22c55e] font-medium text-sm leading-tight">{task.title}</p>
                      <p className="text-[#22c55e]/60 text-[10px] uppercase font-bold tracking-wider mt-1">{task.category || 'WORK'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-momentum-text-secondary text-sm border border-dashed border-momentum-border rounded-xl">
                  No completed tasks from yesterday.
                </div>
              )}
            </div>

            <Link to="/dashboard/history" className="w-full mt-6 shrink-0 bg-momentum-bg border border-momentum-border text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-momentum-border/50 transition-colors text-center block">
              View Recent History
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

// Reusable Task Card for the left column
function TaskCard({ task, onToggle, onDelete }) {
  const isCompleted = task.status === 'completed';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      className={`flex items-center justify-between p-4 bg-momentum-bg border rounded-xl transition-all group ${
        isCompleted ? 'border-momentum-green/30' : 'border-momentum-border hover:border-momentum-text-secondary/50'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onToggle}>
        <button className={`focus:outline-none transition-colors duration-300 ${
          isCompleted ? 'text-momentum-green' : 'text-momentum-text-secondary hover:text-white'
        }`}>
          {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <span className={`text-base transition-all duration-300 ${
          isCompleted ? 'text-momentum-text-secondary line-through' : 'text-white'
        }`}>
          {task.title}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
         {task.startTime && (
           <span className="text-[10px] font-mono opacity-80 uppercase tracking-widest text-momentum-text-secondary">
             {formatTime12h(task.startTime)}
           </span>
         )}
         <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-momentum-panel border border-momentum-border text-momentum-text-secondary">
           {task.category || 'WORK'}
         </span>
         <span className={`text-[10px] font-bold uppercase tracking-widest ${PRIORITY_COLORS[task.priority || 'medium']}`}>
           {task.priority || 'MEDIUM'}
         </span>
         <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-momentum-text-secondary hover:text-red-500 transition-colors ml-2">
            <Trash2 size={16} />
         </button>
      </div>
    </motion.div>
  );
}
