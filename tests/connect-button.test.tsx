import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

// Mount the real App, button components and JS/Android transport. Only the
// Android endpoint is substituted; these tests do not claim to run a VPN.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://appassets.androidplatform.net' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true });
const { App } = await import('../src/App');
const realTimeout = globalThis.setTimeout;
let poll: (() => void) | undefined;
globalThis.setTimeout = ((callback: () => void, delay?: number, ...args: any[]) => {
  if (delay === 1000) { poll = callback; return 0 as any; }
  return realTimeout(callback, delay, ...args);
}) as typeof setTimeout;

async function mount() {
  localStorage.clear();
  const calls: Array<{ id: string; method: string; payload: any }> = [];
  const snapshot: any = { status: 'DISCONNECTED', message: 'Ready', error: '', logs: [],
    account: { identity: 'test-user', active: true, remainingDays: 7, packageName: 'Test' },
    alwaysOn: false, connectedAt: 0, uploadRate: 0, downloadRate: 0 };
  const proxy = { id: '1', gatewayId: 'g1', name: 'Authorized test proxy', protocol: 'SOCKS5',
    host: '192.0.2.1', port: 1080, country: 'US', city: 'Test' };
  const reply = (id: string, data: any, error?: string) =>
    (window as any).__vproxiesReply({ id, ok: !error, data, error });
  (window as any).VProxiesNative = { savedCredentials: () => 'null', request(id: string, method: string, payload: string) {
    calls.push({ id, method, payload: JSON.parse(payload) });
    if (method === 'connect') return;
    const data = method === 'snapshot' ? structuredClone(snapshot) : method === 'sync' ? { proxies: [proxy] }
      : method === 'apps' ? [] : method === 'ip' ? { ip: '192.0.2.2', country: 'Unknown', countryCode: '', city: '', isp: '', isProtected: snapshot.status === 'CONNECTED' } : {};
    queueMicrotask(() => reply(id, data));
  } };
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(<App />); });
  return { calls, snapshot, host,
    click: async (id: string) => { await act(async () => { host.querySelector<HTMLButtonElement>('#' + id)!.click(); }); },
    accept: async (message = 'Starting VPN…') => { await act(async () => { reply(calls.find(c => c.method === 'connect')!.id, { message }); }); },
    tick: async () => { const next = poll; poll = undefined; await act(async () => { next?.(); }); },
    close: async () => { await act(async () => { root.unmount(); }); host.remove(); },
  };
}

for (const button of ['power_dial_button', 'action_connect_button']) {
  test(`${button}: one click sends one connect and never auto-disconnects`, async () => {
    const app = await mount();
    try {
      await app.click(button);
      assert.equal(app.calls.filter(c => c.method === 'connect').length, 1);
      await app.accept();
      app.snapshot.status = 'CONNECTING'; app.snapshot.message = 'Starting VPN…'; await app.tick();
      assert.match(app.host.querySelector('#power_dial_button')!.textContent!, /CONNECTING/);
      app.snapshot.status = 'CONNECTED'; app.snapshot.message = 'VPN connected.'; await app.tick();
      assert.match(app.host.querySelector('#action_connect_button')!.textContent!, /DISCONNECT PROXY/);
      assert.equal(app.calls.filter(c => c.method === 'disconnect').length, 0);
    } finally { await app.close(); }
  });
}

test('a second tap while the request is pending does not send duplicate commands', async () => {
  const app = await mount();
  try {
    await app.click('power_dial_button'); await app.click('action_connect_button');
    assert.equal(app.calls.filter(c => c.method === 'connect').length, 1);
    assert.equal(app.calls.filter(c => c.method === 'disconnect').length, 0);
    await app.accept();
  } finally { await app.close(); }
});

test('clicking the SVG icon inside the dial dispatches exactly one Connect', async () => {
  const app = await mount();
  try {
    await act(async () => {
      app.host.querySelector('#power_dial_button svg')!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    assert.equal(app.calls.filter(c => c.method === 'connect').length, 1);
    assert.equal(app.calls.filter(c => c.method === 'disconnect').length, 0);
    await app.accept();
  } finally { await app.close(); }
});

test('a repeated Connect tap after Android accepts startup must not cancel the VPN', async () => {
  const app = await mount();
  try {
    await app.click('power_dial_button');
    await app.accept();
    app.snapshot.status = 'CONNECTING'; await app.tick();
    await app.click('power_dial_button');
    await app.click('action_connect_button');
    assert.equal(app.calls.filter(c => c.method === 'connect').length, 1);
    assert.equal(app.calls.filter(c => c.method === 'disconnect').length, 0);
  } finally { await app.close(); }
});

test('only the explicit Cancel action cancels a pending VPN startup', async () => {
  const app = await mount();
  try {
    await app.click('power_dial_button'); await app.accept();
    app.snapshot.status = 'CONNECTING'; await app.tick();
    await app.click('cancel_connection_button');
    assert.equal(app.calls.filter(c => c.method === 'disconnect').length, 1);
  } finally { await app.close(); }
});

test('a service that stops between polls must not leave the UI stuck Connecting', async () => {
  const app = await mount();
  try {
    await app.click('power_dial_button'); await app.accept();
    app.snapshot.status = 'DISCONNECTED'; app.snapshot.message = 'VPN disconnected.';
    await app.tick();
    assert.match(app.host.querySelector('#power_dial_button')!.textContent!, /DISCONNECTED/);
  } finally { await app.close(); }
});

test('replays Connecting -> Disconnected from Android without any button stop command', async () => {
  const app = await mount();
  try {
    await app.click('action_connect_button');
    app.snapshot.status = 'CONNECTING'; app.snapshot.message = 'Requesting connection details…'; await app.tick();
    await app.accept();
    app.snapshot.status = 'DISCONNECTED'; app.snapshot.message = 'Starting VPN…'; await app.tick();
    assert.match(app.host.querySelector('#power_dial_button')!.textContent!, /DISCONNECTED/);
    assert.equal(app.calls.filter(c => c.method === 'disconnect').length, 0);
  } finally { await app.close(); }
});

test('an Android startup error is shown on screen and retained after Stopped', async () => {
  const app = await mount();
  try {
    await app.click('action_connect_button'); await app.accept();
    app.snapshot.status = 'ERROR'; app.snapshot.error = 'VPN error: create TUN failed'; await app.tick();
    app.snapshot.status = 'DISCONNECTED'; await app.tick();
    assert.match(app.host.querySelector('[role="status"]')!.textContent!, /create TUN failed/);
    assert.equal(app.calls.filter(c => c.method === 'disconnect').length, 0);
  } finally { await app.close(); }
});
