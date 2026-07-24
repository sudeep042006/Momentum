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
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('work');
  const [isLoading, setIsLoading] = useState(true);

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
        priority: newPriority,
        category: newCategory
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
    } catch (error) {
      console.error('Failed to update task', error);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      setTasks(tasks.filter(t => t._id !== id));
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
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Task Master</h1>
            <p className="text-momentum-text-secondary mt-1">Organize your priorities and build momentum.</p>
          </div>
        </div>
        
        {/* Create Task Form */}
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateTask} 
          className="mb-10 bg-momentum-panel border border-momentum-border p-4 rounded-2xl shadow-lg"
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
              <div className="relative flex items-center bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2">
                <Flag size={16} className="text-momentum-text-secondary mr-2" />
                <select 
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-4"
                >
                  <option value="low" className="bg-momentum-panel text-blue-400">Low</option>
                  <option value="medium" className="bg-momentum-panel text-yellow-400">Medium</option>
                  <option value="high" className="bg-momentum-panel text-red-400">High</option>
                </select>
              </div>

              <div className="relative flex items-center bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2">
                <Folder size={16} className="text-momentum-text-secondary mr-2" />
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-4"
                >
                  <option value="work" className="bg-momentum-panel">Work</option>
                  <option value="personal" className="bg-momentum-panel">Personal</option>
                  <option value="health" className="bg-momentum-panel">Health</option>
                  <option value="learning" className="bg-momentum-panel">Learning</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="bg-momentum-green hover:bg-momentum-green-glow text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-momentum-green/20"
              >
                <Plus size={20} />
                <span className="hidden md:inline">Add</span>
              </button>
            </div>
          </div>
        </motion.form>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-momentum-green/20 border-t-momentum-green rounded-full animate-spin"></div>
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
                  <CheckCircle2 size={16} className="text-momentum-green" />
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
    </DashboardLayout>
  );
}

// Reusable Task Card Component
function TaskCard({ task, onToggle, onDelete }) {
  const isCompleted = task.status === 'completed';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-center justify-between p-4 bg-momentum-panel border rounded-xl transition-all group hover:border-momentum-text-secondary/30 ${
        isCompleted ? 'border-momentum-green/20 bg-momentum-bg' : 'border-momentum-border'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onToggle}>
        <button className={`focus:outline-none transition-colors duration-300 ${
          isCompleted ? 'text-momentum-green' : 'text-momentum-text-secondary hover:text-white'
        }`}>
          {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        <span className={`text-lg transition-all duration-300 ${
          isCompleted ? 'text-momentum-text-secondary line-through' : 'text-white'
        }`}>
          {task.title}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Badges */}
        <div className="hidden sm:flex gap-2">
           <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-momentum-border bg-momentum-bg text-momentum-text-secondary">
             {task.category || 'Work'}
           </span>
           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${PRIORITY_COLORS[task.priority || 'medium']}`}>
             {task.priority || 'medium'}
           </span>
        </div>

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
