export class FormatUtils {
  static getCountryFlag(countryCode: string | undefined): string {
    if (!countryCode || countryCode.length < 2) return '🌐';
    const code = countryCode.toUpperCase().slice(0, 2);
    // Convert 2-letter ISO code to regional indicator symbol flags
    const codePoints = [...code].map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  static getCountryName(countryCode: string | undefined): string {
    if (!countryCode) return 'Global';
    const code = countryCode.toUpperCase().trim();
    const names: Record<string, string> = {
      VN: 'Vietnam',
      SG: 'Singapore',
      US: 'United States',
      JP: 'Japan',
      KR: 'South Korea',
      HK: 'Hong Kong',
      TW: 'Taiwan',
      TH: 'Thailand',
      DE: 'Germany',
      GB: 'United Kingdom',
      FR: 'France',
      NL: 'Netherlands',
      CA: 'Canada',
      AU: 'Australia',
      IN: 'India',
      ID: 'Indonesia',
      MY: 'Malaysia',
      PH: 'Philippines',
    };
    return names[code] || code;
  }

  static formatLocation(country: string, city: string): string {
    const cleanCity = city?.trim() || '';
    const countryName = this.getCountryName(country);
    if (cleanCity && cleanCity !== countryName) {
      return `${cleanCity}, ${countryName}`;
    }
    return countryName || 'Unknown Location';
  }

  static formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formatted = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${formatted} ${units[i] || 'TB'}`;
  }

  static formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}
