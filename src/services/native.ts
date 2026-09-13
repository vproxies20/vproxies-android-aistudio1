type Reply = { id: string; ok: boolean; data?: unknown; error?: string };
declare global {
  interface Window {
    VProxiesNative?: { request(id: string, method: string, payload: string): void; savedCredentials(): string };
    __vproxiesReply?: (reply: Reply) => void;
  }
}
let nextId = 0;
const pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
window.__vproxiesReply = (reply) => {
  const request = pending.get(reply.id);
  if (!request) return;
  pending.delete(reply.id);
  clearTimeout(request.timer);
  if (reply.ok) request.resolve(reply.data);
  else request.reject(new Error(reply.error || 'Android operation failed.'));
};
export const isNative = () => Boolean(window.VProxiesNative);
export function nativeCall<T = any>(method: string, payload: unknown = {}): Promise<T> {
  if (!window.VProxiesNative) return Promise.reject(new Error('Open the Android APK to use this feature. Web preview cannot create a VPN.'));
  return new Promise<T>((resolve, reject) => {
    const id = String(++nextId);
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Android operation timed out.')); }, 90000);
    pending.set(id, { resolve, reject, timer });
    try { window.VProxiesNative!.request(id, method, JSON.stringify(payload)); }
    catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
  });
}
