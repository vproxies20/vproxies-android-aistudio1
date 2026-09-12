import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { FormatUtils } from '../utils/formatUtils';

interface SpeedTrafficCardProps {
  uploadRate: number;
  downloadRate: number;
  totalUpload: number;
  totalDownload: number;
  uploadHistory?: number[];
  downloadHistory?: number[];
}

export const SpeedTrafficCard: React.FC<SpeedTrafficCardProps> = ({
  uploadRate,
  downloadRate,
  totalUpload,
  totalDownload,
  uploadHistory = [1200, 1800, 1400, 2900, 2100, 3400, 2600, 3100],
  downloadHistory = [2400, 4800, 3200, 7100, 5600, 8900, 6800, 9200],
}) => {
  // Sparkline renderer for SVG
  const renderSparkline = (data: number[], color: string, isActive: boolean) => {
    if (!data || data.length < 2) return null;
    const maxVal = Math.max(...data, 100);
    const minVal = Math.min(...data, 0);
    const range = maxVal - minVal || 1;
    const width = 140;
    const height = 30;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const normalized = (val - minVal) / range;
        const y = height - normalized * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-8 overflow-visible mt-2"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className={`transition-all duration-300 ${isActive ? 'opacity-90' : 'opacity-40'}`}
        />
      </svg>
    );
  };

  return (
    <div
      id="speed_traffic_row"
      data-testid="speed_traffic_row"
      className="grid grid-cols-2 gap-3 w-full"
    >
      {/* Download Traffic Card */}
      <div className="rounded-2xl bg-[#162032]/90 border border-[#00E5FF]/25 p-3.5 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              DOWNLOAD
            </span>
            <div className="w-5 h-5 rounded-full bg-[#00E5FF]/15 flex items-center justify-center">
              <ArrowDown className="w-3 h-3 text-[#00E5FF]" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-base font-extrabold text-slate-100 font-mono tracking-tight">
              {FormatUtils.formatBytes(downloadRate)}/s
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Total: {FormatUtils.formatBytes(totalDownload)}
            </div>
          </div>
        </div>

        {renderSparkline(downloadHistory, '#00E5FF', downloadRate > 0)}
      </div>

      {/* Upload Traffic Card */}
      <div className="rounded-2xl bg-[#162032]/90 border border-violet-500/25 p-3.5 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              UPLOAD
            </span>
            <div className="w-5 h-5 rounded-full bg-violet-500/15 flex items-center justify-center">
              <ArrowUp className="w-3 h-3 text-violet-400" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-base font-extrabold text-slate-100 font-mono tracking-tight">
              {FormatUtils.formatBytes(uploadRate)}/s
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Total: {FormatUtils.formatBytes(totalUpload)}
            </div>
          </div>
        </div>

        {renderSparkline(uploadHistory, '#8B5CF6', uploadRate > 0)}
      </div>
    </div>
  );
};
