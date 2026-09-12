import React, { useState } from 'react';
import { X, Search, Check, Smartphone } from 'lucide-react';
import { AppInfoItem } from '../types';

interface AppPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppInfoItem[];
  selectedAppPackages: string[];
  onToggleApp: (packageName: string) => void;
  onSave: () => void;
}

export const AppPickerModal: React.FC<AppPickerModalProps> = ({
  isOpen,
  onClose,
  apps,
  selectedAppPackages,
  onToggleApp,
  onSave,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredApps = apps.filter(
    (app) =>
      app.appName.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-[#162032] border border-[#00E5FF]/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2D44] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#00E5FF]" />
              Proxy Application Routing
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select apps that will route network traffic through the proxy tunnel
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1E2D44]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#1E2D44] bg-[#0F172A]/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search installed applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0F172A] border border-[#1E2D44] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        {/* App List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-[#1E2D44]/30">
          {filteredApps.map((app) => {
            const isChecked = selectedAppPackages.includes(app.packageName);
            return (
              <div
                key={app.packageName}
                onClick={() => onToggleApp(app.packageName)}
                className="pt-2 first:pt-0 flex items-center justify-between p-2.5 rounded-xl hover:bg-[#1E2D44]/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-[#0F172A] border border-[#1E2D44] flex items-center justify-center font-bold text-[#00E5FF] text-sm shrink-0">
                    {app.appName.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {app.appName}
                      </span>
                      {app.isSystemApp && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-700/60 text-slate-400 font-mono">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {app.packageName}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-[#00E5FF] border-[#00E5FF] text-[#0A0E17]'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#1E2D44] bg-[#0F172A]/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            <strong className="text-[#00E5FF]">{selectedAppPackages.length}</strong> apps selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              id="app_picker_done_button"
              data-testid="app_picker_done_button"
              onClick={() => {
                onSave();
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold text-[#0A0E17] bg-[#00E5FF] hover:bg-[#00E5FF]/90 rounded-xl shadow-lg transition-all active:scale-95"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
