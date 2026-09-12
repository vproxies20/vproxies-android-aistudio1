import { AccountInfo, AppInfoItem, DnsOption, ProxyEntity, RoutingMode, UiLog } from '../types';

const KEYS = {
  PROXIES: 'vproxies_proxies_v1',
  SELECTED_PROXY: 'vproxies_selected_proxy_v1',
  ACCOUNT: 'vproxies_account_v1',
  ROUTING_MODE: 'vproxies_routing_mode',
  SELECTED_APPS: 'vproxies_selected_apps',
  DNS_OPTION: 'vproxies_dns_option',
  CUSTOM_DNS_IP: 'vproxies_custom_dns_ip',
  ALWAYS_ON: 'vproxies_always_on',
  PREVENT_DNS_LEAKS: 'vproxies_prevent_dns_leaks',
  DNS_THROUGH_PROXY: 'vproxies_dns_through_proxy',
  LOGS: 'vproxies_logs_v1',
  SAVED_CREDS: 'vproxies_saved_creds',
};

export const DEFAULT_INSTALLED_APPS: AppInfoItem[] = [
  { packageName: 'com.google.android.youtube', appName: 'YouTube', isSystemApp: false, isSelected: true },
  { packageName: 'com.google.android.chrome', appName: 'Chrome Browser', isSystemApp: true, isSelected: true },
  { packageName: 'org.telegram.messenger', appName: 'Telegram', isSystemApp: false, isSelected: true },
  { packageName: 'com.facebook.katana', appName: 'Facebook', isSystemApp: false, isSelected: false },
  { packageName: 'com.twitter.android', appName: 'X (Twitter)', isSystemApp: false, isSelected: false },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix', isSystemApp: false, isSelected: false },
  { packageName: 'com.spotify.music', appName: 'Spotify', isSystemApp: false, isSelected: false },
  { packageName: 'com.tiktok.android', appName: 'TikTok', isSystemApp: false, isSelected: false },
  { packageName: 'com.discord', appName: 'Discord', isSystemApp: false, isSelected: false },
  { packageName: 'com.android.vending', appName: 'Google Play Store', isSystemApp: true, isSelected: false },
];

