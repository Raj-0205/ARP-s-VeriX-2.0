import React from 'react';
import { Bell, User, Zap } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 border-b border-white/5 bg-midnight-dark/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Zap className="text-electric-blue w-4 h-4" />
        <span className="text-sm font-medium text-gray-400">System Status: <span className="text-electric-green">Operational</span></span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer p-2 hover:bg-white/5 rounded-full transition-colors">
          <Bell size={20} className="text-gray-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-electric-red rounded-full"></span>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right">
            <p className="text-xs font-medium text-white">Admin User</p>
            <p className="text-[10px] text-gray-500">Security Lead</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-electric-blue/20 flex items-center justify-center border border-electric-blue/50">
            <User size={16} className="text-electric-blue" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
