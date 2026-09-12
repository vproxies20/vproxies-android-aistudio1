import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Protocol, ProxyEntity } from '../types';
import { FormatUtils } from '../utils/formatUtils';

interface QuickSwitchCardProps {
  currentProxy: ProxyEntity | null;
  allProxies: ProxyEntity[];
  onSelectProxy: (proxy: ProxyEntity) => void;
  onProtocolChange?: (protocol: Protocol) => void;
}

export const QuickSwitchCard: React.FC<QuickSwitchCardProps> = ({
  currentProxy,
  allProxies,
  onSelectProxy,
  onProtocolChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const protocols: Protocol[] = ['SOCKS5', 'SOCKS4', 'HTTP', 'HTTPS'];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const latencyColor = (latency?: number | null) => {
    if (!latency) return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    if (latency < 100) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (latency < 300) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div
      id="quick_switch_card"
      data-testid="quick_switch_card"
      className="w-full rounded-2xl bg-[#162032]/95 border border-[#00E5FF]/25 p-3.5 shadow-lg relative"
      ref={dropdownRef}
    >
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 px-1">
        Target Proxy Server
      </div>

      {/* Main Switch Bar */}
      <div
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E2D44]/80 hover:bg-[#1E2D44] cursor-pointer border border-[#1E2D44] transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center text-xl shrink-0 border border-[#00E5FF]/20">
            {currentProxy ? (
              <span>{FormatUtils.getCountryFlag(currentProxy.country)}</span>
            ) : (
              <Globe className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-[#00E5FF]/15 text-[#00E5FF] font-mono">
                {currentProxy?.protocol || 'SOCKS5'}
              </span>
              <h4 className="text-sm font-semibold text-slate-100 truncate">
                {currentProxy ? currentProxy.name : 'Select a proxy server'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {currentProxy
                ? FormatUtils.formatLocation(currentProxy.country, currentProxy.city)
                : 'Tap to pick server location'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {currentProxy?.latencyMs != null && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${latencyColor(
                currentProxy.latencyMs
              )}`}
            >
              {currentProxy.latencyMs}ms
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              dropdownOpen ? 'rotate-180 text-[#00E5FF]' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute top-[102%] left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl bg-[#162032] border border-[#00E5FF]/30 shadow-2xl p-1.5">
          {allProxies.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 leading-relaxed">
              <p className="font-semibold text-slate-300 mb-1">Chưa có proxy nào</p>
              <p className="text-[11px] text-slate-500">Đăng nhập tài khoản VProxies để đồng bộ danh sách proxy cá nhân.</p>
            </div>
          ) : (
            allProxies.map((proxy) => {
              const isSelected = proxy.id === currentProxy?.id;
              return (
                <button
                  key={proxy.id}
                  onClick={() => {
                    onSelectProxy(proxy);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-[#00E5FF]/15 text-[#00E5FF] font-semibold'
                      : 'hover:bg-[#1E2D44] text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-lg shrink-0">
                      {FormatUtils.getCountryFlag(proxy.country)}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-medium truncate">
                        {FormatUtils.formatLocation(proxy.country, proxy.city)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {proxy.protocol} · {proxy.host}:{proxy.port}
                      </div>
                    </div>
                  </div>

                  {proxy.latencyMs != null && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ml-2 ${latencyColor(
                        proxy.latencyMs
                      )}`}
                    >
                      {proxy.latencyMs}ms
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Quick Protocol Switcher Pills */}
      {currentProxy && onProtocolChange && (
        <div className="mt-2.5 grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#0F172A] border border-[#1E2D44]/70">
          {protocols.map((proto) => {
            const isCurrent = currentProxy.protocol.toUpperCase() === proto;
            return (
              <button
                key={proto}
                onClick={() => onProtocolChange(proto)}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E2D44]'
                }`}
              >
                {proto}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
