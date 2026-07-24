import React from 'react';
import { Zap, Target, CheckSquare, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function KeyStats({ stats }) {
  const { currentStreak, avgCompletion, tasksFinished, focusHours } = stats || {
    currentStreak: 0,
    avgCompletion: 0,
    tasksFinished: 0,
    focusHours: 0
  };

  return (
    <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 min-h-[400px] shadow-lg flex flex-col">
      <h3 className="text-sm font-bold text-white tracking-widest mb-6">Key Stats</h3>
      
      <div className="flex-1 space-y-6">
        <StatRow 
          icon={<Zap size={18} className="text-momentum-text-secondary" />}
          label="Current Streak"
          value={currentStreak}
          unit="days"
          valueColor="text-momentum-green-bright"
        />
        <div className="h-px bg-momentum-border/50 w-full"></div>
        
        <StatRow 
          icon={<Target size={18} className="text-momentum-text-secondary" />}
          label="Average Completion"
          value={`${avgCompletion}%`}
          valueColor="text-momentum-green-bright"
        />
        <div className="h-px bg-momentum-border/50 w-full"></div>

        <StatRow 
          icon={<CheckSquare size={18} className="text-momentum-text-secondary" />}
          label="Tasks Finished"
          value={tasksFinished.toLocaleString()}
          valueColor="text-momentum-green-bright"
        />
        <div className="h-px bg-momentum-border/50 w-full"></div>

        <StatRow 
          icon={<Clock size={18} className="text-momentum-text-secondary" />}
          label="Focus Hours"
          value={`${focusHours}h`}
          valueColor="text-momentum-green-bright"
        />
      </div>

      <Link to="/dashboard/analytics" className="mt-8 flex items-center justify-between text-sm text-momentum-text-secondary hover:text-white transition-colors group">
        <span>View Analytics</span>
        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

function StatRow({ icon, label, value, unit, valueColor }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-momentum-text-secondary text-sm font-medium">{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-xl font-bold ${valueColor}`}>{value}</span>
        {unit && <span className="text-xs text-momentum-text-secondary ml-1">{unit}</span>}
      </div>
    </div>
  );
}
