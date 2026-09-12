import React from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { IpInfo, VpnStatus } from '../types';
import { FormatUtils } from '../utils/formatUtils';

interface NetworkStatusCardProps {
  ipInfo: IpInfo;
  vpnStatus: VpnStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const NetworkStatusCard: React.FC<NetworkStatusCardProps> = ({
  ipInfo,
  vpnStatus,
  isRefreshing,
  onRefresh,
}) => {
  const isProtected = vpnStatus === 'CONNECTED';
  const statusColorClass = isProtected ? 'text-emerald-400' : 'text-amber-400';
  const borderStatusClass = isProtected
    ? 'border-emerald-500/30'
    : 'border-amber-500/30';

  return (
    <div
      id="network_status_card"
      data-testid="network_status_card"
      className={`w-full rounded-2xl bg-[#162032]/95 border ${borderStatusClass} p-4 shadow-lg transition-all duration-300`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isProtected ? 'bg-emerald-500/15' : 'bg-amber-500/15'
            }`}
          >
            {isProtected ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <h3
              className={`text-xs font-bold tracking-wider uppercase ${statusColorClass}`}
            >
              {isProtected ? 'NETWORK PROTECTED' : 'DIRECT CONNECTION'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isProtected
                ? 'Traffic routed through secure proxy'
                : 'Public IP address is exposed'}
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          id="refresh_ip_button"
          data-testid="refresh_ip_button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Check current IP"
          className="p-2 rounded-xl text-[#00E5FF] hover:bg-[#00E5FF]/10 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* IP & Geo Details Row */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl bg-[#1E2D44]/70 p-3.5 border border-[#1E2D44]/60">
        <div>
          <span className="text-[10px] uppercase font-medium tracking-wider text-slate-400">
            Public IP Address
          </span>
          <div className="text-lg font-mono font-bold text-slate-100 mt-0.5 tracking-tight">
            {ipInfo.ip}
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-right">
          <span className="text-2xl select-none" role="img" aria-label="country flag">
            {FormatUtils.getCountryFlag(ipInfo.countryCode)}
          </span>
          <div>
            <div className="text-xs font-medium text-slate-100">
              {ipInfo.country || 'Global'}
            </div>
            <div className="text-[11px] text-slate-400 max-w-[140px] truncate">
              {ipInfo.city || ipInfo.isp}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
