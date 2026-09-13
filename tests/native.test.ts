import test from 'node:test';
import assert from 'node:assert/strict';

// Unit-test the bridge transport outside a browser or Android device.
const testWindow: any = {};
(globalThis as any).window = testWindow;
const { nativeCall, isNative } = await import('../src/services/native');

test('web preview cannot silently simulate a successful native operation', async () => {
  delete testWindow.VProxiesNative;
  assert.equal(isNative(), false);
  await assert.rejects(nativeCall('connect'), /Android APK/);
});

test('request preserves payload and accepts only the matching reply', async () => {
  let observed: any;
  testWindow.VProxiesNative = { request(id: string, method: string, payload: string) {
    observed = { id, method, payload: JSON.parse(payload) };
  } };
  const request = nativeCall('connect', { proxy: { id: '123', protocol: 'SOCKS5' } });
  assert.equal(observed.method, 'connect');
  assert.equal(observed.payload.proxy.id, '123');
  testWindow.__vproxiesReply({ id: 'unknown', ok: true, data: 'ignore' });
  testWindow.__vproxiesReply({ id: observed.id, ok: true, data: { accepted: true } });
  assert.deepEqual(await request, { accepted: true });
});

test('native failure is exposed to the caller, not converted into success', async () => {
  testWindow.VProxiesNative = { request(id: string) {
    testWindow.__vproxiesReply({ id, ok: false, error: 'VPN permission was not granted.' });
  } };
  await assert.rejects(nativeCall('connect'), /permission was not granted/);
});

test('failed bridge dispatch clears its timeout', async () => {
  testWindow.VProxiesNative = { request() { throw new Error('Bridge closed'); } };
  await assert.rejects(nativeCall('snapshot'), /Bridge closed/);
});
