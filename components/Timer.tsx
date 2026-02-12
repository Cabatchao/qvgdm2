
import React from 'react';

interface TimerProps {
  seconds: number;
  maxSeconds: number;
}

export const Timer: React.FC<TimerProps> = ({ seconds, maxSeconds }) => {
  const percentage = (seconds / maxSeconds) * 100;
  const color = seconds <= 3 ? 'text-red-500' : 'text-yellow-400';

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-gray-800"
        />
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={213.6}
          strokeDashoffset={213.6 - (213.6 * percentage) / 100}
          className={`${color} transition-all duration-1000 ease-linear`}
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${color}`}>
        {Math.ceil(seconds)}
      </span>
    </div>
  );
};
