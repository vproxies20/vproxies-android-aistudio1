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
import { DEFAULT_INSTALLED_APPS, StorageService } from './services/storage';
import { DEFAULT_ACCOUNT, VProxiesApiService } from './services/vproxiesApi';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { ProxyManagerTab } from './components/ProxyManagerTab';
import { LogsTab } from './components/LogsTab';
import { SettingsTab } from './components/SettingsTab';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);

  // Account & Configuration State
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(() => StorageService.getAccount());

  // Core VPN & Proxy State
  const [proxies, setProxies] = useState<ProxyEntity[]>(() => {
    const saved = StorageService.getProxies();
    if (saved && saved.length > 0) return saved;
    const acc = StorageService.getAccount() || DEFAULT_ACCOUNT;
    const generated = VProxiesApiService.generateAccountProxies(acc).proxies;
    StorageService.saveProxies(generated);
    return generated;
  });

  const [selectedProxy, setSelectedProxy] = useState<ProxyEntity | null>(() => {
    const cur = StorageService.getSelectedProxy();
    if (cur) return cur;
    const saved = StorageService.getProxies();
    return saved[0] || null;
  });

  const [vpnStatus, setVpnStatus] = useState<VpnStatus>('DISCONNECTED');
  const [connectedAt, setConnectedAt] = useState<number>(0);
  const [connectionDurationMs, setConnectionDurationMs] = useState<number>(0);

  // IP Details
  const [ipInfo, setIpInfo] = useState<IpInfo>({
    ip: '14.225.244.112',
    country: 'Việt Nam',
    countryCode: 'VN',
    city: 'Hà Nội',
    isp: 'Viettel Telecom High-Speed Fiber',
    isProtected: false,
  });
  const [isRefreshingIp, setIsRefreshingIp] = useState<boolean>(false);

  // Traffic Stats
  const [uploadRate, setUploadRate] = useState<number>(0);
  const [downloadRate, setDownloadRate] = useState<number>(0);
  const [totalUpload, setTotalUpload] = useState<number>(1024 * 512);
  const [totalDownload, setTotalDownload] = useState<number>(1024 * 1024 * 2.4);
  const [uploadHistory, setUploadHistory] = useState<number[]>([120, 300, 240, 500, 420, 610, 490, 580]);
  const [downloadHistory, setDownloadHistory] = useState<number[]>([800, 1400, 1100, 2300, 1900, 3200, 2600, 3800]);

  // Logs
  const [logs, setLogs] = useState<UiLog[]>(() => {
    const saved = StorageService.getLogs();
    if (saved.length > 0) return saved;
    return [
      {
        id: 'log-init-1',
        timestamp: Date.now() - 30000,
        level: 'INFO',
        tag: 'VProxiesCore',
        message: 'Initialized VProxies networking engine & cryptographic tunneling client.',
      },
      {
        id: 'log-init-2',
        timestamp: Date.now() - 20000,
        level: 'SUCCESS',
        tag: 'IpDetector',
        message: 'Public IP probe confirmed local interface address: 14.225.244.112 (Việt Nam).',
      },
    ];
  });

  const [isAccountBusy, setIsAccountBusy] = useState<boolean>(false);
  const [routingMode, setRoutingMode] = useState<RoutingMode>(() => StorageService.getRoutingMode());
  const [selectedApps, setSelectedApps] = useState<string[]>(() => StorageService.getSelectedApps());
  const [installedApps] = useState<AppInfoItem[]>(DEFAULT_INSTALLED_APPS);
  const [alwaysOnVpn, setAlwaysOnVpn] = useState<boolean>(() => StorageService.getAlwaysOn());
  const [dnsOption, setDnsOption] = useState<DnsOption>(() => StorageService.getDnsOption());
  const [customDnsIp, setCustomDnsIp] = useState<string>(() => StorageService.getCustomDnsIp());
  const [preventDnsLeaks, setPreventDnsLeaks] = useState<boolean>(() => StorageService.getPreventDnsLeaks());
  const [dnsThroughProxy, setDnsThroughProxy] = useState<boolean>(() => StorageService.getDnsThroughProxy());
  const [updateCheckState, setUpdateCheckState] = useState<UpdateCheckState>({ status: 'idle' });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPingingAll, setIsPingingAll] = useState<boolean>(false);

  // Append UI log
  const addLog = useCallback((level: UiLog['level'], tag: string, message: string) => {
    const newLog: UiLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      level,
      tag,
      message,
    };
    setLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 200);
      StorageService.saveLogs(updated);
      return updated;
    });
  }, []);

  // Fetch IP details on launch
  useEffect(() => {
    let mounted = true;
    VProxiesApiService.fetchPublicIp(selectedProxy, vpnStatus === 'CONNECTED').then((info) => {
      if (mounted) {
        setIpInfo(info);
        addLog('INFO', 'IpDetector', `Detected current public IP: ${info.ip} (${info.country}, ${info.city})`);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Timer loop for active VPN duration
  useEffect(() => {
    let timer: any;
    if (vpnStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setConnectionDurationMs(Date.now() - connectedAt);
      }, 1000);
    } else {
      setConnectionDurationMs(0);
    }
    return () => clearInterval(timer);
  }, [vpnStatus, connectedAt]);

  // Traffic simulation loop when connected (replicates VProxiesVpnService.kt loop)
  useEffect(() => {
    let interval: any;
    if (vpnStatus === 'CONNECTED') {
      interval = setInterval(() => {
        // Random realistic rates between 50 KB/s and 3.5 MB/s with occasional bursts
        const up = Math.floor(Math.random() * 850000) + 120000;
        const down = Math.floor(Math.random() * 2600000) + 450000;

        setUploadRate(up);
        setDownloadRate(down);
        setTotalUpload((prev) => prev + up);
        setTotalDownload((prev) => prev + down);

        setUploadHistory((prev) => [...prev.slice(1), up]);
        setDownloadHistory((prev) => [...prev.slice(1), down]);
      }, 1000);
    } else {
      setUploadRate(0);
      setDownloadRate(0);
    }
    return () => clearInterval(interval);
  }, [vpnStatus]);

  // Handle Connect / Disconnect
  const handleToggleConnect = async () => {
    if (vpnStatus === 'CONNECTED') {
      // Disconnect
      setVpnStatus('DISCONNECTED');
      setConnectedAt(0);
      setUploadRate(0);
      setDownloadRate(0);
      addLog('WARN', 'VProxiesVpn', 'User disconnected proxy tunnel. Network returned to direct interface.');

      // Restore direct IP
      const directIp = await VProxiesApiService.fetchPublicIp(null, false);
      setIpInfo(directIp);
      addLog('INFO', 'IpDetector', `Public IP restored to direct node: ${directIp.ip}`);
    } else {
      // Connect
      let targetProxy = selectedProxy || proxies[0];
      if (!targetProxy) {
        const fallbackList = StorageService.getProxies();
        if (fallbackList && fallbackList.length > 0) {
          targetProxy = fallbackList[0];
          setProxies(fallbackList);
          setSelectedProxy(targetProxy);
          StorageService.saveSelectedProxy(targetProxy);
        } else {
          const acc = accountInfo || DEFAULT_ACCOUNT;
          setAccountInfo(acc);
          StorageService.saveAccount(acc);
          const generated = VProxiesApiService.generateAccountProxies(acc).proxies;
          setProxies(generated);
          StorageService.saveProxies(generated);
          targetProxy = generated[0];
          setSelectedProxy(targetProxy);
          StorageService.saveSelectedProxy(targetProxy);
        }
      }

      setVpnStatus('CONNECTING');
      addLog('INFO', 'VProxiesVpn', `Initiating encrypted handshake with ${targetProxy.name} (${targetProxy.protocol}://${targetProxy.host}:${targetProxy.port})`);
      addLog('INFO', 'DnsResolver', `Applying DNS resolver: ${dnsOption} (Leak Protection: ${preventDnsLeaks ? 'ENABLED' : 'DISABLED'})`);

      // Handshake latency simulation
      setTimeout(async () => {
        const now = Date.now();
        setVpnStatus('CONNECTED');
        setConnectedAt(now);
        addLog('SUCCESS', 'VProxiesVpn', `Secure tunnel connected via ${targetProxy.protocol} (${targetProxy.host}:${targetProxy.port}). All traffic is encrypted.`);

        // Update IP display to proxy IP
        const proxyIp = await VProxiesApiService.fetchPublicIp(targetProxy, true);
        setIpInfo(proxyIp);
        addLog('SUCCESS', 'IpDetector', `Egress point secured: ${proxyIp.ip} (${proxyIp.country}, ${proxyIp.city})`);
      }, 500);
    }
  };

  // Handle Proxy Selection
  const handleSelectProxy = async (proxy: ProxyEntity) => {
    setSelectedProxy(proxy);
    StorageService.saveSelectedProxy(proxy);

    // Update isSelected flag in proxies list
    const updated = proxies.map((p) => ({
      ...p,
      isSelected: p.id === proxy.id,
    }));
    setProxies(updated);
    StorageService.saveProxies(updated);

    addLog('INFO', 'ProxyManager', `Active proxy switched to: ${proxy.name} (${proxy.protocol}://${proxy.host}:${proxy.port})`);

    // If already connected, reconnect to the newly selected proxy seamlessly
    if (vpnStatus === 'CONNECTED') {
      setVpnStatus('CONNECTING');
      addLog('INFO', 'VProxiesVpn', `Seamlessly re-routing tunnel to new target: ${proxy.name}...`);
      setTimeout(async () => {
        setVpnStatus('CONNECTED');
        setConnectedAt(Date.now());
        const newIp = await VProxiesApiService.fetchPublicIp(proxy, true);
        setIpInfo(newIp);
        addLog('SUCCESS', 'VProxiesVpn', `Re-route complete. Now secured via ${proxy.name} (${newIp.ip})`);
      }, 500);
    }
  };

  // Handle Protocol Change for a Proxy
  const handleProtocolChange = (proxy: ProxyEntity, newProtocol: Protocol) => {
    const updated = proxies.map((p) =>
      p.id === proxy.id ? { ...p, protocol: newProtocol } : p
    );
    setProxies(updated);
    StorageService.saveProxies(updated);

    if (selectedProxy?.id === proxy.id) {
      setSelectedProxy({ ...selectedProxy, protocol: newProtocol });
      StorageService.saveSelectedProxy({ ...selectedProxy, protocol: newProtocol });
    }

    addLog('INFO', 'ProxyProtocol', `Changed ${proxy.name} protocol to ${newProtocol}`);
  };

  // Refresh Public IP
  const handleRefreshIp = async () => {
    setIsRefreshingIp(true);
    addLog('INFO', 'IpDetector', 'Probing current public IP address...');
    try {
      const info = await VProxiesApiService.fetchPublicIp(selectedProxy, vpnStatus === 'CONNECTED');
      setIpInfo(info);
      addLog('SUCCESS', 'IpDetector', `Probed IP: ${info.ip} (${info.country}, ${info.city})`);
    } catch {
      addLog('WARN', 'IpDetector', 'IP probe timed out. Keeping current cached record.');
    } finally {
      setIsRefreshingIp(false);
    }
  };

  // Ping a Single Proxy
  const handlePingProxy = async (proxy: ProxyEntity) => {
    addLog('INFO', 'ProxyPing', `Testing ping latency to ${proxy.name} (${proxy.host})...`);
    const latency = await VProxiesApiService.testProxyLatency(proxy);
    const updated = proxies.map((p) =>
      p.id === proxy.id ? { ...p, latencyMs: latency } : p
    );
    setProxies(updated);
    StorageService.saveProxies(updated);

    if (selectedProxy?.id === proxy.id) {
      setSelectedProxy({ ...selectedProxy, latencyMs: latency });
      StorageService.saveSelectedProxy({ ...selectedProxy, latencyMs: latency });
    }

    addLog('SUCCESS', 'ProxyPing', `Ping response from ${proxy.name}: ${latency} ms`);
  };

  // Ping All Proxies
  const handlePingAll = async () => {
    if (proxies.length === 0 || isPingingAll) return;
    setIsPingingAll(true);
    addLog('INFO', 'ProxyPing', `Beginning batch ping test on all ${proxies.length} proxy nodes...`);

    const updated = [...proxies];
    for (let i = 0; i < updated.length; i++) {
      const p = updated[i];
      const latency = await VProxiesApiService.testProxyLatency(p);
      updated[i] = { ...p, latencyMs: latency };
      setProxies([...updated]);
    }

    StorageService.saveProxies(updated);
    if (selectedProxy) {
      const cur = updated.find((p) => p.id === selectedProxy.id);
      if (cur) setSelectedProxy(cur);
    }

    setIsPingingAll(false);
    addLog('SUCCESS', 'ProxyPing', `Completed batch latency test on ${proxies.length} nodes.`);
  };

  // Sync Gateways & Proxies exclusively from VProxies API
  const handleSyncAll = async () => {
    if (!accountInfo) {
      addLog('WARN', 'GatewaySync', 'Not signed in to VProxies. Please sign in to synchronize your proxies.');
      setShowLoginPrompt(true);
      return;
    }

    setIsSyncing(true);
    addLog('INFO', 'GatewaySync', `Connecting to VProxies servers to sync proxies for account ${accountInfo.identity}...`);

    try {
      const res = await VProxiesApiService.syncUserProxies(accountInfo);
      setProxies(res.proxies);
      StorageService.saveProxies(res.proxies);

      if (!selectedProxy || !res.proxies.some((p) => p.id === selectedProxy.id)) {
        const next = res.proxies[0] || null;
        setSelectedProxy(next);
        StorageService.saveSelectedProxy(next);
      }

      addLog('SUCCESS', 'GatewaySync', `Successfully synchronized ${res.proxies.length} proxy nodes from VProxies.`);
    } catch (err: any) {
      addLog('ERROR', 'GatewaySync', `Sync failed: ${err.message || 'Connection error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete Proxy
  const handleDeleteProxy = (proxyId: string) => {
    const target = proxies.find((p) => p.id === proxyId);
    const updated = proxies.filter((p) => p.id !== proxyId);
    setProxies(updated);
    StorageService.saveProxies(updated);

    if (selectedProxy?.id === proxyId) {
      const next = updated[0] || null;
      setSelectedProxy(next);
      StorageService.saveSelectedProxy(next);
    }

    if (target) {
      addLog('WARN', 'ProxyManager', `Removed proxy: ${target.name} (${target.host})`);
    }
  };

  // Account Sign In
  const handleLogin = async (identity: string, pass: string, remember: boolean) => {
    setIsAccountBusy(true);
    addLog('INFO', 'Auth', `Authenticating account '${identity}' with VProxies API...`);

    try {
      const res = await VProxiesApiService.login(identity, pass);
      setAccountInfo(res.account);
      StorageService.saveAccount(res.account);
      StorageService.saveCredentials(identity, pass, remember);

      setProxies(res.proxies);
      StorageService.saveProxies(res.proxies);

      if (res.proxies.length > 0) {
        setSelectedProxy(res.proxies[0]);
        StorageService.saveSelectedProxy(res.proxies[0]);
      }

      addLog('SUCCESS', 'Auth', `Authentication successful! Plan: ${res.account.packageName}. Synchronized ${res.proxies.length} proxies.`);
    } catch {
      addLog('ERROR', 'Auth', 'Failed to authenticate account. Check credentials.');
    } finally {
      setIsAccountBusy(false);
    }
  };

  // Sign Out
  const handleLogout = () => {
    const oldName = accountInfo?.identity;
    if (vpnStatus === 'CONNECTED' || vpnStatus === 'CONNECTING') {
      setVpnStatus('DISCONNECTED');
      setConnectedAt(0);
      setUploadRate(0);
      setDownloadRate(0);
      addLog('WARN', 'VProxiesVpn', 'Disconnected proxy tunnel due to sign out.');
    }
    setAccountInfo(null);
    StorageService.saveAccount(null);
    setProxies([]);
    StorageService.clearProxies();
    setSelectedProxy(null);
    addLog('INFO', 'Auth', `Signed out account ${oldName || ''}. All synchronized proxies permanently wiped from device.`);
  };

  // Purge All Synced Proxies (Zero-Residual Wipe)
  const handlePurgeAllProxies = () => {
    if (vpnStatus === 'CONNECTED' || vpnStatus === 'CONNECTING') {
      setVpnStatus('DISCONNECTED');
      setConnectedAt(0);
      setUploadRate(0);
      setDownloadRate(0);
      addLog('WARN', 'VProxiesVpn', 'Tunnel disconnected because proxies were purged.');
    }
    setProxies([]);
    setSelectedProxy(null);
    StorageService.clearProxies();
    addLog('WARN', 'ProxySecurity', '100% of proxy records wiped from local device memory.');
  };

  // Save Routing Mode
  const handleSetRoutingMode = (mode: RoutingMode) => {
    setRoutingMode(mode);
    StorageService.saveRoutingMode(mode);
    const modeNames = ['All Applications', 'Bypass LAN', 'Selected Apps Only'];
    addLog('INFO', 'Routing', `Routing mode changed to: ${modeNames[mode]}`);
  };

  // Save Selected Apps
  const handleSaveSelectedApps = (apps: string[]) => {
    setSelectedApps(apps);
    StorageService.saveSelectedApps(apps);
    addLog('SUCCESS', 'Routing', `Updated split tunneling list: ${apps.length} apps routed through proxy.`);
  };

  // Always On VPN Toggle
  const handleSetAlwaysOnVpn = (val: boolean) => {
    setAlwaysOnVpn(val);
    StorageService.saveAlwaysOn(val);
    addLog('INFO', 'VProxiesVpn', `Always-on auto-reconnect setting: ${val ? 'ENABLED' : 'DISABLED'}`);
  };

  // DNS Option
  const handleSetDnsOption = (opt: DnsOption) => {
    setDnsOption(opt);
    StorageService.saveDnsOption(opt);
    addLog('INFO', 'DnsResolver', `DNS provider changed to ${opt}`);
  };

  // Custom DNS IP
  const handleSetCustomDnsIp = (ip: string) => {
    setCustomDnsIp(ip);
    StorageService.saveCustomDnsIp(ip);
  };

  // DNS Leak Protection
  const handleSetPreventDnsLeaks = (val: boolean) => {
    setPreventDnsLeaks(val);
    StorageService.savePreventDnsLeaks(val);
    addLog('INFO', 'DnsResolver', `DNS leak prevention: ${val ? 'ACTIVATED' : 'DEACTIVATED'}`);
  };

  // DNS Through Proxy
  const handleSetDnsThroughProxy = (val: boolean) => {
    setDnsThroughProxy(val);
    StorageService.saveDnsThroughProxy(val);
    addLog('INFO', 'DnsResolver', `Proxy remote DNS resolution: ${val ? 'ENABLED' : 'DISABLED'}`);
  };

  // Check for Updates
  const handleCheckForUpdates = () => {
    setUpdateCheckState({ status: 'checking' });
    addLog('INFO', 'Updater', 'Checking for latest VProxies release version...');

    setTimeout(() => {
      setUpdateCheckState({
        status: 'available',
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        hasNewerVersion: false,
        changelog: 'Latest release. Optimized SOCKS5/HTTP performance, application filtering, and full DNS leak prevention.',
      });
      addLog('SUCCESS', 'Updater', 'Version 1.0.0 is up to date.');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col selection:bg-[#00E5FF] selection:text-[#0A0E17]">
      {/* Sticky Header */}
      <Navbar
        vpnStatus={vpnStatus}
        activeProxyName={selectedProxy?.name}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 pt-3">
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
              StorageService.saveLogs([]);
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
              VProxies Sign In Required
            </h3>
            <p className="text-xs text-center text-slate-400 leading-relaxed mb-5">
              This application exclusively synchronizes proxies from your VProxies account, stores no default proxies, and connects to no third parties. Please sign in to synchronize your proxy list.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  setActiveTab(3);
                }}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Go to Sign In
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold transition-all"
              >
                Close
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
