import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Check,
  RefreshCw,
  Zap,
  Play,
  RotateCw,
  Lock,
  User,
  ShieldAlert,
} from 'lucide-react';
import { AccountInfo, Protocol, ProxyEntity } from '../types';
import { FormatUtils } from '../utils/formatUtils';

interface ProxyManagerTabProps {
  proxies: ProxyEntity[];
  selectedProxy: ProxyEntity | null;
  accountInfo: AccountInfo | null;
  isSyncing: boolean;
  isPingingAll: boolean;
  onSelectProxy: (proxy: ProxyEntity) => void;
  onPingProxy: (proxy: ProxyEntity) => void;
  onPingAll: () => void;
  onSyncAll: () => void;
  onDeleteProxy: (proxyId: string) => void;
  onProtocolChange: (proxy: ProxyEntity, newProtocol: Protocol) => void;
  onNavigateToSettings: () => void;
  onPurgeAllProxies?: () => void;
}

export const ProxyManagerTab: React.FC<ProxyManagerTabProps> = ({
  proxies,
  selectedProxy,
  accountInfo,
  isSyncing,
  isPingingAll,
  onSelectProxy,
  onPingProxy,
  onPingAll,
  onSyncAll,
  onDeleteProxy,
  onProtocolChange,
  onNavigateToSettings,
  onPurgeAllProxies,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('ALL');

  // Filter proxies
  const filteredProxies = useMemo(() => {
    return proxies.filter((proxy) => {
      const matchQuery =
        !searchQuery.trim() ||
        proxy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proxy.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proxy.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        FormatUtils.getCountryName(proxy.country).toLowerCase().includes(searchQuery.toLowerCase()) ||
        proxy.host.includes(searchQuery);

      const matchProtocol =
        protocolFilter === 'ALL' ||
        proxy.protocol.toUpperCase() === protocolFilter.toUpperCase();

      return matchQuery && matchProtocol;
    });
  }, [proxies, searchQuery, protocolFilter]);

  const protocols = ['ALL', 'SOCKS5', 'HTTP', 'HTTPS', 'SOCKS4'];

  const getLatencyBadge = (latency?: number | null) => {
    if (latency == null) {
      return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', text: '–' };
    }
    if (latency < 100) {
      return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', text: `${latency} ms` };
    }
    if (latency < 250) {
      return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', text: `${latency} ms` };
    }
    return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', text: `${latency} ms` };
  };

  return (
    <div className="space-y-3.5 pb-20 animate-in fade-in duration-300" id="proxy_manager_tab">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Proxy Nodes
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[#00E5FF]/15 text-[#00E5FF]">
              {filteredProxies.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">Hạ tầng Proxy VProxies Dedicated</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Button */}
          <button
            id="sync_proxies_button"
            data-testid="sync_proxies_button"
            onClick={onSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50"
            title="Đồng bộ lại danh sách proxy từ VProxies"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Đồng bộ</span>
          </button>

          {/* Ping All */}
          <button
            id="ping_all_button"
            data-testid="ping_all_button"
            onClick={onPingAll}
            disabled={isPingingAll || proxies.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E2D44] hover:bg-[#1E2D44]/80 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-semibold active:scale-95 transition-all disabled:opacity-40"
            title="Kiểm tra độ trễ tất cả các Node"
          >
            <Zap className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-pulse text-amber-400' : ''}`} />
            <span>Ping All</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="proxy_search_input"
          data-testid="proxy_search_input"
          type="text"
          placeholder="Tìm kiếm theo quốc gia, thành phố, IP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#162032] border border-[#1E2D44] text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Account Status Notice Banner */}
      {accountInfo ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#1E2D44]/70 border border-[#00E5FF]/25 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-200">
                Tài khoản: <strong className="text-white">{accountInfo.identity}</strong> ({proxies.length} nodes đã sync)
              </span>
              <p className="text-[10px] text-slate-400">
                🔒 Tự động xóa sạch toàn bộ proxy khi bạn đăng xuất
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onPurgeAllProxies && proxies.length > 0 && (
              <button
                id="purge_proxies_button"
                data-testid="purge_proxies_button"
                onClick={onPurgeAllProxies}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 active:scale-95 transition-all"
                title="Xóa sạch toàn bộ proxy đã sync khỏi thiết bị ngay bây giờ"
              >
                Xóa sạch proxy
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-[#00E5FF]/30">
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#00E5FF]" />
              Không lưu sẵn proxy (Bảo mật tối đa)
            </h4>
            <p className="text-[11px] text-slate-400">
              Đăng nhập tài khoản VProxies để đồng bộ proxy cá nhân. Khi đăng xuất, toàn bộ proxy sẽ tự động xoá sạch.
            </p>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#2563EB] text-white hover:bg-blue-600 transition-colors shrink-0"
          >
            Đăng nhập
          </button>
        </div>
      )}

      {/* Protocol Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {protocols.map((proto) => (
          <button
            key={proto}
            onClick={() => setProtocolFilter(proto)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              protocolFilter === proto
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]'
                : 'bg-[#162032] text-slate-400 hover:text-slate-200 border border-[#1E2D44]'
            }`}
          >
            {proto === 'ALL' ? 'All Protocols' : proto}
          </button>
        ))}
      </div>

      {/* Proxy List or Empty State */}
      {filteredProxies.length === 0 ? (
        !accountInfo ? (
          <div className="p-8 text-center rounded-2xl bg-[#162032] border border-[#1E2D44] my-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center mx-auto mb-3.5 text-[#00E5FF]">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Chưa đăng nhập tài khoản VProxies
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-5">
              Hệ thống không lưu sẵn proxy trên máy. Vui lòng đăng nhập tài khoản VProxies để đồng bộ danh sách proxy và các cụm gateway riêng biệt của bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                id="login_to_sync_button"
                data-testid="login_to_sync_button"
                onClick={onNavigateToSettings}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập tài khoản VProxies</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[#162032] border border-[#1E2D44] my-4 shadow-xl">
            <RefreshCw className="w-10 h-10 text-[#00E5FF] mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-100 mb-1">
              {searchQuery || protocolFilter !== 'ALL'
                ? 'Không tìm thấy proxy phù hợp với bộ lọc'
                : `Chưa có proxy nào cho tài khoản ${accountInfo.identity}`}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-4">
              {searchQuery || protocolFilter !== 'ALL'
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc giao thức.'
                : 'Nhấn nút bên dưới để đồng bộ danh sách proxy từ máy chủ VProxies về thiết bị.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                id="empty_sync_button"
                data-testid="empty_sync_button"
                onClick={onSyncAll}
                disabled={isSyncing}
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white font-bold text-xs shadow-md hover:bg-blue-600 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Đồng bộ từ VProxies</span>
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
          {filteredProxies.map((proxy) => {
            const isSelected = selectedProxy?.id === proxy.id;
            const latencyBadge = getLatencyBadge(proxy.latencyMs);

            return (
              <div
                key={proxy.id}
                id={`proxy_item_${proxy.id}`}
                data-testid={`proxy_item_${proxy.id}`}
                onClick={() => onSelectProxy(proxy)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-[#1E2D44] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-[#162032] border-[#1E2D44] hover:border-slate-700 hover:bg-[#1A263D]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Flag & Main Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0F172A] border border-[#1E2D44] flex items-center justify-center text-lg shrink-0">
                      {FormatUtils.getCountryFlag(proxy.country)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-100 truncate">{proxy.name}</h4>
                        {isSelected && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00E5FF] text-[#0A0E17]">
                            <Check className="w-2.5 h-2.5" />
                            ĐANG CHỌN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-mono text-slate-300">
                          {proxy.host}:{proxy.port}
                        </span>
                        <span>•</span>
                        <span>{proxy.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & Badges */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Protocol Toggle Selector */}
                    <div className="flex items-center rounded-lg bg-[#0F172A] border border-[#1E2D44] p-0.5">
                      <button
                        onClick={() => onProtocolChange(proxy, 'SOCKS5')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          proxy.protocol === 'SOCKS5'
                            ? 'bg-[#00E5FF] text-[#0A0E17]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Đổi sang SOCKS5"
                      >
                        S5
                      </button>
                      <button
                        onClick={() => onProtocolChange(proxy, 'HTTP')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          proxy.protocol === 'HTTP'
                            ? 'bg-[#00E5FF] text-[#0A0E17]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Đổi sang HTTP"
                      >
                        HTTP
                      </button>
                    </div>

                    {/* Latency Badge / Ping button */}
                    <button
                      onClick={() => onPingProxy(proxy)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-medium border flex items-center gap-1 hover:brightness-125 transition-all ${latencyBadge.color}`}
                      title="Bấm để kiểm tra lại Ping"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{latencyBadge.text}</span>
                    </button>

                    {/* Quick Connect / Select Button */}
                    {!isSelected && (
                      <button
                        onClick={() => onSelectProxy(proxy)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                        title="Chọn Proxy này"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteProxy(proxy.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Xóa Proxy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
