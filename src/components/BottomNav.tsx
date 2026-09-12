import React from 'react';
import { Shield, Server, Terminal, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
  unreadLogsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadLogsCount = 0,
}) => {
  const tabs = [
    { id: 0, label: 'Dashboard', icon: Shield, testTag: 'nav_tab_dashboard' },
    { id: 1, label: 'Proxies', icon: Server, testTag: 'nav_tab_proxies' },
    { id: 2, label: 'Logs', icon: Terminal, testTag: 'nav_tab_logs', badge: unreadLogsCount },
    { id: 3, label: 'Settings', icon: Settings, testTag: 'nav_tab_settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-lg border-t border-[#1E2D44] px-3 py-1.5 pb-safe"
      id="main_navigation_bar"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={tab.testTag}
              data-testid={tab.testTag}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#00E5FF] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#00E5FF] text-[#0F172A]">
                    {tab.badge && tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
