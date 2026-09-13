import React from 'react';
import { AccountInfo, IpInfo, Protocol, ProxyEntity, VpnStatus } from '../types';
import { NetworkStatusCard } from './NetworkStatusCard';
import { QuickSwitchCard } from './QuickSwitchCard';
import { PowerDialButton } from './PowerDialButton';
import { SpeedTrafficCard } from './SpeedTrafficCard';
import { Activity, ShieldCheck, Zap, Copy, Check, Lock } from 'lucide-react';

interface DashboardTabProps {
  vpnStatus: VpnStatus;
  selectedProxy: ProxyEntity | null;
  allProxies: ProxyEntity[];
  accountInfo?: AccountInfo | null;
  ipInfo: IpInfo;
  isRefreshingIp: boolean;
  connectionDurationMs: number;
  uploadRate: number;
  downloadRate: number;
  totalUpload: number;
  totalDownload: number;
  uploadHistory: number[];
  downloadHistory: number[];
  onRefreshIp: () => void;
  onSelectProxy: (proxy: ProxyEntity) => void;
  onProtocolChange: (protocol: Protocol) => void;
  onToggleConnect: () => void;
  onQuickPing: () => void;
  onNavigateToSettings?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  vpnStatus,
  selectedProxy,
  allProxies,
  accountInfo,
  ipInfo,
  isRefreshingIp,
  connectionDurationMs,
  uploadRate,
  downloadRate,
  totalUpload,
  totalDownload,
  uploadHistory,
  downloadHistory,
  onRefreshIp,
  onSelectProxy,
  onProtocolChange,
  onToggleConnect,
  onQuickPing,
  onNavigateToSettings,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(ipInfo.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Network Status Card */}
      <NetworkStatusCard
        ipInfo={ipInfo}
        vpnStatus={vpnStatus}
        isRefreshing={isRefreshingIp}
        onRefresh={onRefreshIp}
      />

      {/* Main Power Dial Master Button */}
      <PowerDialButton
        vpnStatus={vpnStatus}
        selectedProxy={selectedProxy}
        connectionDurationMs={connectionDurationMs}
        onToggleConnect={onToggleConnect}
      />

      {/* Unauthenticated / No Proxies Notice */}
      {!accountInfo && allProxies.length === 0 && (
        <div className="rounded-2xl p-3.5 bg-[#162032] border border-[#00E5FF]/30 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center shrink-0 text-[#00E5FF]">
              <Lock className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-slate-100">No Proxy Available</h4>
              <p className="text-[11px] text-slate-400 truncate">Sign in to your account to synchronize proxy list</p>
            </div>
          </div>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shrink-0 transition-all shadow-md active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Quick Switch Card */}
      <QuickSwitchCard
        currentProxy={selectedProxy}
        allProxies={allProxies}
        onSelectProxy={onSelectProxy}
        onProtocolChange={onProtocolChange}
      />

      {/* Real-time Traffic and Speed Card */}
      <SpeedTrafficCard
        uploadRate={uploadRate}
        downloadRate={downloadRate}
        totalUpload={totalUpload}
        totalDownload={totalDownload}
        uploadHistory={uploadHistory}
        downloadHistory={downloadHistory}
      />

      {/* Quick Tool Strip */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleCopyIp}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#162032] border border-[#1E2D44] hover:border-[#00E5FF]/40 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied IP!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#00E5FF]" />
              <span>Copy Public IP</span>
            </>
          )}
        </button>

        <button
          onClick={onQuickPing}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#162032] border border-[#1E2D44] hover:border-[#00E5FF]/40 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <Activity className="w-4 h-4 text-[#00E5FF]" />
          <span>Ping Test All</span>
        </button>
      </div>
    </div>
  );
};
