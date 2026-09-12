import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock } from 'lucide-react';
import {
  AccountInfo,
  AppInfoItem,
  DnsOption,
  IpInfo,
  Protocol,
  ProxyEntity,
  RoutingMode,
  UiLog,
  UpdateCheckState,
  VpnStatus,
} from './types';
import { StorageService } from './services/storage';
import { VProxiesApiService } from './services/vproxiesApi';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { ProxyManagerTab } from './components/ProxyManagerTab';
import { LogsTab } from './components/LogsTab';
import { SettingsTab } from './components/SettingsTab';

import { nativeCall, isNative } from './services/native';
export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [proxies, setProxies] = useState<ProxyEntity[]>([]);
  const [selectedProxy, setSelectedProxy] = useState<ProxyEntity | null>(null);
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>('DISCONNECTED');
  const [connectionNotice, setConnectionNotice] = useState('');
  const [connectionDurationMs, setConnectionDurationMs] = useState(0);
  const [ipInfo, setIpInfo] = useState<IpInfo>({ ip: 'Not checked', country: 'Unknown', countryCode: '', city: '', isp: 'Not available', isProtected: false });
  const [isRefreshingIp, setIsRefreshingIp] = useState(false);
  const [uploadRate, setUploadRate] = useState(0);
  const [downloadRate, setDownloadRate] = useState(0);
  const [totalUpload, setTotalUpload] = useState(0);
  const [totalDownload, setTotalDownload] = useState(0);
  const [uploadHistory, setUploadHistory] = useState<number[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<number[]>([]);
  const [logs, setLogs] = useState<UiLog[]>([]);
  const [isAccountBusy, setIsAccountBusy] = useState(false);
  const [routingMode, setRoutingMode] = useState<RoutingMode>(StorageService.getRoutingMode);
  const [selectedApps, setSelectedApps] = useState<string[]>(StorageService.getSelectedApps);
  const [installedApps, setInstalledApps] = useState<AppInfoItem[]>([]);
  const [alwaysOnVpn, setAlwaysOnVpn] = useState(false);
  const [dnsOption, setDnsOption] = useState<DnsOption>(StorageService.getDnsOption);
  const [customDnsIp, setCustomDnsIp] = useState(StorageService.getCustomDnsIp);
  const [preventDnsLeaks, setPreventDnsLeaks] = useState(StorageService.getPreventDnsLeaks);
  const [dnsThroughProxy, setDnsThroughProxy] = useState(StorageService.getDnsThroughProxy);
  const [updateCheckState, setUpdateCheckState] = useState<UpdateCheckState>({ status: 'idle' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPingingAll, setIsPingingAll] = useState(false);
  const connecting = useRef(false);
  const nativeSeen = useRef(new Set<string>());

  const addLog = useCallback((level: UiLog['level'], tag: string, message: string) => {
    setLogs(prev => [{ id: crypto.randomUUID(), timestamp: Date.now(), level, tag, message }, ...prev].slice(0, 200));
  }, []);
  const report = (error: unknown) => addLog('ERROR', 'Android', error instanceof Error ? error.message : String(error));

  useEffect(() => {
    // Discard sample identities, proxy endpoints and plaintext credentials from the web prototype.
    for (const key of ['vproxies_account_v1','vproxies_proxies_v1','vproxies_selected_proxy_v1','vproxies_saved_creds','vproxies_logs_v1'])
      localStorage.removeItem(key);
    if (!isNative()) {
      addLog('WARN', 'Preview', 'Web preview only. VPN and account operations require the Android APK.');
      return;
    }
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let previousState = '';
    let restored = false;
    const poll = async () => {
      try {
        const s = await nativeCall('snapshot');
        if (disposed) return;
        setVpnStatus(s.status);
        if (s.error) setConnectionNotice(s.error);
        else if (s.status === 'CONNECTED') setConnectionNotice('VPN connected.');
        else if (s.status === 'CONNECTING' && s.message) setConnectionNotice(s.message);
        setAccountInfo(s.account);
        setAlwaysOnVpn(s.alwaysOn);
        setConnectionDurationMs(s.connectedAt ? Math.max(0, Date.now() - s.connectedAt) : 0);
        setUploadRate(s.uploadRate); setDownloadRate(s.downloadRate);
        setUploadHistory(prev => [...prev.slice(-19), s.uploadRate]);
        setDownloadHistory(prev => [...prev.slice(-19), s.downloadRate]);
        // UID traffic rates are measured by Android; totals are intentionally not fabricated.
        setTotalUpload(s.totalUpload || 0); setTotalDownload(s.totalDownload || 0);
        for (const entry of [...s.logs].reverse()) {
          if (!nativeSeen.current.has(entry.id)) {
            nativeSeen.current.add(entry.id);
            setLogs(prev => [entry, ...prev].slice(0, 200));
          }
        }
        if (s.account && !restored) {
          restored = true;
          nativeCall('sync').then(res => {
            if (!disposed) { setProxies(res.proxies); setSelectedProxy(res.proxies[0] || null); }
          }).catch(report);
        }
        if (!s.account) restored = false;
        if (s.status !== previousState) {
          previousState = s.status;
          setIpInfo(prev => ({ ...prev, isProtected: false }));
          if (s.status === 'CONNECTED' || s.status === 'DISCONNECTED') {
            VProxiesApiService.fetchPublicIp().then(info => { if (!disposed) setIpInfo(info); }).catch(report);
          }
        }
      } catch (e) { if (!disposed) report(e); }
      if (!disposed) timer = setTimeout(poll, 1000);
    };
    poll();
    nativeCall<AppInfoItem[]>('apps').then(apps => { if (!disposed) setInstalledApps(apps); }).catch(report);
    return () => { disposed = true; clearTimeout(timer); };
  }, [addLog]);

  const handleToggleConnect = async () => {
    if (connecting.current) {
      setConnectionNotice('Still requesting connection details. Please wait for the result.');
      return;
    }
    connecting.current = true;
    try {
      if (vpnStatus === 'CONNECTED' || vpnStatus === 'CONNECTING') {
        setConnectionNotice('Stopping VPN…');
        await nativeCall('disconnect');
        setConnectionNotice('VPN stop requested.');
      }
      else {
        if (!accountInfo) { setShowLoginPrompt(true); return; }
        if (!selectedProxy) {
          setConnectionNotice('No proxy selected. Open Proxies, sync the list and select a proxy.');
          return;
        }
        setConnectionNotice('Requesting connection details…');
        await nativeCall('connect', { proxy: selectedProxy, routingMode, selectedApps, dnsOption, customDnsIp, preventDnsLeaks, dnsThroughProxy });
        setConnectionNotice('Approve the Android VPN permission prompt to continue.');
      }
    } catch (e) {
      setConnectionNotice(e instanceof Error ? e.message : String(e));
      report(e);
    }
    finally { connecting.current = false; }
  };
  const handleSelectProxy = (proxy: ProxyEntity) => {
    if (vpnStatus === 'CONNECTED' || vpnStatus === 'CONNECTING') {
      addLog('WARN', 'Proxy', 'Disconnect before selecting another proxy.'); return;
    }
    setSelectedProxy(proxy);
  };
  const handleProtocolChange = (proxy: ProxyEntity, protocol: Protocol) => {
    if (vpnStatus === 'CONNECTED' || vpnStatus === 'CONNECTING') {
      addLog('WARN', 'Proxy', 'Disconnect before changing protocol.'); return;
    }
    if (proxy.protocols?.length && !proxy.protocols.includes(protocol)) {
      addLog('ERROR', 'Proxy', 'This protocol is not advertised by this proxy.'); return;
    }
    const updated = { ...proxy, protocol };
    setProxies(prev => prev.map(p => p.id === proxy.id ? updated : p));
    if (selectedProxy?.id === proxy.id) setSelectedProxy(updated);
  };
  const handleRefreshIp = async () => {
    setIsRefreshingIp(true);
    try { setIpInfo(await VProxiesApiService.fetchPublicIp()); }
    catch (e) { setIpInfo(prev => ({ ...prev, ip: 'Check failed', isProtected: false })); report(e); }
    finally { setIsRefreshingIp(false); }
  };
  const handlePingProxy = async (proxy: ProxyEntity) => {
    try {
      const latencyMs = await VProxiesApiService.testProxyLatency(proxy);
      setProxies(prev => prev.map(p => p.id === proxy.id ? { ...p, latencyMs } : p));
      setSelectedProxy(prev => prev?.id === proxy.id ? { ...prev, latencyMs } : prev);
      addLog('INFO', 'TCP check', `Proxy port reachable in ${latencyMs} ms. Authentication is not tested.`);
    } catch (e) { report(e); }
  };
  const handlePingAll = async () => {
    if (isPingingAll) return;
    setIsPingingAll(true);
    try { for (const proxy of proxies) await handlePingProxy(proxy); }
    finally { setIsPingingAll(false); }
  };
  const handleSyncAll = async () => {
    if (!accountInfo) { setShowLoginPrompt(true); return; }
    setIsSyncing(true);
    try {
      const result = await VProxiesApiService.syncUserProxies(accountInfo);
      setProxies(result.proxies);
      setSelectedProxy(prev => result.proxies.find(p => p.id === prev?.id) || result.proxies[0] || null);
      addLog('SUCCESS', 'API', `Loaded ${result.proxies.length} proxies from your account.`);
    } catch (e) { report(e); }
    finally { setIsSyncing(false); }
  };
  const handleLogin = async (identity: string, pass: string, remember: boolean) => {
    setIsAccountBusy(true);
    try {
      const result = await VProxiesApiService.login(identity, pass, remember);
      setAccountInfo(result.account);
      addLog('SUCCESS', 'API', 'Signed in. Loading your proxy list.');
    } catch (e) { report(e); }
    finally { setIsAccountBusy(false); }
  };
  const handleLogout = async () => {
    try { await nativeCall('logout'); setAccountInfo(null); setProxies([]); setSelectedProxy(null); }
    catch (e) { report(e); }
  };
  const handlePurgeAllProxies = async () => {
    try { await nativeCall('disconnect'); setProxies([]); setSelectedProxy(null); }
    catch (e) { report(e); }
  };
  const handleDeleteProxy = (id: string) => {
    if (vpnStatus === 'CONNECTED' || vpnStatus === 'CONNECTING') {
      addLog('WARN', 'Proxy', 'Disconnect before removing proxies.'); return;
    }
    setProxies(prev => prev.filter(p => p.id !== id));
    if (selectedProxy?.id === id) setSelectedProxy(null);
  };
  const handleSetRoutingMode = (v: RoutingMode) => { setRoutingMode(v); StorageService.saveRoutingMode(v); addLog('INFO','Settings','Routing changes apply on the next connection.'); };
  const handleSaveSelectedApps = (v: string[]) => { setSelectedApps(v); StorageService.saveSelectedApps(v); };
  const handleSetDnsOption = (v: DnsOption) => { setDnsOption(v); StorageService.saveDnsOption(v); };
  const handleSetCustomDnsIp = (v: string) => { setCustomDnsIp(v); StorageService.saveCustomDnsIp(v); };
  const handleSetPreventDnsLeaks = (v: boolean) => { setPreventDnsLeaks(v); StorageService.savePreventDnsLeaks(v); };
  const handleSetDnsThroughProxy = (v: boolean) => { setDnsThroughProxy(v); StorageService.saveDnsThroughProxy(v); };
  const handleSetAlwaysOnVpn = () => { nativeCall('alwaysOn').catch(report); };
  const handleCheckForUpdates = () => setUpdateCheckState({ status: 'error', message: 'Automatic updates are not configured for this preview APK.' });

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col selection:bg-[#00E5FF] selection:text-[#0A0E17]">
      {/* Sticky Header */}
      <Navbar
        vpnStatus={vpnStatus}
        activeProxyName={selectedProxy?.name}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 pt-3">
        {connectionNotice && (
          <div role="status" aria-live="polite" className="mb-3 rounded-xl border border-amber-400/40 bg-[#162032] p-3 text-sm text-amber-100 break-words">
            {connectionNotice}
            <button onClick={() => setActiveTab(2)} className="ml-3 underline text-[#00E5FF]">View logs</button>
          </div>
        )}
        {activeTab === 0 && (
          <DashboardTab
            vpnStatus={vpnStatus}
            selectedProxy={selectedProxy}
            allProxies={proxies}
            accountInfo={accountInfo}
            ipInfo={ipInfo}
            isRefreshingIp={isRefreshingIp}
            connectionDurationMs={connectionDurationMs}
            uploadRate={uploadRate}
            downloadRate={downloadRate}
            totalUpload={totalUpload}
            totalDownload={totalDownload}
            uploadHistory={uploadHistory}
            downloadHistory={downloadHistory}
            onRefreshIp={handleRefreshIp}
            onSelectProxy={handleSelectProxy}
            onProtocolChange={(proto) => {
              if (selectedProxy) handleProtocolChange(selectedProxy, proto);
            }}
            onToggleConnect={handleToggleConnect}
            onQuickPing={handlePingAll}
            onNavigateToSettings={() => setActiveTab(3)}
          />
        )}

        {activeTab === 1 && (
          <ProxyManagerTab
            proxies={proxies}
            selectedProxy={selectedProxy}
            accountInfo={accountInfo}
            isSyncing={isSyncing}
            isPingingAll={isPingingAll}
            onSelectProxy={handleSelectProxy}
            onPingProxy={handlePingProxy}
            onPingAll={handlePingAll}
            onSyncAll={handleSyncAll}
            onDeleteProxy={handleDeleteProxy}
            onProtocolChange={handleProtocolChange}
            onNavigateToSettings={() => setActiveTab(3)}
            onPurgeAllProxies={handlePurgeAllProxies}
          />
        )}

        {activeTab === 2 && (
          <LogsTab
            logs={logs}
            onClearLogs={() => {
              setLogs([]);
              nativeCall("clearLogs").catch(report);
              addLog('INFO', 'Logs', 'Cleared all event logs.');
            }}
          />
        )}

        {activeTab === 3 && (
          <SettingsTab
            accountInfo={accountInfo}
            isAccountBusy={isAccountBusy}
            routingMode={routingMode}
            selectedApps={selectedApps}
            installedApps={installedApps}
            alwaysOnVpn={alwaysOnVpn}
            dnsOption={dnsOption}
            customDnsIp={customDnsIp}
            preventDnsLeaks={preventDnsLeaks}
            dnsThroughProxy={dnsThroughProxy}
            updateCheckState={updateCheckState}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onSetRoutingMode={handleSetRoutingMode}
            onSaveSelectedApps={handleSaveSelectedApps}
            onSetAlwaysOnVpn={handleSetAlwaysOnVpn}
            onSetDnsOption={handleSetDnsOption}
            onSetCustomDnsIp={handleSetCustomDnsIp}
            onSetPreventDnsLeaks={handleSetPreventDnsLeaks}
            onSetDnsThroughProxy={handleSetDnsThroughProxy}
            onCheckForUpdates={handleCheckForUpdates}
            proxiesCount={proxies.length}
            onPurgeAllProxies={handlePurgeAllProxies}
          />
        )}
      </main>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[#162032] border border-[#00E5FF]/40 p-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center mx-auto mb-3 text-[#00E5FF]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-100 mb-1.5">
              Yêu cầu đăng nhập VProxies
            </h3>
            <p className="text-xs text-center text-slate-400 leading-relaxed mb-5">
              Ứng dụng chỉ đồng bộ proxy độc quyền từ dịch vụ VProxies của bạn, không lưu sẵn proxy và không kết nối bên thứ 3. Vui lòng đăng nhập tài khoản để đồng bộ proxy.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  setActiveTab(3);
                }}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Đến màn hình Đăng nhập
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadLogsCount={logs.filter((l) => l.level === 'WARN' || l.level === 'ERROR').length}
      />
    </div>
  );
};

export default App;
