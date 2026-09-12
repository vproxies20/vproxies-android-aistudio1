import { GatewayItem, Protocol, ProxyEntity } from '../types';
import { FormatUtils } from './formatUtils';

export class ProxyParser {
  /**
   * Parse a single proxy line in various formats:
   * 1) host:port
   * 2) host:port:user:pass
   * 3) protocol://user:pass@host:port
   * 4) user:pass@host:port
   */
  static parseLine(rawLine: string, index = 0, defaultProtocol: Protocol = 'SOCKS5'): ProxyEntity | null {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return null;

    let host = '';
    let port = 0;
    let username: string | undefined;
    let password: string | undefined;
    let protocol: Protocol = defaultProtocol;
    let country = 'VN';
    let city = 'VProxies Node';
    let name = '';

    // Check protocol scheme (e.g. socks5://user:pass@host:port)
    let work = trimmed;
    const protocolMatch = work.match(/^(socks5|socks4|http|https):\/\/(.*)$/i);
    if (protocolMatch) {
      protocol = protocolMatch[1].toUpperCase() as Protocol;
      work = protocolMatch[2];
    }

    // Check for @ symbol (user:pass@host:port)
    if (work.includes('@')) {
      const atSplit = work.split('@');
      const creds = atSplit[0];
      const hostPortPart = atSplit[1];

      if (creds.includes(':')) {
        const [u, p] = creds.split(':');
        username = u;
        password = p;
      } else {
        username = creds;
      }

      const hostPort = hostPortPart.split(':');
      host = hostPort[0]?.trim();
      port = parseInt(hostPort[1]?.trim(), 10) || (protocol === 'HTTP' ? 8080 : 1080);
    } else {
      const parts = work.split(':').map((p) => p.trim());
      if (parts.length === 2) {
        host = parts[0];
        port = parseInt(parts[1], 10) || 1080;
      } else if (parts.length === 4) {
        const isFirstIp = /^[\d\.]+$|^[a-zA-Z0-9\.\-]+$/.test(parts[0]) && !isNaN(Number(parts[1]));
        if (isFirstIp) {
          host = parts[0];
          port = parseInt(parts[1], 10) || 1080;
          username = parts[2];
          password = parts[3];
        } else {
          username = parts[0];
          password = parts[1];
          host = parts[2];
          port = parseInt(parts[3], 10) || 1080;
        }
      } else if (parts.length === 3) {
        host = parts[0];
        port = parseInt(parts[1], 10) || 1080;
        username = parts[2];
      } else {
        return null;
      }
    }

    if (!host || !port || isNaN(port)) {
      return null;
    }

    if (defaultProtocol === 'SOCKS5' && !protocolMatch) {
      if (port === 80 || port === 8080 || port === 3128 || port === 8888) {
        protocol = 'HTTP';
      } else if (port === 443 || port === 8443) {
        protocol = 'HTTPS';
      }
    }

    const shortHost = host.length > 22 ? `${host.slice(0, 19)}...` : host;
    name = `VProxies · ${protocol} (${shortHost}:${port})`;
    const id = `custom-${Date.now()}-${index}`;

    return {
      id,
      name,
      host,
      port,
      protocol,
      username: username || undefined,
      password: password || undefined,
      country,
      city,
      latencyMs: null,
    };
  }

  /**
   * Parse multiline text of custom proxies
   */
  static parseBulkText(text: string, defaultProtocol: Protocol = 'SOCKS5'): ProxyEntity[] {
    const lines = text.split(/\r?\n/);
    const result: ProxyEntity[] = [];

    lines.forEach((line, idx) => {
      const parsed = this.parseLine(line, idx, defaultProtocol);
      if (parsed) {
        result.push(parsed);
      }
    });

    return result;
  }

  /**
   * Dynamically build gateway groups from the active proxy list
   */
  static buildGatewaysFromProxies(proxies: ProxyEntity[]): GatewayItem[] {
    const countryMap = new Map<string, { count: number; sampleCity: string }>();

    proxies.forEach((p) => {
      const code = (p.country || 'GLOBAL').toUpperCase();
      const existing = countryMap.get(code);
      if (existing) {
        existing.count += 1;
      } else {
        countryMap.set(code, { count: 1, sampleCity: p.city });
      }
    });

    const gateways: GatewayItem[] = [];

    countryMap.forEach((val, code) => {
      const id = `gw-${code.toLowerCase()}`;
      const countryName = FormatUtils.getCountryName(code);
      gateways.push({
        id,
        name: `VProxies ${countryName}`,
        cleanName: countryName,
        display: `VProxies ${countryName} Gateway (${val.count})`,
        count: val.count,
      });
    });

    if (gateways.length === 0) {
      gateways.push({
        id: 'gw-vproxies-default',
        name: 'VProxies Primary Cluster',
        cleanName: 'Primary Cluster',
        display: 'VProxies Primary Cluster',
        count: 0,
      });
    }

    return gateways;
  }
}
