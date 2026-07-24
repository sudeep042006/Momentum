import React, { useState, useEffect } from 'react';

export default function DeepWorkTimer() {
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds
  const [isActive, setIsActive] = useState(false);
  
  // Daily Goal Stats (Mock for now, could be passed as props later)
  const goalHours = 4;
  const completedHours = 2.75;
  const goalPercentage = Math.round((completedHours / goalHours) * 100);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 shadow-lg flex justify-between items-center h-full gap-8">
      
      {/* Timer Section */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-sm font-bold text-white tracking-widest">Deep Work Session</h3>
          {isActive ? (
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-momentum-green-bright/10 border border-momentum-green-bright/30">
               <span className="w-1.5 h-1.5 rounded-full bg-momentum-green-bright animate-pulse"></span>
               <span className="text-xs text-momentum-green-bright font-bold">Active</span>
             </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-momentum-bg border border-momentum-border">
               <span className="text-xs text-momentum-text-secondary font-bold">Paused</span>
             </div>
          )}
        </div>
        
        <div className="text-5xl font-mono text-white tracking-wider my-4">
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-momentum-text-secondary uppercase tracking-wider">Time remaining</span>
          <button 
            onClick={toggleTimer}
            className={`text-sm font-bold ${isActive ? 'text-red-400 hover:text-red-300' : 'text-momentum-green-bright hover:text-momentum-green-glow'} transition-colors focus:outline-none`}
          >
            {isActive ? 'Stop Session' : 'Start Session'}
          </button>
        </div>
      </div>

      {/* Goal Section */}
      <div className="flex-1 border-l border-momentum-border pl-8 flex flex-col justify-center">
        <h3 className="text-sm font-bold text-momentum-text-secondary mb-2">Today's Focus Time</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-momentum-green-bright">2h 45m</span>
        </div>
        
        <div className="w-full">
          <div className="flex justify-between text-xs text-momentum-text-secondary mb-2">
            <span>Daily Goal: {goalHours}h</span>
            <span>{goalPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-momentum-bg rounded-full overflow-hidden">
            <div 
              className="h-full bg-momentum-green-bright rounded-full transition-all duration-1000"
              style={{ width: `${goalPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
