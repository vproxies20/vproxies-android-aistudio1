export type Protocol = 'SOCKS5' | 'SOCKS4' | 'HTTP' | 'HTTPS';

export type VpnStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface ProxyEntity {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: Protocol;
  protocols?: Protocol[];
  username?: string;
  password?: string;
  country: string;
  city: string;
  gatewayId?: string;
  latencyMs?: number | null;
  isSelected?: boolean;
}

export interface IpInfo {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  org?: string;
  timezone?: string;
  isProtected: boolean;
}

export interface UiLog {
  id: string;
  timestamp: number;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  tag: string;
  message: string;
}

export interface AccountInfo {
  identity: string;
  packageName: string;
  remainingDays: number;
  token?: string;
}

export interface GatewayItem {
  id: string;
  name: string;
  cleanName: string;
  display: string;
  count: number;
}

export interface ProxyApiConfig {
  apiUrl: string;
  apiKey: string;
  providerType: 'vproxies' | 'custom_url' | 'raw_list';
  autoRotateMinutes: number;
  lastSyncedAt?: number;
}

export type RoutingMode = 0 | 1 | 2; // 0: All traffic, 1: Bypass LAN, 2: Selected Apps only

export type DnsOption = 'CLOUDFLARE' | 'GOOGLE' | 'OPENDNS' | 'QUAD9' | 'PROXY' | 'CUSTOM';

export interface AppInfoItem {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
  isSelected: boolean;
}

export type UpdateCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; currentVersion: string; latestVersion: string; hasNewerVersion: boolean; changelog: string }
  | { status: 'error'; message: string };
