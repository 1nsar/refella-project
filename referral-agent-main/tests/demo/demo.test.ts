import { describe, expect, it, vi } from 'vitest';
import { createDemoHandler, type DemoResult, type DemoRunner } from '../../src/demo/core';

const origin = 'https://judge.example.test';
const code = 'synthetic-access-code-123';
const initialTime = Date.parse('2030-01-01T00:00:00Z');
const proposal = { service: 'Haircut' as const, preferredTime: '2030-01-02T10:00:00Z' };
const environment = { DEMO_ENABLED: 'true', DEMO_ACCESS_CODE: code, DEMO_ORIGIN: origin, OPENROUTER_API_KEY: 'synthetic-not-a-real-key' };

function setup(runner: DemoRunner = async () => ({ text: 'Synthetic reply' }), overrides: Partial<typeof environment> = {}) {
  let time = initialTime;
  const run = vi.fn(runner);
  const handler = createDemoHandler(run, { ...environment, ...overrides }, () => time);
  async function call(path: string, body?: unknown, cookie?: string, requestOrigin: string | null = origin) {
    const headers = new Headers();
    if (cookie) headers.set('cookie', cookie);
    if (requestOrigin) headers.set('origin', requestOrigin);
    if (body !== undefined) headers.set('content-type', 'application/json');
    return handler(new Request(`${origin}/api/demo/${path}`, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  }
  async function start() {
    const response = await call('start', { code });
    expect(response.status).toBe(200);
    return response.headers.get('set-cookie')!.split(';')[0];
  }
  return { run, handler, call, start, advance: (ms: number) => { time += ms; } };
}

describe('isolated judging demo', () => {
  it('fails closed when disabled, code/config missing or model missing', async () => {
    for (const overrides of [{ DEMO_ENABLED: 'false' }, { DEMO_ACCESS_CODE: '' }, { DEMO_ACCESS_CODE: 'short' }, { DEMO_ORIGIN: '' }, { OPENROUTER_API_KEY: '' }]) {
      const s = setup(undefined, overrides);
      expect((await s.call('start', { code })).status).toBe(503);
      expect(s.run).not.toHaveBeenCalled();
    }
  });

  it('rejects bad access code and missing or foreign POST origins', async () => {
    const s = setup();
    expect((await s.call('start', { code: 'wrong' })).status).toBe(401);
    expect((await s.call('start', { code }, undefined, null)).status).toBe(403);
    expect((await s.call('start', { code }, undefined, 'https://attacker.test')).status).toBe(403);
    expect(s.run).not.toHaveBeenCalled();
  });

  it('issues an opaque secure HttpOnly scoped cookie and never returns credentials', async () => {
    const s = setup();
    const response = await s.call('start', { code });
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^referral_demo=[a-f0-9]{64};/);
    for (const flag of ['Path=/api/demo', 'HttpOnly', 'SameSite=Strict', 'Max-Age=1200', 'Secure']) expect(cookie).toContain(flag);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.text();
    expect(body).not.toContain(code);
    expect(body).not.toContain(environment.OPENROUTER_API_KEY);
    expect(body).not.toContain(cookie.split(';')[0].split('=')[1]);
  });

  it('isolates cookies and expires state after twenty minutes', async () => {
    const s = setup(async () => ({ text: 'One session only', proposal }));
    const a = await s.start(), b = await s.start();
    expect(a).not.toBe(b);
    await s.call('message', { message: 'Please prepare it' }, a);
    expect((await (await s.call('state', undefined, a)).json()).state.proposal).toEqual(proposal);
    expect((await (await s.call('state', undefined, b)).json()).state.proposal).toBeNull();
    expect((await s.call('state')).status).toBe(401);
    expect((await s.call('state', undefined, `referral_demo=${'0'.repeat(64)}`)).status).toBe(401);
    s.advance(20 * 60_000);
    expect((await s.call('state', undefined, a)).status).toBe(401);
    expect((await s.call('message', { message: 'Expired' }, b)).status).toBe(401);
  });

  it('rejects tenant/state injection and oversized or malformed input without model calls', async () => {
    const s = setup();
    expect((await s.call('start', { code, businessId: 'foreign' })).status).toBe(400);
    const cookie = await s.start();
    for (const body of [{ message: 'Hi', businessId: 'foreign' }, { message: 'Hi', rewardUnits: 999 }, { message: 'Hi', state: {} }, { message: '' }, { message: 'x'.repeat(801) }]) {
      expect((await s.call('message', body, cookie)).status).toBe(400);
    }
    expect((await s.call('message', { message: 'x'.repeat(17_000) }, cookie)).status).toBe(413);
    const bad = await s.handler(new Request(`${origin}/api/demo/message`, { method: 'POST', headers: { origin, cookie, 'content-type': 'application/json' }, body: '{' }));
    expect(bad.status).toBe(400);
    expect((await s.call('confirm', { rewardUnits: 999 }, cookie)).status).toBe(400);
    expect((await s.call('purchase', { amountMinor: 999 }, cookie)).status).toBe(400);
    expect(s.run).not.toHaveBeenCalled();
  });

  it('limits each session to twelve provider turns', async () => {
    const s = setup(), cookie = await s.start();
    for (let i = 0; i < 12; i++) expect((await s.call('message', { message: `Question ${i}` }, cookie)).status).toBe(200);
    const response = await s.call('message', { message: 'Thirteenth' }, cookie);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'demo_limit' });
    expect(s.run).toHaveBeenCalledTimes(12);
  });

  it('limits all sessions together to sixty provider turns', async () => {
    const s = setup();
    const spare = await s.start();
    for (let session = 0; session < 5; session++) {
      const cookie = await s.start();
      for (let turn = 0; turn < 12; turn++) expect((await s.call('message', { message: 'Hi' }, cookie)).status).toBe(200);
    }
    expect((await s.call('message', { message: 'Hi' }, spare)).status).toBe(429);
    expect((await s.call('start', { code })).status).toBe(429);
    expect(s.run).toHaveBeenCalledTimes(60);
  });

  it('caps successful starts at twenty and failed code attempts at thirty per minute', async () => {
    const s = setup();
    for (let i = 0; i < 20; i++) await s.start();
    expect(await (await s.call('start', { code })).json()).toEqual({ error: 'demo_capacity' });
    const other = setup();
    for (let i = 0; i < 30; i++) expect((await other.call('start', { code: 'wrong' })).status).toBe(401);
    expect((await other.call('start', { code })).status).toBe(429);
    other.advance(60_000);
    expect((await other.call('start', { code })).status).toBe(200);
  });

  it('locks before provider execution and releases after success', async () => {
    let resolve!: (value: DemoResult) => void;
    let entered!: () => void;
    const entry = new Promise<void>(r => { entered = r; });
    const s = setup(async () => { entered(); return new Promise<DemoResult>(r => { resolve = r; }); });
    const cookie = await s.start();
    const pending = s.call('message', { message: 'Hi' }, cookie);
    await entry;
    expect((await s.call('message', { message: 'Overlap' }, cookie)).status).toBe(409);
    expect((await s.call('confirm', {}, cookie)).status).toBe(409);
    expect((await s.call('purchase', {}, cookie)).status).toBe(409);
    resolve({ text: 'Done' });
    expect((await pending).status).toBe(200);
    expect((await s.call('confirm', {}, cookie)).status).toBe(409); // proposal_required, not busy
    expect(await (await s.call('confirm', {}, cookie)).json()).toEqual({ error: 'proposal_required' });
    expect(s.run).toHaveBeenCalledTimes(1);
  });

  it('charges failed provider calls against quota and sanitizes errors', async () => {
    const s = setup(async () => { throw new Error('private provider detail synthetic-secret'); });
    const cookie = await s.start();
    for (let i = 0; i < 12; i++) {
      const response = await s.call('message', { message: 'Try' }, cookie);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'model_unavailable' });
    }
    expect((await s.call('message', { message: 'No retry budget' }, cookie)).status).toBe(429);
    expect(s.run).toHaveBeenCalledTimes(12);
  });

  it('requires explicit confirmation then awards exactly one hundred synthetic units without model calls', async () => {
    const s = setup(async () => ({ text: 'Review this proposal', proposal }));
    const cookie = await s.start();
    expect(await (await s.call('purchase', {}, cookie)).json()).toEqual({ error: 'request_required' });
    expect(await (await s.call('confirm', {}, cookie)).json()).toEqual({ error: 'proposal_required' });
    const message = await (await s.call('message', { message: 'Prepare request' }, cookie)).json();
    expect(message.state).toEqual({ proposal, request: null, rewardUnits: 0 });
    expect((await s.call('purchase', {}, cookie)).status).toBe(409);
    const confirmed = await (await s.call('confirm', {}, cookie)).json();
    expect(confirmed.state).toEqual({ proposal: null, request: { ...proposal, status: 'requested' }, rewardUnits: 0 });
    expect(await (await s.call('confirm', {}, cookie)).json()).toEqual(confirmed);
    const bought = await (await s.call('purchase', {}, cookie)).json();
    expect(bought.state.rewardUnits).toBe(100);
    expect(bought.state.request.status).toBe('purchased');
    expect(await (await s.call('purchase', {}, cookie)).json()).toEqual(bought);
    expect(s.run).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid or past model proposals and stale confirmation', async () => {
    for (const invalid of [
      { ...proposal, service: 'Unauthorized surgery' },
      { ...proposal, businessId: 'other-tenant' },
      { ...proposal, preferredTime: 'not-a-date' },
      { ...proposal, preferredTime: '2020-01-01T12:00:00Z' },
    ]) {
      const s = setup(async () => ({ text: 'Malicious proposal', proposal: invalid as typeof proposal }));
      const cookie = await s.start();
      expect((await s.call('message', { message: 'Hi' }, cookie)).status).toBe(400);
      expect((await (await s.call('state', undefined, cookie)).json()).state).toEqual({ proposal: null, request: null, rewardUnits: 0 });
    }
    const s = setup(async () => ({ text: 'Review', proposal: { ...proposal, preferredTime: '2030-01-01T00:01:00Z' } }));
    const cookie = await s.start();
    await s.call('message', { message: 'Prepare' }, cookie);
    s.advance(61_000);
    expect(await (await s.call('confirm', {}, cookie)).json()).toEqual({ error: 'future_time_required' });
  });
});
