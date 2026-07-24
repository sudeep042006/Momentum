import React from 'react';
import { motion } from 'framer-motion';

export default function TodayOverview({ completedTasks, totalTasks }) {
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // SVG Circle calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center relative shadow-lg">
      <h3 className="absolute top-6 left-6 text-sm font-bold text-white tracking-widest">Today Overview</h3>
      
      <div className="relative mt-8 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-momentum-bg opacity-50"
          />
          {/* Progress Circle */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            className="text-momentum-green-bright drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
          />
        </svg>
        
        {/* Percentage Text inside circle */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-white">{percentage}%</span>
          <span className="text-xs text-momentum-text-secondary uppercase tracking-wider mt-1">Completed</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-momentum-green-bright font-medium text-lg">
          {completedTasks} <span className="text-momentum-text-secondary">/ {totalTasks} Tasks Completed</span>
        </p>
        <p className="text-momentum-text-secondary text-sm mt-1">
          {percentage === 100 && totalTasks > 0 ? "Perfect day! Great job." : 
           percentage >= 50 ? "Great progress! Keep it up." : 
           "Let's build some momentum."}
        </p>
      </div>
    </div>
  );
}
