import React, { useState, useMemo } from 'react';
import { Trash2, Terminal, Filter } from 'lucide-react';
import { UiLog } from '../types';

interface LogsTabProps {
  logs: UiLog[];
  onClearLogs: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'>('ALL');

  const filteredLogs = useMemo(() => {
    if (filter === 'ALL') return logs;
    return logs.filter((log) => log.level === filter);
  }, [logs, filter]);

  const filters: Array<'ALL' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'> = [
    'ALL',
    'INFO',
    'SUCCESS',
    'WARN',
    'ERROR',
  ];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toTimeString().split(' ')[0];
  };

  const getLevelStyle = (level: UiLog['level']) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'WARN':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      case 'ERROR':
        return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      default:
        return 'text-[#00E5FF] bg-[#00E5FF]/15 border-[#00E5FF]/30';
    }
  };

  return (
    <div className="space-y-3.5 pb-20 animate-in fade-in duration-300" id="logs_tab" data-testid="logs_tab">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#00E5FF]" />
            Connection Logs
          </h2>
          <p className="text-xs text-slate-400">
            {filteredLogs.length} network event {filteredLogs.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <button
          id="clear_logs_button"
          data-testid="clear_logs_button"
          onClick={onClearLogs}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all disabled:opacity-40"
          title="Clear all logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]'
                : 'bg-[#162032] text-slate-400 hover:text-slate-200 border border-[#1E2D44]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#162032] border border-[#1E2D44] my-6">
          <Terminal className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-slate-400">No logs available</p>
          <p className="text-xs text-slate-500 mt-1">Events and connection status will be recorded here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl bg-[#162032]/90 border border-[#1E2D44] p-3 shadow-sm hover:border-[#1E2D44]/90 transition-all flex items-start gap-2.5"
            >
              {/* Level Badge */}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 font-mono ${getLevelStyle(
                  log.level
                )}`}
              >
                {log.level.slice(0, 4)}
              </span>

              {/* Message Details */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    [{log.tag}]
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-300 mt-1 break-words leading-relaxed">
                  {log.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
