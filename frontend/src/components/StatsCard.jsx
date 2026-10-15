import React from 'react';

const StatsCard = ({ title, value, colorClass, label }) => {
  return (
    <div className={`glass-panel p-6 flex flex-col gap-2 relative overflow-hidden transition-transform hover:scale-105 cursor-default`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`}></div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
};

export default StatsCard;
