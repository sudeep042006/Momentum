import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { getSchedules, createSchedule, deleteSchedule } from '../services/schedule.api';
import { Clock, CalendarDays, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('Weekday'); // 'Weekday' or 'Weekend'
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newType, setNewType] = useState('routine');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await getSchedules();
      setSchedules(response.data.data);
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const scheduleData = {
        title: newTitle,
        startTime: newStartTime,
        endTime: newEndTime,
        type: newType,
        days: [view]
      };
      
      const response = await createSchedule(scheduleData);
      setSchedules([...schedules, response.data.data].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setNewTitle('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add schedule', error);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await deleteSchedule(id);
      setSchedules(schedules.filter(s => s._id !== id));
    } catch (error) {
      console.error('Failed to delete schedule', error);
    }
  };

  const filteredSchedules = schedules.filter(s => s.days.includes(view)).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <DashboardLayout>
      <Header />
      <div className="p-6 max-w-5xl mx-auto w-full h-full flex flex-col">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Schedule & Timelines</h1>
            <p className="text-momentum-text-secondary text-lg">Design your ideal days and track your milestones.</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-momentum-green hover:bg-momentum-green-glow text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-momentum-green/20 flex items-center gap-2"
          >
            <Plus size={20} /> Add Block
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setView('Weekday')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              view === 'Weekday' 
                ? 'bg-momentum-panel border border-momentum-green text-white shadow-lg' 
                : 'bg-transparent border border-momentum-border text-momentum-text-secondary hover:text-white'
            }`}
          >
            College Days (Working Days)
          </button>
          <button 
            onClick={() => setView('Weekend')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              view === 'Weekend' 
                ? 'bg-momentum-panel border border-momentum-green text-white shadow-lg' 
                : 'bg-transparent border border-momentum-border text-momentum-text-secondary hover:text-white'
            }`}
          >
            Holidays
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.form 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              onSubmit={handleAddSchedule}
              className="bg-momentum-panel border border-momentum-border p-6 rounded-2xl shadow-xl overflow-hidden"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-momentum-green" /> 
                New {view} Block
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-momentum-text-secondary uppercase mb-1.5">Title / Focus</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Deep Work, Workout"
                    className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-momentum-green"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-momentum-text-secondary uppercase mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-momentum-green [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-momentum-text-secondary uppercase mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-momentum-green [color-scheme:dark]"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6 gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-momentum-text-secondary hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={!newTitle.trim()} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">Save Block</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="bg-momentum-panel border border-momentum-border rounded-3xl p-8 relative flex-1 min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-momentum-green/20 border-t-momentum-green rounded-full animate-spin"></div>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-60 mt-20">
              <Clock size={64} className="text-momentum-text-secondary mb-4" />
              <p className="text-lg text-white font-medium">Your schedule is wide open.</p>
              <p className="text-momentum-text-secondary">Add some blocks above to design your day.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-momentum-border/50 ml-4 py-4 space-y-8">
              {filteredSchedules.map((schedule, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={schedule._id}
                  className="relative pl-8 group"
                >
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-momentum-bg border-2 border-momentum-green shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                  
                  <div className="bg-momentum-bg/50 border border-momentum-border rounded-2xl p-5 hover:border-momentum-text-secondary/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-momentum-green-bright font-mono font-bold text-sm">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                          {schedule.type === 'milestone' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Milestone</span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-momentum-green-glow transition-colors">{schedule.title}</h3>
                      </div>
                      <button 
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-momentum-text-secondary hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
