
import React from 'react';

interface TimerProps {
  seconds: number;
  maxSeconds: number;
}

export const Timer: React.FC<TimerProps> = ({ seconds, maxSeconds }) => {
  const percentage = (seconds / maxSeconds) * 100;
  
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path 
            className="text-gray-800" 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3"
        ></path>
        <path 
            className="text-primary drop-shadow-[0_0_8px_rgba(13,185,242,0.8)] transition-all duration-100 ease-linear" 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" 
            strokeDasharray={`${percentage}, 100`} 
            strokeLinecap="round" 
            strokeWidth="3"
        ></path>
      </svg>
      <span className="text-sm font-bold text-white">{Math.ceil(seconds)}</span>
    </div>
  );
};
