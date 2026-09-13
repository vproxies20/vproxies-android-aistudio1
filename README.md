# VProxies AI Studio Android preview

The existing React interface is bundled offline inside Android. A restricted, same-origin
WebView bridge calls the native VProxies API client and the official sing-box VPN service.
The native overlay is adapted from vproxies20/vproxies-android commit
`4a38a591f453fdd59a67d138d2bf529c7c6e3ea5` under GPL-3.0-or-later.

## Preview build

Version 0.6.3 is a diagnostic build, not a confirmed device connectivity fix.
It journals Connect/Stop requests, service startup stages and startup errors at
their source, independently of UI callbacks. These local events appear in Logs.
The real React buttons and bridge now have interaction regression tests; Android
responses are substituted in those tests, so they do not validate a real tunnel.

Version 0.6.2 selects VPN mode before binding the service observer, so fresh installs
receive status and startup errors from VPNService instead of the idle ProxyService.
Connection notices now reflect native permission/startup state. Stop requests during
startup are queued until the upstream service can accept them.

Version 0.6.1 integrates the English UI and button interaction updates from main
commit `bc0c723cbcd0bf33cd5b4f50991f3636b3595190`. Android retains native login,
API-supplied proxy lists and actual VPN service status; the web prototype's default
account, example proxies and simulated connection timer are not used in this APK.

GitHub Actions builds an ARM64 debug APK for modern Android phones. The preview uses
`app.vproxies.aistudio`, separate from the existing VProxies Android installation.
There is no production release, auto-update channel or stable release signing key yet.
Do not publish the debug APK as a production release.

The workflow builds the React assets, pins the VPN core and Android client, applies
`scripts/prepare-upstream.py`, builds libbox for ARM64, compiles the APK, verifies its
signature and uploads `VProxies-AIStudio-ARM64-preview` as an Actions artifact.

## Real operations

- API login uses `POST https://api.vproxies.app/api/v1/auth/login` with `login` and `password`.
- Entitlement, gateways, proxies and direct connection envelopes come from the API.
- API tokens remain in native memory. Optional remembered login fields use Android Keystore.
- Connect prepares a native profile and requests Android VPN permission. Status comes from
  the real service callback; cancelling permission does not report a connected state.
- The selected source proxy is dialled directly; no management API or management key is embedded.
- IP checks make an actual HTTPS request over the selected physical/VPN network. Country/ISP
  remain Unknown rather than inventing geo data. Proxy host is not treated as the exit IP.
- The UI displays Android UID traffic counters for this application, not a precise per-proxy
  byte accounting feed. They can include API and health-check overhead.
- Per-app routing lists launcher-visible installed applications. Settings apply on reconnect.
- Bypass LAN and DNS settings are passed to the native configuration. Strict DNS protection
  blocks DNS-over-TLS port 853; application-specific DoH is not detected or universally blocked.
- The UI's HTTPS catalog label follows the existing API client's HTTP CONNECT convention;
  it does not imply TLS to the proxy unless the API contract explicitly supplies that capability.
- Updating is explicitly unavailable in this preview rather than reporting a fake latest version.

## Validation still required on a device

Test login rejection and success, empty proxy lists, hidden endpoints, VPN permission cancellation,
HTTP/HTTPS/SOCKS4/SOCKS5 with real authorized proxies, exit IP, DNS, per-app routing, reconnect,
Always-on, network changes, phone rotation and DeX. A successful compile is not an end-to-end VPN test.

## Licensing

This APK includes GPL-3.0-or-later sing-box-derived code. Distribution must comply with that
license, including corresponding source for the exact APK. See LICENSE and THIRD-PARTY-NOTICES.md.
