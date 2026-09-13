import React from 'react';
import { Power, Loader2 } from 'lucide-react';
import { ProxyEntity, VpnStatus } from '../types';
import { FormatUtils } from '../utils/formatUtils';

interface PowerDialButtonProps {
  vpnStatus: VpnStatus;
  selectedProxy: ProxyEntity | null;
  connectionDurationMs: number;
  onToggleConnect: () => void;
}

export const PowerDialButton: React.FC<PowerDialButtonProps> = ({
  vpnStatus,
  selectedProxy,
  connectionDurationMs,
  onToggleConnect,
}) => {
  const isConnected = vpnStatus === 'CONNECTED';
  const isConnecting = vpnStatus === 'CONNECTING';

  return (
    <div className="flex flex-col items-center justify-center my-6">
      {/* Outer Halo & Breathing Ring */}
      <div className="relative flex items-center justify-center">
        {/* Animated aura ring */}
        {isConnected && (
          <div className="absolute -inset-4 rounded-full bg-[#00E5FF]/20 blur-xl animate-pulse-ring pointer-events-none" />
        )}
        {isConnecting && (
          <div className="absolute -inset-3 rounded-full bg-amber-400/20 blur-lg animate-ping pointer-events-none" />
        )}

        {/* Circular Dial Button */}
        <button
          id="power_dial_button"
          data-testid="power_dial_button"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleConnect();
          }}
          disabled={isConnecting}
          className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 cursor-pointer select-none group ${
            isConnected
              ? 'bg-gradient-to-b from-[#162942] to-[#0A1A2F] border-4 border-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.4)]'
              : isConnecting
              ? 'bg-[#162032] border-4 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] cursor-wait'
              : 'bg-gradient-to-b from-[#1E2D44] to-[#121A28] border-4 border-slate-700/80 hover:border-[#00E5FF]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Inner Circular Track */}
          <div className="flex flex-col items-center justify-center pointer-events-none">
            {isConnecting ? (
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-1" />
            ) : (
              <Power
                className={`w-12 h-12 transition-all duration-300 ${
                  isConnected
                    ? 'text-[#00E5FF] filter drop-shadow-[0_0_12px_#00E5FF]'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
            )}

            <span
              className={`text-xs font-extrabold tracking-wider uppercase mt-2 ${
                isConnected
                  ? 'text-[#00E5FF]'
                  : isConnecting
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              {isConnected
                ? 'CONNECTED'
                : isConnecting
                ? 'CONNECTING'
                : 'DISCONNECTED'}
            </span>

            {/* Connection Duration or Status Subtext */}
            {isConnected ? (
              <span className="text-[11px] font-mono font-semibold text-emerald-400 mt-0.5">
                {FormatUtils.formatDuration(connectionDurationMs)}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-0.5">
                {isConnecting ? 'Establishing...' : 'TAP TO CONNECT'}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Action Connect/Disconnect Button Tag */}
      <div className="mt-4 flex flex-col items-center">
        <button
          id="action_connect_button"
          data-testid="action_connect_button"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleConnect();
          }}
          disabled={isConnecting}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer select-none ${
            isConnected
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : isConnecting
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
              : 'bg-[#2563EB] text-white hover:bg-blue-600 border border-blue-400/30'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>
            {isConnected
              ? 'DISCONNECT PROXY'
              : isConnecting
              ? 'CONNECTING...'
              : 'CONNECT NOW'}
          </span>
        </button>

        {selectedProxy && (
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Securing with{' '}
            <span className="text-slate-200 font-semibold">{selectedProxy.protocol}</span>{' '}
            via{' '}
            <span className="text-[#00E5FF] font-semibold">{selectedProxy.name}</span>
          </p>
        )}
      </div>
    </div>
  );
};
