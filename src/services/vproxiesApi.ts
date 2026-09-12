import { AccountInfo, GatewayItem, IpInfo, ProxyEntity } from '../types';
import { nativeCall } from './native';

export class VProxiesApiService {
  static fetchPublicIp(): Promise<IpInfo> { return nativeCall('ip'); }
  static async testProxyLatency(proxy: ProxyEntity): Promise<number> {
    const result = await nativeCall<{latency: number}>('ping', { host: proxy.host, port: proxy.port });
    return result.latency;
  }
  static syncUserProxies(_account?: AccountInfo | null): Promise<{gateways: GatewayItem[]; proxies: ProxyEntity[]}> {
    return nativeCall('sync');
  }
  static login(identity: string, password: string, remember = false): Promise<{account: AccountInfo; proxies: ProxyEntity[]}> {
    return nativeCall('login', { identity, password, remember });
  }
}
