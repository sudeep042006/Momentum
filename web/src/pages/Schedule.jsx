import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { getSchedule, updateSchedule, generateScheduleTemplate, syncScheduleTasks } from '../services/schedule.api';
import { Briefcase, Coffee, Plus, MoreVertical, Info, X, RefreshCw } from 'lucide-react';

const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const BLOCK_COLORS = {
  Routine: 'bg-[#0a2e15] border-[#1e4a2c] text-[#22c55e]',
  Work: 'bg-[#0f1b29] border-[#1e293b] text-[#3b82f6]',
  Learning: 'bg-[#1e112a] border-[#3b1d4f] text-[#a855f7]',
  Break: 'bg-[#291b0f] border-[#4a2e15] text-[#f59e0b]',
  Empty: 'bg-[#161b22] border-[#30363d] text-[#8b949e]'
};

export default function Schedule() {
  const [schedule, setSchedule] = useState({ workingDays: [], holidays: [], useScheduleForDailyTasks: false });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('working');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null); // { type: 'workingDays' | 'holidays', index: number, data: {} }
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getSchedule();
      setSchedule(res.data.data);
    } catch (error) {
      console.error('Error fetching schedule', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDailyTasks = async () => {
    const newValue = !schedule.useScheduleForDailyTasks;
    
    if (newValue) {
      const hasDailyTasks = schedule.workingDays?.some(b => b.addToDailyList) || 
                            schedule.holidays?.some(b => b.addToDailyList);
      
      if (!hasDailyTasks) {
        setToastMessage("No tasks marked for Daily List.");
        setTimeout(() => setToastMessage(null), 3500);
        return; // Exit early, keeping it OFF on both frontend and backend
      }
    }

    setSchedule({ ...schedule, useScheduleForDailyTasks: newValue });
    try {
      await updateSchedule({ useScheduleForDailyTasks: newValue });
      if (newValue) {
        const res = await syncScheduleTasks();
        const count = res?.data?.count || 0;
        const scheduleType = res?.data?.scheduleType || '';
        setToastMessage(`Synced ${count} new task${count === 1 ? '' : 's'} to Today's List (from ${scheduleType})!`);
        setTimeout(() => setToastMessage(null), 4500);
      }
    } catch(error) {
      console.error(error);
    }
  };

  const handleGenerateTemplate = async () => {
    setIsLoading(true);
    try {
      const res = await generateScheduleTemplate();
      setSchedule(res.data.data);
    } catch (error) {
      console.error('Error generating template', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (type, index = null, existingData = null) => {
    if (existingData) {
      setEditingBlock({ type, index, data: { ...existingData } });
    } else {
      setEditingBlock({ 
        type, 
        index, 
        data: { 
          title: '', 
          startTime: '08:00', 
          endTime: '09:00', 
          category: 'Work', 
          addToDailyList: false 
        } 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlock(null);
  };

  const handleSaveBlock = async (e) => {
    e.preventDefault();
    const { type, index, data } = editingBlock;
    
    let updatedArray = [...schedule[type]];
    
    if (index !== null) {
      // Update existing
      updatedArray[index] = data;
    } else {
      // Add new
      data.id = `block-${Date.now()}`;
      updatedArray.push(data);
      // Sort by start time
      updatedArray.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    const newSchedule = { ...schedule, [type]: updatedArray };
    setSchedule(newSchedule);
    closeModal();

    try {
      await updateSchedule({ [type]: updatedArray });
      
      if (newSchedule.useScheduleForDailyTasks && data.addToDailyList) {
        const res = await syncScheduleTasks();
        const count = res?.data?.count || 0;
        if (count > 0) {
          setToastMessage(`Auto-synced ${count} new task(s)!`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
    } catch (error) {
      console.error('Failed to save block', error);
      fetchData(); // revert
    }
  };

  const handleDeleteBlock = async () => {
    const { type, index } = editingBlock;
    if (index === null) return;

    let updatedArray = [...schedule[type]];
    updatedArray.splice(index, 1);

    const newSchedule = { ...schedule, [type]: updatedArray };
    setSchedule(newSchedule);
    closeModal();

    try {
      await updateSchedule({ [type]: updatedArray });
    } catch (error) {
      console.error('Failed to delete block', error);
      fetchData();
    }
  };

  const hasData = schedule.workingDays?.length > 0 || schedule.holidays?.length > 0;

  return (
    <DashboardLayout>
      <Header />
      <div className="max-w-[1600px] mx-auto px-6 w-full pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Schedule & Timelines</h1>
            <p className="text-momentum-text-secondary">Design your ideal days and track your milestones.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {hasData && (
              <button 
                onClick={handleGenerateTemplate}
                className="flex items-center gap-2 px-4 py-3 bg-momentum-panel border border-momentum-border rounded-xl text-momentum-text-secondary hover:text-white transition-colors shadow-lg text-sm font-bold w-full sm:w-auto justify-center"
              >
                <RefreshCw size={16} /> Recreate Template
              </button>
            )}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4 bg-momentum-panel border border-momentum-border rounded-xl p-3 pr-4 shadow-lg">
              <span className="text-sm font-medium text-white px-2">Use this schedule for</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-momentum-text-secondary font-bold tracking-widest uppercase">Daily Tasks</span>
                <button 
                  onClick={handleToggleDailyTasks}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${schedule.useScheduleForDailyTasks ? 'bg-momentum-green-bright' : 'bg-momentum-border'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule.useScheduleForDailyTasks ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex xl:hidden gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('working')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'working' ? 'bg-momentum-green-bright/10 text-momentum-green-bright border border-momentum-green-bright/30' : 'bg-momentum-panel text-momentum-text-secondary border border-momentum-border'}`}
          >
            Working Days
          </button>
          <button 
            onClick={() => setActiveTab('holiday')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'holiday' ? 'bg-momentum-green-bright/10 text-momentum-green-bright border border-momentum-green-bright/30' : 'bg-momentum-panel text-momentum-text-secondary border border-momentum-border'}`}
          >
            Holidays
          </button>
        </div>

        {isLoading ? (
           <div className="flex justify-center py-20">
             <div className="w-8 h-8 border-4 border-momentum-green-bright/20 border-t-momentum-green-bright rounded-full animate-spin"></div>
           </div>
        ) : !hasData ? (
          <div className="text-center py-32 bg-momentum-panel rounded-2xl border border-dashed border-momentum-border">
            <h2 className="text-2xl font-bold text-white mb-4">Your schedule is empty</h2>
            <p className="text-momentum-text-secondary mb-8 max-w-md mx-auto">Create a solid routine to build momentum. We can generate a blank 24-hour template to get you started.</p>
            <button 
              onClick={handleGenerateTemplate}
              className="bg-momentum-green-bright text-momentum-bg px-6 py-3 rounded-xl font-bold text-sm hover:bg-momentum-green transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} /> Generate 24h Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Working Days Column */}
            <div className={`flex-col gap-4 ${activeTab === 'working' ? 'flex' : 'hidden xl:flex'}`}>
              <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="text-momentum-green-bright" size={24} />
                  <div>
                    <h2 className="text-lg font-bold text-white">Working Days (Mon - Fri)</h2>
                    <p className="text-xs text-momentum-text-secondary mt-1">Your productive weekdays.</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {schedule.workingDays?.map((block, index) => (
                    <TimeBlock 
                      key={block._id || block.id || index} 
                      block={block} 
                      onClick={() => openModal('workingDays', index, block)}
                    />
                  ))}
                  
                  <button 
                    onClick={() => openModal('workingDays')}
                    className="w-full mt-4 bg-transparent border border-dashed border-momentum-border text-momentum-text-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-momentum-border/30 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Block
                  </button>
                </div>
              </div>
            </div>

            {/* Holidays Column */}
            <div className={`flex-col gap-4 ${activeTab === 'holiday' ? 'flex' : 'hidden xl:flex'}`}>
              <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Coffee className="text-[#a855f7]" size={24} />
                  <div>
                    <h2 className="text-lg font-bold text-white">Holidays (Sat - Sun)</h2>
                    <p className="text-xs text-momentum-text-secondary mt-1">Your relaxed and personal days.</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {schedule.holidays?.map((block, index) => (
                    <TimeBlock 
                      key={block._id || block.id || index} 
                      block={block}
                      onClick={() => openModal('holidays', index, block)}
                    />
                  ))}
                  
                  <button 
                    onClick={() => openModal('holidays')}
                    className="w-full mt-4 bg-transparent border border-dashed border-momentum-border text-momentum-text-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-momentum-border/30 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Block
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Block Editor Modal */}
      <AnimatePresence>
        {isModalOpen && editingBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-momentum-bg border border-momentum-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-momentum-border bg-momentum-panel/50">
                <h3 className="text-xl font-bold text-white">
                  {editingBlock.index !== null ? 'Edit Time Block' : 'Add Time Block'}
                </h3>
                <button onClick={closeModal} className="text-momentum-text-secondary hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveBlock} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-widest mb-2">Block Title</label>
                  <input
                    type="text"
                    required
                    value={editingBlock.data.title}
                    onChange={e => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, title: e.target.value }})}
                    className="w-full bg-momentum-panel border border-momentum-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-momentum-green-bright transition-colors"
                    placeholder="e.g. DSA Practice"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-widest mb-2">Start Time</label>
                    <input
                      type="time"
                      required
                      value={editingBlock.data.startTime}
                      onChange={e => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, startTime: e.target.value }})}
                      className="w-full bg-momentum-panel border border-momentum-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-momentum-green-bright transition-colors custom-time-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-widest mb-2">End Time</label>
                    <input
                      type="time"
                      required
                      value={editingBlock.data.endTime}
                      onChange={e => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, endTime: e.target.value }})}
                      className="w-full bg-momentum-panel border border-momentum-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-momentum-green-bright transition-colors custom-time-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-widest mb-2">Category (Color)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(BLOCK_COLORS).filter(c => c !== 'Empty').map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, category: cat }})}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                          editingBlock.data.category === cat 
                            ? BLOCK_COLORS[cat] 
                            : 'border-momentum-border text-momentum-text-secondary hover:bg-momentum-border/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-momentum-panel border border-momentum-border rounded-xl p-4 flex items-center justify-between cursor-pointer"
                     onClick={() => setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, addToDailyList: !editingBlock.data.addToDailyList }})}>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Add to Daily Tasks</h4>
                    <p className="text-xs text-momentum-text-secondary">If active, this block will automatically become a checkable task on your Daily list.</p>
                  </div>
                  <button 
                    type="button"
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${editingBlock.data.addToDailyList ? 'bg-momentum-green-bright' : 'bg-momentum-border'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingBlock.data.addToDailyList ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  {editingBlock.index !== null && (
                    <button
                      type="button"
                      onClick={handleDeleteBlock}
                      className="px-6 py-3 rounded-xl font-bold text-sm text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <div className="flex-1"></div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 rounded-xl font-bold text-sm text-momentum-text-secondary hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-bold text-sm text-momentum-bg bg-momentum-green-bright hover:bg-momentum-green transition-colors"
                  >
                    Save Block
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-momentum-panel border border-momentum-green-bright text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(34,197,94,0.15)] flex items-center gap-3 font-medium"
          >
            <div className="w-2 h-2 rounded-full bg-momentum-green-bright shadow-[0_0_8px_rgba(34,197,94,1)]" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}

function TimeBlock({ block, onClick }) {
  const colorStyle = BLOCK_COLORS[block.category] || BLOCK_COLORS.Work;
  
  return (
    <div className="flex items-stretch gap-4 group" onClick={onClick}>
      {/* Time Gutter */}
      <div className="w-[70px] shrink-0 flex items-center justify-end text-xs text-momentum-text-secondary font-mono py-4 text-right">
        {formatTime12h(block.startTime)}
      </div>
      
      {/* Block Card */}
      <div className={`flex-1 flex items-center justify-between p-4 rounded-xl border ${colorStyle} transition-transform hover:scale-[1.01] cursor-pointer relative`}>
        <div className="flex items-center gap-3 font-medium text-sm">
           <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shadow-[0_0_8px_currentColor]"></span>
           {block.title}
        </div>
        <div className="flex items-center gap-4">
           {block.addToDailyList && (
             <div className="hidden sm:flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest opacity-60">
               <span className="w-2 h-2 rounded-full border border-current"></span> Task
             </div>
           )}
           <span className="text-xs font-mono opacity-80">{formatTime12h(block.startTime)} - {formatTime12h(block.endTime)}</span>
        </div>
      </div>
    </div>
  );
}
