import React from 'react';
import { Shield, ShieldAlert, Wifi } from 'lucide-react';
import { VpnStatus } from '../types';

interface NavbarProps {
  vpnStatus: VpnStatus;
  activeProxyName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ vpnStatus, activeProxyName }) => {
  const isConnected = vpnStatus === 'CONNECTED';
  const isConnecting = vpnStatus === 'CONNECTING';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E2D44] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0A0E17] border border-[#00E5FF]/60 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
            <img
              src="/vproxies_logo.png"
              alt="VProxies"
              className="w-full h-full object-cover rounded"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-50">VProxies</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#00E5FF]/15 text-[#00E5FF]">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {activeProxyName ? activeProxyName : 'Secure Network Tunnel'}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : isConnecting
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {isConnected ? (
              <>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>PROTECTED</span>
              </>
            ) : isConnecting ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>CONNECTING</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>UNPROTECTED</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
