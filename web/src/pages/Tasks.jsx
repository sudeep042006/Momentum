import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { getTasks, createTask, updateTask, deleteTask } from '../services/task.api';
import { CheckCircle2, Circle, Trash2, Plus, Flag, Folder } from 'lucide-react';

const PRIORITY_COLORS = {
  high: 'text-red-400 border-red-400/30 bg-red-400/10',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  low: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(response.data.data);
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
      setTasks([response.data.data, ...tasks]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
      await updateTask(task._id, { status: newStatus, priority: task.priority, category: task.category });
      if (activeTask?._id === task._id && newStatus === 'completed') {
        setActiveTask(null);
      }
    } catch (error) {
      console.error('Failed to update task', error);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      setTasks(tasks.filter(t => t._id !== id));
      if (activeTask?._id === id) setActiveTask(null);
      await deleteTask(id);
    } catch (error) {
      console.error('Failed to delete task', error);
      fetchTasks(); 
    }
  };

  // Group tasks for visual clarity
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <DashboardLayout>
      <Header />
      <div className="max-w-[1600px] mx-auto px-6 w-full pb-10">
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Block 1: Task Master (Left, 2 cols) */}
          <div className="xl:col-span-2 flex flex-col">
            {/* Create Task Form */}
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateTask} 
              className="mb-8 bg-momentum-panel border border-momentum-border p-4 rounded-2xl shadow-lg"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 bg-momentum-bg border border-momentum-border rounded-xl px-5 py-3 text-white placeholder-momentum-text-secondary focus:outline-none focus:border-momentum-green transition-colors text-lg"
                />
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="bg-momentum-green-bright hover:bg-momentum-green-glow text-black px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-momentum-green-bright/20"
                  >
                    <Plus size={20} />
                    <span className="hidden md:inline">Add</span>
                  </button>
                </div>
              </div>
            </motion.form>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-momentum-green-bright/20 border-t-momentum-green-bright rounded-full animate-spin"></div>
              </div>
            ) : tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 bg-momentum-panel rounded-2xl border border-dashed border-momentum-border"
              >
                <p className="text-momentum-text-secondary text-lg">No tasks yet. Create one above to get started!</p>
              </motion.div>
            ) : (
              <div className="space-y-10">
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-momentum-text-secondary uppercase tracking-widest pl-2 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                      Active Tasks ({pendingTasks.length})
                    </h2>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {pendingTasks.map((task) => (
                          <TaskCard 
                            key={task._id} 
                            task={task} 
                            isActive={activeTask?._id === task._id}
                            onSelectFocus={() => setActiveTask(task)}
                            onToggle={() => handleToggleStatus(task)} 
                            onDelete={() => handleDeleteTask(task._id)} 
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div className="opacity-70 mt-8">
                    <h2 className="text-sm font-bold text-momentum-text-secondary uppercase tracking-widest pl-2 mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-momentum-green-bright" />
                      Completed ({completedTasks.length})
                    </h2>
                    <div className="space-y-3">
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
              </div>
            )}
          </div>

          {/* Right Side: Pomodoro & Analytics (1 col) */}
          <div className="flex flex-col gap-6">
            
            {/* Block 2: Hyper-Focus Pomodoro */}
            <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-momentum-green-bright/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <h2 className="text-xl font-bold text-white mb-2">Hyper-Focus</h2>
              <p className="text-momentum-text-secondary text-sm mb-8">
                {activeTask ? 'Lock in on your priority.' : 'Select a task to enter focus mode.'}
              </p>

              <div className="flex flex-col items-center justify-center flex-1 py-4">
                {/* Circular Timer Visual */}
                <div className={`relative w-48 h-48 rounded-full border-4 flex items-center justify-center mb-6 transition-all duration-500 shadow-2xl ${activeTask ? 'border-momentum-green-bright shadow-momentum-green-bright/20' : 'border-momentum-border shadow-black/40'}`}>
                  {activeTask && (
                    <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent border-momentum-green-bright animate-spin opacity-30"></div>
                  )}
                  <span className={`text-4xl font-mono font-bold ${activeTask ? 'text-white' : 'text-momentum-text-secondary'}`}>
                    25:00
                  </span>
                </div>

                <div className="text-center w-full">
                  <p className="text-sm font-medium text-momentum-text-secondary uppercase tracking-widest mb-2">Active Task</p>
                  <p className={`font-medium truncate px-4 ${activeTask ? 'text-white text-lg' : 'text-momentum-border italic'}`}>
                    {activeTask ? activeTask.title : 'None Selected'}
                  </p>
                </div>

                <button 
                  disabled={!activeTask}
                  className={`mt-8 w-full py-3 rounded-xl font-bold transition-all uppercase tracking-wider text-sm
                    ${activeTask 
                      ? 'bg-momentum-green-bright text-black hover:bg-momentum-green-glow shadow-lg shadow-momentum-green-bright/20' 
                      : 'bg-momentum-bg text-momentum-text-secondary border border-momentum-border cursor-not-allowed'
                    }`}
                >
                  Start Session
                </button>
              </div>
            </div>

            {/* Block 3: Task Velocity */}
            <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">Velocity</h2>
              <p className="text-momentum-text-secondary text-sm mb-6">Your weekly execution rate.</p>

              <div className="flex items-end gap-2 h-32 mt-4">
                {/* Pseudo-chart for UI */}
                <div className="flex-1 bg-momentum-bg rounded-t-sm h-[30%] relative group">
                  <div className="absolute inset-0 bg-momentum-green-bright/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex-1 bg-momentum-bg rounded-t-sm h-[40%] relative group">
                  <div className="absolute inset-0 bg-momentum-green-bright/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex-1 bg-momentum-bg rounded-t-sm h-[20%] relative group">
                  <div className="absolute inset-0 bg-momentum-green-bright/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex-1 bg-momentum-bg rounded-t-sm h-[60%] relative group">
                  <div className="absolute inset-0 bg-momentum-green-bright/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex-1 bg-momentum-bg rounded-t-sm h-[50%] relative group">
                  <div className="absolute inset-0 bg-momentum-green-bright/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex-1 bg-momentum-green-bright rounded-t-sm h-[80%] relative shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                  {/* Today */}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-momentum-text-secondary uppercase font-mono">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span className="text-momentum-green-bright font-bold">Today</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Reusable Task Card Component
function TaskCard({ task, isActive, onSelectFocus, onToggle, onDelete }) {
  const isCompleted = task.status === 'completed';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-center justify-between p-4 bg-momentum-panel border rounded-xl transition-all group hover:border-momentum-text-secondary/30 ${
        isCompleted 
          ? 'border-momentum-green-bright/20 bg-momentum-bg' 
          : isActive 
            ? 'border-momentum-green-bright shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
            : 'border-momentum-border'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onToggle}>
        <button className={`focus:outline-none transition-colors duration-300 ${
          isCompleted ? 'text-momentum-green-bright' : 'text-momentum-text-secondary hover:text-white'
        }`}>
          {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        <span className={`text-lg transition-all duration-300 ${
          isCompleted ? 'text-momentum-text-secondary line-through' : 'text-white'
        }`}>
          {task.title}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Badges */}
        <div className="hidden sm:flex gap-2">
           <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-momentum-border bg-momentum-bg text-momentum-text-secondary">
             {task.category || 'Work'}
           </span>
           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${PRIORITY_COLORS[task.priority || 'medium']}`}>
             {task.priority || 'medium'}
           </span>
        </div>

        {!isCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelectFocus && onSelectFocus(); }}
            className={`p-2 transition-colors rounded-lg border focus:outline-none ml-2 ${
              isActive 
                ? 'bg-momentum-green-bright/10 border-momentum-green-bright text-momentum-green-bright'
                : 'bg-momentum-bg border-momentum-border text-momentum-text-secondary hover:text-white hover:border-momentum-text-secondary'
            }`}
            aria-label="Focus on task"
            title="Focus Mode"
          >
            <Flag size={16} />
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-momentum-text-secondary hover:text-red-500 p-2 transition-colors focus:outline-none opacity-0 group-hover:opacity-100 cursor-pointer"
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
