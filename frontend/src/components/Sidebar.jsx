import React, { useState } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  History, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react';

const Sidebar = ({ currentView = 'dashboard', onSelectView, historyCount = 0, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'history', icon: History, label: 'Scan History', badge: historyCount },
  ];

  return (
    <div className={`h-screen transition-all duration-300 bg-midnight-dark border-r border-white/5 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <Shield className="text-electric-blue w-8 h-8 shrink-0" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wider neon-text-blue leading-none">VERIX</span>
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mt-1">SVP Platform</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onSelectView && onSelectView(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all group ${
                isActive 
                  ? 'bg-electric-blue/15 text-electric-blue border border-electric-blue/30 shadow-neon-blue/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="font-semibold text-xs tracking-wide">{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-electric-blue text-midnight-darkest' : 'bg-white/10 text-gray-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls: Logout & Collapse */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {onLogout && (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-semibold"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        )}

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
