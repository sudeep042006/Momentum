import React from 'react';

const RANK_COLORS = {
  0: 'bg-momentum-bg border border-momentum-border',
  1: 'bg-[#0e4429] shadow-[0_0_10px_rgba(14,68,41,0.5)] border border-[#0e4429]',
  2: 'bg-[#006d32] shadow-[0_0_12px_rgba(0,109,50,0.6)] border border-[#006d32]',
  3: 'bg-[#26a641] shadow-[0_0_15px_rgba(38,166,65,0.7)] border border-[#26a641]',
  4: 'bg-[#39d353] shadow-[0_0_20px_rgba(57,211,83,0.8)] border border-[#39d353]',
  5: 'bg-[#39d353] shadow-[0_0_25px_rgba(57,211,83,1)] border border-white' 
};

export default function RecentDays({ recentDays = [] }) {
  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 shadow-lg">
      <h3 className="text-sm font-bold text-white tracking-widest mb-6">Recent Days</h3>
      
      <div className="space-y-4">
        {recentDays.map((day, index) => {
          const percentage = day.totalTasks > 0 ? Math.round((day.tasksCompleted / day.totalTasks) * 100) : 0;
          
          return (
            <div key={day.date || index} className="flex items-center justify-between p-2 hover:bg-momentum-bg rounded-lg transition-colors cursor-default">
              <span className="text-momentum-text-secondary text-sm">{formatDate(day.date)}</span>
              
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${percentage === 100 ? 'text-momentum-green-bright' : percentage >= 50 ? 'text-yellow-400' : 'text-momentum-text-secondary'}`}>
                  {percentage}%
                </span>
                <div className={`w-3 h-3 rounded-sm ${RANK_COLORS[day.rank]}`}></div>
              </div>
            </div>
          );
        })}

        {recentDays.length === 0 && (
          <div className="text-center text-momentum-text-secondary py-4 text-sm">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}
