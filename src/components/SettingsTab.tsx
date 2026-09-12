import React, { useState } from 'react';
import {
  User,
  Shield,
  Route,
  Smartphone,
  Globe,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock,
  ExternalLink,
  Wifi,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  AccountInfo,
  AppInfoItem,
  DnsOption,
  RoutingMode,
  UpdateCheckState,
} from '../types';
import { AppPickerModal } from './AppPickerModal';

interface SettingsTabProps {
  accountInfo: AccountInfo | null;
  isAccountBusy: boolean;
  routingMode: RoutingMode;
  selectedApps: string[];
  installedApps: AppInfoItem[];
  alwaysOnVpn: boolean;
  dnsOption: DnsOption;
  customDnsIp: string;
  preventDnsLeaks: boolean;
  dnsThroughProxy: boolean;
  updateCheckState: UpdateCheckState;
  onLogin: (identity: string, pass: string, remember: boolean) => void;
  onLogout: () => void;
  onSetRoutingMode: (mode: RoutingMode) => void;
  onSaveSelectedApps: (apps: string[]) => void;
  onSetAlwaysOnVpn: (val: boolean) => void;
  onSetDnsOption: (opt: DnsOption) => void;
  onSetCustomDnsIp: (ip: string) => void;
  onSetPreventDnsLeaks: (val: boolean) => void;
  onSetDnsThroughProxy: (val: boolean) => void;
  onCheckForUpdates: () => void;
  proxiesCount?: number;
  onPurgeAllProxies?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  accountInfo,
  isAccountBusy,
  routingMode,
  selectedApps,
  installedApps,
  alwaysOnVpn,
  dnsOption,
  customDnsIp,
  preventDnsLeaks,
  dnsThroughProxy,
  updateCheckState,
  onLogin,
  onLogout,
  onSetRoutingMode,
  onSaveSelectedApps,
  onSetAlwaysOnVpn,
  onSetDnsOption,
  onSetCustomDnsIp,
  onSetPreventDnsLeaks,
  onSetDnsThroughProxy,
  onCheckForUpdates,
  proxiesCount = 0,
  onPurgeAllProxies,
}) => {
  const [identityInput, setIdentityInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberAccount, setRememberAccount] = useState(true);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [tempSelectedApps, setTempSelectedApps] = useState<string[]>(selectedApps);
  const [customDnsValue, setCustomDnsValue] = useState(customDnsIp);
  const [vpnSettingsNotification, setVpnSettingsNotification] = useState(false);

  const handleToggleApp = (pkg: string) => {
    setTempSelectedApps((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    );
  };

  const handleSaveApps = () => {
    onSaveSelectedApps(tempSelectedApps);
  };

  const dnsOptionsList: Array<{ key: DnsOption; label: string; ip: string }> = [
    { key: 'CLOUDFLARE', label: 'Cloudflare', ip: '1.1.1.1' },
    { key: 'GOOGLE', label: 'Google', ip: '8.8.8.8' },
    { key: 'OPENDNS', label: 'OpenDNS', ip: '208.67.222.222' },
    { key: 'QUAD9', label: 'Quad9', ip: '9.9.9.9' },
    { key: 'PROXY', label: 'DNS qua VProxies', ip: 'Auto' },
    { key: 'CUSTOM', label: 'Tùy chỉnh', ip: customDnsIp },
  ];

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300" id="settings_tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Cài đặt & Cấu hình</h2>
          <p className="text-xs text-slate-400">Quản lý tài khoản VProxies, đường hầm định tuyến và DNS bảo mật</p>
        </div>
      </div>

      {/* 1. VProxies Account Card */}
      <div className="rounded-2xl bg-[#162032] border border-[#00E5FF]/25 p-4 shadow-lg">
        <div className="flex items-center gap-3 pb-3 border-b border-[#1E2D44]">
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] border border-[#00E5FF]/60 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
            <img
              src="/vproxies_logo.png"
              alt="VProxies"
              className="w-full h-full object-cover rounded"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Tài khoản VProxies
              {accountInfo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Đang hoạt động
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {accountInfo
                ? `Đồng bộ độc quyền cho thành viên ${accountInfo.identity}`
                : 'Đăng nhập để tự động tải danh sách node và gateway VProxies của bạn'}
            </p>
          </div>
        </div>

        {accountInfo ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-[#1E2D44]">
              <div>
                <div className="text-xs font-bold text-slate-200">{accountInfo.identity}</div>
                <div className="text-[11px] text-slate-400">
                  {accountInfo.packageName} · Còn {accountInfo.remainingDays} ngày
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors border border-rose-500/30"
              >
                Đăng xuất
              </button>
            </div>

            {/* Zero-Residual Proxy Security Feature Card */}
            <div className="p-3 rounded-xl bg-[#0F172A] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Chế độ Không lưu sẵn & Xoá khi đăng xuất
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                  Đang kích hoạt
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Đã sync <strong>{proxiesCount} proxy</strong> từ dịch vụ VProxies. Khi bạn nhấn <strong>"Đăng xuất"</strong>, toàn bộ proxy, gateway và cache phiên sẽ được tự động xóa sạch 100% khỏi thiết bị để bảo vệ quyền riêng tư.
              </p>
              {onPurgeAllProxies && proxiesCount > 0 && (
                <div className="pt-1 flex items-center justify-between border-t border-[#1E2D44]">
                  <span className="text-[10px] text-slate-400">Muốn dọn dẹp bộ nhớ ngay?</span>
                  <button
                    onClick={onPurgeAllProxies}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xoá sạch proxy ngay</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tài khoản hoặc Email VProxies
              </label>
              <input
                type="text"
                placeholder="saobien hoặc user@vproxies.app"
                value={identityInput}
                onChange={(e) => setIdentityInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#0F172A] border border-[#1E2D44] text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#0F172A] border border-[#1E2D44] text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRememberAccount(!rememberAccount)}>
              <input
                type="checkbox"
                checked={rememberAccount}
                onChange={(e) => setRememberAccount(e.target.checked)}
                className="rounded border-slate-700 text-[#00E5FF] focus:ring-0"
              />
              <span className="text-xs text-slate-300">Ghi nhớ phiên đăng nhập</span>
            </div>

            <div className="pt-1 space-y-2">
              <button
                id="submit_login_button"
                data-testid="submit_login_button"
                onClick={() => onLogin(identityInput, passwordInput, rememberAccount)}
                disabled={isAccountBusy || !identityInput.trim()}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAccountBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Đăng nhập & Đồng bộ VProxies</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentityInput('saobien');
                  setPasswordInput('VProxies2026!');
                }}
                className="w-full py-2 rounded-xl border border-slate-700 hover:border-[#00E5FF]/40 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-all text-center"
              >
                Điền nhanh tài khoản saobien
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#0F172A] border border-[#00E5FF]/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00E5FF]">
                <ShieldCheck className="w-4 h-4" />
                <span>Không lưu sẵn & Xoá sạch khi đăng xuất</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ứng dụng hoàn toàn <strong>không lưu sẵn bất kỳ proxy nào trên máy</strong> khi chưa đăng nhập. Khi bạn đăng nhập tài khoản, hệ thống mới tự động sync danh sách proxy; và khi đăng xuất, toàn bộ proxy đã sync sẽ bị <strong>xoá sạch hoàn toàn</strong> khỏi thiết bị.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Routing Mode Card */}
      <div
        id="routing_mode_card"
        data-testid="routing_mode_card"
        className="rounded-2xl bg-[#162032] border border-[#00E5FF]/25 p-4 shadow-lg"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <Route className="w-5 h-5 text-[#00E5FF]" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Chế độ định tuyến mạng (Routing)</h3>
            <p className="text-[11px] text-slate-400">Chọn chính sách chuyển hướng lưu lượng mạng qua tunnel</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            {
              id: 0 as RoutingMode,
              title: 'Route All Traffic (Toàn bộ)',
              desc: 'Tất cả ứng dụng và kết nối internet đi qua Proxy',
            },
            {
              id: 1 as RoutingMode,
              title: 'Bypass LAN & Direct Local (Bỏ qua mạng nội bộ)',
              desc: 'Không định tuyến các địa chỉ LAN nội bộ (192.168.x.x, 10.x.x.x)',
            },
            {
              id: 2 as RoutingMode,
              title: 'Selected Apps Only (Phân luồng ứng dụng)',
              desc: 'Chỉ các ứng dụng được chỉ định mới chạy qua Proxy Tunnel',
            },
          ].map((mode) => (
            <label
              key={mode.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                routingMode === mode.id
                  ? 'bg-[#1E2D44] border-[#00E5FF]'
                  : 'bg-[#0F172A] border-[#1E2D44] hover:bg-[#1A263D]'
              }`}
            >
              <input
                type="radio"
                name="routingMode"
                checked={routingMode === mode.id}
                onChange={() => onSetRoutingMode(mode.id)}
                className="mt-0.5 text-[#00E5FF] focus:ring-0"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-200">{mode.title}</div>
                <div className="text-[11px] text-slate-400">{mode.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* If Selected Apps Mode is active, show app selector */}
        {routingMode === 2 && (
          <div className="mt-3 p-3 rounded-xl bg-[#0F172A] border border-[#1E2D44] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-xs text-slate-300">
                Đã chọn: <strong>{selectedApps.length} ứng dụng</strong>
              </span>
            </div>
            <button
              onClick={() => setShowAppPicker(true)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-blue-600 transition-colors"
            >
              Quản lý ứng dụng
            </button>
          </div>
        )}
      </div>

      {/* 3. DNS & Leak Protection Card */}
      <div className="rounded-2xl bg-[#162032] border border-[#00E5FF]/25 p-4 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#1E2D44]">
          <Globe className="w-5 h-5 text-[#00E5FF]" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Bảo mật DNS & Chống rò rỉ (Leak Protection)</h3>
            <p className="text-[11px] text-slate-400">Ngăn ngừa lộ thông tin nhà mạng thực tế</p>
          </div>
        </div>

        {/* DNS Server Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-2">
            MÁY CHỦ DNS BẢO MẬT
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dnsOptionsList.map((opt) => {
              const isSelected = dnsOption === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onSetDnsOption(opt.key)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-[#0F172A] border-[#1E2D44] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{opt.ip}</div>
                </button>
              );
            })}
          </div>

          {dnsOption === 'CUSTOM' && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customDnsValue}
                onChange={(e) => setCustomDnsValue(e.target.value)}
                placeholder="1.1.1.1 hoặc 8.8.8.8"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#0F172A] border border-[#1E2D44] text-white focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                onClick={() => onSetCustomDnsIp(customDnsValue)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#2563EB] text-white hover:bg-blue-600"
              >
                Lưu
              </button>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-2.5 pt-2 border-t border-[#1E2D44]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Prevent DNS Leaks (Chống rò rỉ DNS)
              </span>
              <span className="text-[11px] text-slate-400">
                Ép tất cả truy vấn DNS đi qua mạng mã hóa an toàn
              </span>
            </div>
            <input
              type="checkbox"
              checked={preventDnsLeaks}
              onChange={(e) => onSetPreventDnsLeaks(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-[#00E5FF] focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Route DNS through Proxy
              </span>
              <span className="text-[11px] text-slate-400">
                Cho phép máy chủ VProxies tự phân giải tên miền từ xa
              </span>
            </div>
            <input
              type="checkbox"
              checked={dnsThroughProxy}
              onChange={(e) => onSetDnsThroughProxy(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-[#00E5FF] focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Always-on VPN Kill Switch
              </span>
              <span className="text-[11px] text-slate-400">
                Chặn toàn bộ truy cập internet nếu kết nối Proxy bị đứt
              </span>
            </div>
            <input
              type="checkbox"
              checked={alwaysOnVpn}
              onChange={(e) => {
                onSetAlwaysOnVpn(e.target.checked);
                setVpnSettingsNotification(true);
                setTimeout(() => setVpnSettingsNotification(false), 3000);
              }}
              className="w-4 h-4 rounded border-slate-700 text-[#00E5FF] focus:ring-0"
            />
          </div>

          {vpnSettingsNotification && (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã lưu cài đặt VPN an toàn.</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Updates & System Info */}
      <div className="rounded-2xl bg-[#162032] border border-[#00E5FF]/25 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Hệ thống & Cập nhật</h3>
            <p className="text-[11px] text-slate-400">Phiên bản VProxies Client: v2.4.0-stable</p>
          </div>
          <button
            onClick={onCheckForUpdates}
            disabled={updateCheckState.status === 'checking'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E2D44] hover:bg-[#1E2D44]/80 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${updateCheckState.status === 'checking' ? 'animate-spin' : ''}`}
            />
            <span>{updateCheckState.status === 'checking' ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}</span>
          </button>
        </div>

        {updateCheckState.status === 'available' && (
          <div className="p-3 rounded-xl bg-[#0F172A] border border-[#00E5FF]/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">
                {updateCheckState.hasNewerVersion
                  ? `Có bản nâng cấp ${updateCheckState.latestVersion}`
                  : 'Bạn đang sử dụng phiên bản mới nhất'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                v{updateCheckState.currentVersion}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {updateCheckState.changelog}
            </p>
          </div>
        )}
      </div>

      {/* App Picker Modal for Split Tunneling */}
      <AppPickerModal
        isOpen={showAppPicker}
        onClose={() => setShowAppPicker(false)}
        apps={installedApps}
        selectedPackages={tempSelectedApps}
        onToggleApp={handleToggleApp}
        onSave={handleSaveApps}
      />
    </div>
  );
};
