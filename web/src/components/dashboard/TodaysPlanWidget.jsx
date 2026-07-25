import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Plus, MoreHorizontal } from 'lucide-react';
import { updateTask, createTask, cloneTasks } from '../../services/task.api';

const PRIORITY_COLORS = {
  high: 'text-red-400 border-red-400/30 bg-red-400/10',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  low: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
};

export default function TodaysPlanWidget({ tasks, onTasksUpdated, isNewDay }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  const handleToggle = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask(task._id, { status: newStatus, priority: task.priority, category: task.category });
      onTasksUpdated(); // Refetch all dashboard data
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createTask({ title: newTaskTitle, status: 'pending', priority: 'medium', category: 'work' });
      setNewTaskTitle('');
      setIsAdding(false);
      onTasksUpdated();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClone = async () => {
    setIsCloning(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      await cloneTasks(yesterdayStr, today);
      onTasksUpdated();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-momentum-border pb-4">
        <h3 className="text-white font-bold tracking-widest flex items-center gap-3">
          Today's Plan
          <span className="text-momentum-green-bright text-xs font-normal">{tasks.length} tasks</span>
        </h3>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-momentum-bg border border-momentum-border rounded-lg hover:border-momentum-text-secondary transition-colors"
          >
            <Plus size={14} /> Add Task
          </button>
          <button className="p-1.5 text-momentum-text-secondary hover:text-white rounded-lg transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isNewDay && tasks.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center h-48 text-center bg-momentum-bg/50 rounded-xl border border-dashed border-momentum-border p-6">
            <h4 className="text-white font-medium mb-2">It's a new day!</h4>
            <p className="text-sm text-momentum-text-secondary mb-4">You have a fresh slate. Would you like to carry over yesterday's tasks?</p>
            <button 
              onClick={handleClone}
              disabled={isCloning}
              className="bg-momentum-green-bright text-momentum-bg px-4 py-2 rounded-lg font-bold text-sm hover:bg-momentum-green transition-colors disabled:opacity-50"
            >
              {isCloning ? 'Cloning...' : 'Repeat Yesterday\'s Tasks'}
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {isAdding && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAdd}
                  className="mb-4"
                >
                  <input
                    autoFocus
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Type task and press Enter..."
                    className="w-full bg-momentum-bg border border-momentum-green-bright/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-momentum-green-bright"
                  />
                </motion.form>
              )}
              
              {tasks.map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={task._id}
                  className={`flex items-center justify-between p-3 rounded-xl group transition-colors hover:bg-momentum-bg ${task.status === 'completed' ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleToggle(task)}>
                    <button className={`${task.status === 'completed' ? 'text-momentum-green-bright' : 'text-momentum-text-secondary group-hover:text-white'} transition-colors`}>
                      {task.status === 'completed' ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <span className={`text-sm ${task.status === 'completed' ? 'text-momentum-text-secondary line-through' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-momentum-border bg-momentum-bg text-momentum-text-secondary">
                      {task.category || 'Work'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
