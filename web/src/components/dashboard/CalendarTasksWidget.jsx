import { CheckCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function CalendarTasksWidget({ milestones, onToggle }) {
  // Filter for upcoming milestones (targetDate >= today), sorted by date
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingMilestones = milestones
    ?.filter(m => new Date(m.targetDate) >= todayStart)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
    || [];

  return (
    <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CalendarIcon className="text-momentum-green-bright" size={18} />
          Upcoming Calendar Goals
        </h3>
        <div className="text-xs font-mono bg-momentum-bg px-2 py-1 rounded text-momentum-text-secondary border border-momentum-border">
          {upcomingMilestones.length} Upcoming
        </div>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {upcomingMilestones.length === 0 ? (
          <div className="text-sm text-momentum-text-secondary italic text-center py-4 bg-momentum-bg rounded-xl border border-dashed border-momentum-border">
            No upcoming goals. Add some on your calendar!
          </div>
        ) : (
          upcomingMilestones.map(milestone => {
            const dateObj = new Date(milestone.targetDate);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={milestone._id} 
                className={`p-3 rounded-xl border flex flex-col transition-colors ${
                  milestone.isCompleted 
                    ? 'bg-momentum-bg border-momentum-border opacity-60' 
                    : isToday
                      ? 'bg-momentum-green-bright/10 border-momentum-green-bright/30'
                      : 'bg-momentum-bg border-momentum-border hover:border-momentum-green-bright/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isToday ? 'bg-momentum-green-bright text-black' : 'bg-momentum-panel text-momentum-text-secondary border border-momentum-border'
                  }`}>
                    {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <button onClick={() => onToggle(milestone._id)} className="mt-0.5 shrink-0">
                    <CheckCircle size={16} className={milestone.isCompleted ? 'text-momentum-text-secondary' : 'text-momentum-green-bright'} />
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${milestone.isCompleted ? 'text-momentum-text-secondary line-through' : 'text-white'}`}>
                      {milestone.title}
                    </p>
                    {milestone.description && (
                      <p className="text-xs text-momentum-text-secondary mt-1 line-clamp-1">{milestone.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
