import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import apiClient from '../services/apiClient';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { Skeleton } from '../components/ui/Skeleton';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMilestones = async () => {
    try {
      const response = await apiClient.get('/api/milestones');
      if (response.data.success) {
        setMilestones(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch milestones', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newTitle || !selectedDate || isSubmitting) return;
    setIsSubmitting(true);
    
    // Format selectedDate to YYYY-MM-DD for the input
    const offset = selectedDate.getTimezoneOffset()
    const targetDateStr = new Date(selectedDate.getTime() - (offset*60*1000)).toISOString().split('T')[0]

    try {
      const response = await apiClient.post('/api/milestones', {
        title: newTitle,
        description: newDescription,
        targetDate: targetDateStr
      });
      if (response.data.success) {
        setMilestones([...milestones, response.data.data]);
        setNewTitle('');
        setNewDescription('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to add milestone', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id, e) => {
    e.stopPropagation(); // Prevent opening modal when clicking checkbox
    try {
      const response = await apiClient.put(`/api/milestones/${id}/toggle`);
      if (response.data.success) {
        setMilestones(milestones.map(m => m._id === id ? response.data.data : m));
      }
    } catch (err) {
      console.error('Failed to toggle milestone', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/milestones/${id}`);
      setMilestones(milestones.filter(m => m._id !== id));
    } catch (err) {
      console.error('Failed to delete milestone', err);
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const openModalForDate = (day) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
    setIsModalOpen(true);
  };

  // Generate grid cells
  const renderCells = () => {
    const cells = [];
    
    // Padding for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="bg-momentum-bg/50 border border-momentum-border/30 min-h-[120px] rounded-lg"></div>);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentYear, currentMonth, day);
      const isToday = new Date().toDateString() === cellDate.toDateString();
      
      // Find tasks for this day
      const dayTasks = milestones.filter(m => new Date(m.targetDate).toDateString() === cellDate.toDateString());

      cells.push(
        <div 
          key={day} 
          onClick={() => openModalForDate(day)}
          className={`bg-momentum-panel border min-h-[120px] rounded-lg p-2 flex flex-col transition-all cursor-pointer group
            ${isToday ? 'border-momentum-green-bright shadow-[0_0_15px_rgba(20,241,149,0.15)]' : 'border-momentum-border hover:border-momentum-green-bright/50'}
          `}
        >
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-momentum-green-bright text-black' : 'text-momentum-text-secondary group-hover:text-white'}`}>
              {day}
            </span>
            <Plus size={14} className="text-momentum-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {dayTasks.map(task => (
              <div 
                key={task._id} 
                className={`text-xs p-1.5 rounded flex items-start gap-1.5 group/task ${
                  task.isCompleted ? 'bg-momentum-bg/50 text-momentum-text-secondary line-through' : 'bg-momentum-green-bright/10 text-white'
                }`}
              >
                <button onClick={(e) => handleToggle(task._id, e)} className="shrink-0 mt-0.5">
                  <CheckCircle size={12} className={task.isCompleted ? 'text-momentum-text-secondary' : 'text-momentum-green-bright'} />
                </button>
                <div className="flex-1 truncate" title={task.title}>{task.title}</div>
                <button onClick={(e) => handleDelete(task._id, e)} className="shrink-0 opacity-0 group-hover/task:opacity-100 text-red-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Header />
        <div className="space-y-6 h-full flex flex-col pb-6 px-6 max-w-[1600px] mx-auto w-full">
          <Skeleton className="h-[74px] w-full rounded-2xl" />
          <div className="flex-1 bg-momentum-panel border border-momentum-border rounded-2xl p-6 flex flex-col">
            <div className="grid grid-cols-7 gap-4 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={`h-${i}`} className="h-6 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-4 flex-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={`c-${i}`} className="min-h-[120px] w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header />
      <div className="space-y-6 h-full flex flex-col pb-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-center bg-momentum-panel p-4 rounded-2xl border border-momentum-border">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-momentum-green-bright" />
          <h2 className="text-2xl font-bold text-white">Calendar</h2>
        </div>
        
        <div className="flex items-center gap-4 bg-momentum-bg px-4 py-2 rounded-xl border border-momentum-border">
          <button onClick={prevMonth} className="p-1 hover:text-momentum-green-bright transition-colors text-momentum-text-secondary">
            <ChevronLeft size={20} />
          </button>
          <div className="text-lg font-bold text-white w-40 text-center">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <button onClick={nextMonth} className="p-1 hover:text-momentum-green-bright transition-colors text-momentum-text-secondary">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-momentum-panel border border-momentum-border rounded-2xl p-6 flex flex-col">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-bold text-momentum-text-secondary uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-4 flex-1">
          {renderCells()}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-momentum-text-secondary hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-1">Add Allocated Task</h3>
            <p className="text-sm text-momentum-text-secondary mb-6">
              For {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-wider mb-2">Task Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-momentum-green-bright"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-wider mb-2">Details (Optional)</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Any specific notes for this day..."
                  className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-momentum-green-bright resize-none h-24"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-momentum-green-bright text-black font-bold px-6 py-3 rounded-xl hover:bg-momentum-green-glow transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
}