export class StorageService {
  /**
   * Return proxy list.
   * STRICT ZERO-RESIDUAL POLICY:
   * Only returns proxies when user has an authenticated VProxies account.
   * If not logged in, any leftover proxy data is wiped and returns empty array.
   */
  static getProxies(): ProxyEntity[] {
    try {
      const account = this.getAccount();
      if (!account) {
        this.clearProxies();
        return [];
      }
      const data = localStorage.getItem(KEYS.PROXIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  static saveProxies(proxies: ProxyEntity[]): void {
    try {
      localStorage.setItem(KEYS.PROXIES, JSON.stringify(proxies));
    } catch {}
  }

  static clearProxies(): void {
    try {
      localStorage.removeItem(KEYS.PROXIES);
      localStorage.removeItem(KEYS.SELECTED_PROXY);
      sessionStorage.removeItem(KEYS.PROXIES);
      sessionStorage.removeItem(KEYS.SELECTED_PROXY);
    } catch {}
  }

  static getSelectedProxy(): ProxyEntity | null {
    try {
      const data = localStorage.getItem(KEYS.SELECTED_PROXY);
      if (data) {
        const parsed = JSON.parse(data);
        const proxies = this.getProxies();
        if (proxies.some((p) => p.id === parsed.id)) {
          return parsed;
        }
      }
    } catch {}
    const proxies = this.getProxies();
    return proxies.find((p) => p.isSelected) || proxies[0] || null;
  }

  static saveSelectedProxy(proxy: ProxyEntity | null): void {
    try {
      if (proxy) {
        localStorage.setItem(KEYS.SELECTED_PROXY, JSON.stringify(proxy));
      } else {
        localStorage.removeItem(KEYS.SELECTED_PROXY);
      }
    } catch {}
  }

  static getAccount(): AccountInfo | null {
    try {
      const data = localStorage.getItem(KEYS.ACCOUNT);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  }

  static saveAccount(account: AccountInfo | null): void {
    try {
      if (account) {
        localStorage.setItem(KEYS.ACCOUNT, JSON.stringify(account));
      } else {
        localStorage.removeItem(KEYS.ACCOUNT);
        localStorage.removeItem(KEYS.PROXIES);
        localStorage.removeItem(KEYS.SELECTED_PROXY);
      }
    } catch {}
  }

  static getRoutingMode(): RoutingMode {
    try {
      const val = localStorage.getItem(KEYS.ROUTING_MODE);
      if (val !== null) return parseInt(val, 10) as RoutingMode;
    } catch {}
    return 0; // Default all traffic
  }

  static saveRoutingMode(mode: RoutingMode): void {
    try {
      localStorage.setItem(KEYS.ROUTING_MODE, mode.toString());
    } catch {}
  }

  static getSelectedApps(): string[] {
    try {
      const data = localStorage.getItem(KEYS.SELECTED_APPS);
      if (data) return JSON.parse(data);
    } catch {}
    return ['com.google.android.youtube', 'com.google.android.chrome', 'org.telegram.messenger'];
  }

  static saveSelectedApps(apps: string[]): void {
    try {
      localStorage.setItem(KEYS.SELECTED_APPS, JSON.stringify(apps));
    } catch {}
  }

  static getDnsOption(): DnsOption {
    try {
      const val = localStorage.getItem(KEYS.DNS_OPTION) as DnsOption;
      if (val) return val;
    } catch {}
    return 'CLOUDFLARE';
  }

  static saveDnsOption(opt: DnsOption): void {
    try {
      localStorage.setItem(KEYS.DNS_OPTION, opt);
    } catch {}
  }

  static getCustomDnsIp(): string {
    try {
      return localStorage.getItem(KEYS.CUSTOM_DNS_IP) || '1.1.1.1';
    } catch {}
    return '1.1.1.1';
  }

  static saveCustomDnsIp(ip: string): void {
    try {
      localStorage.setItem(KEYS.CUSTOM_DNS_IP, ip);
    } catch {}
  }

  static getAlwaysOn(): boolean {
    try {
      return localStorage.getItem(KEYS.ALWAYS_ON) === 'true';
    } catch {}
    return false;
  }

  static saveAlwaysOn(val: boolean): void {
    try {
      localStorage.setItem(KEYS.ALWAYS_ON, val ? 'true' : 'false');
    } catch {}
  }

  static getPreventDnsLeaks(): boolean {
    try {
      const val = localStorage.getItem(KEYS.PREVENT_DNS_LEAKS);
      if (val !== null) return val === 'true';
    } catch {}
    return true; // default true for security
  }

  static savePreventDnsLeaks(val: boolean): void {
    try {
      localStorage.setItem(KEYS.PREVENT_DNS_LEAKS, val ? 'true' : 'false');
    } catch {}
  }

  static getDnsThroughProxy(): boolean {
    try {
      const val = localStorage.getItem(KEYS.DNS_THROUGH_PROXY);
      if (val !== null) return val === 'true';
    } catch {}
    return true;
  }

  static saveDnsThroughProxy(val: boolean): void {
    try {
      localStorage.setItem(KEYS.DNS_THROUGH_PROXY, val ? 'true' : 'false');
    } catch {}
  }

  static getLogs(): UiLog[] {
    try {
      const data = localStorage.getItem(KEYS.LOGS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  static saveLogs(logs: UiLog[]): void {
    try {
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs.slice(0, 200)));
    } catch {}
  }

  static saveCredentials(identity: string, pass: string, remember: boolean): void {
    try {
      if (remember) {
        localStorage.setItem(KEYS.SAVED_CREDS, JSON.stringify({ identity, pass }));
      } else {
        localStorage.removeItem(KEYS.SAVED_CREDS);
      }
    } catch {}
  }

  static getSavedCredentials(): { identity: string; pass: string } | null {
    try {
      const data = localStorage.getItem(KEYS.SAVED_CREDS);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  }
}
