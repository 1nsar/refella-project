import { describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createReferralDemo, type State, type RunnerResult } from '../../src/referral-demo/core';
import { fileStore } from '../../src/referral-demo/store';

const env = { DEMO_ENABLED: 'true', DEMO_ACCESS_CODE: 'private-test-code-12345', REFERRAL_LANDING_ORIGIN: 'https://refella.app' };
const proposal = { service: 'Haircut' as const, preferredTime: '2099-01-01T12:00:00+00:00' };
function setup() {
  let saved: State | undefined;
  const store = { load: async () => saved && structuredClone(saved), save: vi.fn(async (s: State) => { saved = structuredClone(s); }) };
  const model = vi.fn(async (): Promise<RunnerResult> => ({ text: 'Review request', proposal }));
  let handler = createReferralDemo(model, store, env);
  const call = async (path: string, body?: unknown, token?: string, origin = 'https://refella.app') => {
    const r = await handler(new Request(`https://api.example/api/referral-demo/${path}`, { method: body === undefined ? 'GET' : 'POST',
      headers: { origin, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }));
    return { status: r.status, data: await r.json(), headers: r.headers };
  };
  const start = async () => (await call('start', { code: env.DEMO_ACCESS_CODE, consent: true, alias: 'Alex' })).data;
  const friend = async (a: any, key = randomUUID()) => (await call('join', { code: a.invitation.code, consent: true, alias: 'Sam', joinKey: key })).data;
  const request = async (f: any) => { const p = (await call('messages', { message: 'Haircut Jan 1 2099 noon UTC' }, f.token)).data;
    return (await call('confirm', { proposalId: p.proposal.id }, f.token)).data; };
  return { call, start, friend, request, model, store, restart: () => { handler = createReferralDemo(model, store, env); } };
}

describe('two-person referral API', () => {
  it('creates link, attributes a real second session, confirms request and awards exactly once', async () => {
    const t = setup(), a = await t.start();
    expect(new URL(a.invitation.url).searchParams.get('ref')).toBe(a.invitation.code);
    expect(a.invitation.url).not.toContain(a.token);
    expect((await t.call(`invitation?ref=${a.invitation.code}`)).data.inviter).toBe('Alex');
    const f = await t.friend(a); expect(f.attribution.inviter).toBe('Alex'); expect(f.token).not.toBe(a.token);
    const req = await t.request(f);
    const pay = () => t.call('simulate-purchase', { requestId: req.request.id, simulate: true }, a.token);
    expect((await pay()).data.rewardPoints).toBe(100);
    expect((await pay()).data.rewardPoints).toBe(100);
    expect((await t.call('session', undefined, f.token)).data.request.status).toBe('simulated_paid');
    expect(t.model).toHaveBeenCalledTimes(1);
    t.restart(); expect((await t.call('session', undefined, a.token)).data.rewardPoints).toBe(100);
  });
  it('requires consent, a valid judge code and exact CORS origin', async () => {
    const t = setup();
    expect((await t.call('start', { code: env.DEMO_ACCESS_CODE, alias: 'Alex' })).status).toBe(400);
    expect((await t.call('start', { code: 'wrong', consent: true, alias: 'Alex' })).status).toBe(401);
    expect((await t.call('start', {}, undefined, 'https://evil.test')).status).toBe(403);
    expect(t.model).not.toHaveBeenCalled();
  });
  it('rejects invalid links and self-claim with the advocate token', async () => {
    const t = setup(), a = await t.start();
    expect((await t.call('invitation?ref=invalid')).status).toBe(410);
    expect((await t.call('join', { code: a.invitation.code, consent: true, alias: 'Self', joinKey: randomUUID() }, a.token)).status).toBe(409);
  });
  it('join retry uses same participant and never silently changes attribution', async () => {
    const t = setup(), a = await t.start(), key = randomUUID();
    const f = await t.friend(a, key), again = await t.friend(a, key);
    expect(again.token).toBe(f.token);
    expect((await t.call('session', undefined, a.token)).data.referrals).toHaveLength(1);
    expect((await t.call('messages', { message: 'hi', inviter: 'someone else' }, f.token)).status).toBe(400);
  });
  it('friend cannot mark purchases and another advocate cannot touch this request', async () => {
    const t = setup(), a = await t.start(), b = await t.start(), f = await t.friend(a), r = await t.request(f);
    const body = { requestId: r.request.id, simulate: true };
    expect((await t.call('simulate-purchase', body, f.token)).status).toBe(403);
    expect((await t.call('simulate-purchase', body, b.token)).status).toBe(404);
    expect((await t.call('session', undefined, b.token)).data.referrals).toEqual([]);
  });
  it('confirmation is explicit, stale previews rejected, retries idempotent', async () => {
    const t = setup(), a = await t.start(), f = await t.friend(a);
    expect((await t.call('confirm', { proposalId: randomUUID() }, f.token)).status).toBe(409);
    const p = (await t.call('messages', { message: 'prepare' }, f.token)).data;
    expect(p.request).toBeNull();
    const q = (await t.call('messages', { message: 'prepare again' }, f.token)).data;
    expect((await t.call('confirm', { proposalId: p.proposal.id }, f.token)).status).toBe(409);
    const body = { proposalId: q.proposal.id };
    const first = (await t.call('confirm', body, f.token)).data;
    expect((await t.call('confirm', body, f.token)).data.request.id).toBe(first.request.id);
  });
  it('caps provider spend including failures and preserves no false success', async () => {
    const t = setup(), a = await t.start(), f = await t.friend(a);
    t.model.mockRejectedValue(new Error('provider-secret-never-returned'));
    for (let n = 0; n < 6; n++) expect((await t.call('messages', { message: 'hi' }, f.token)).data.error).toBe('model_unavailable');
    t.restart();
    expect((await t.call('messages', { message: 'hi' }, f.token)).status).toBe(429);
    expect(t.model).toHaveBeenCalledTimes(6);
  });
  it('save failure does not produce a created participant', async () => {
    const t = setup(); t.store.save.mockRejectedValueOnce(new Error('disk'));
    expect((await t.call('start', { code: env.DEMO_ACCESS_CODE, consent: true, alias: 'Alex' })).data.error).toBe('save_failed');
  });
  it('blocks simultaneous mutations during a provider turn', async () => {
    const t = setup(), a = await t.start(), f = await t.friend(a);
    let resolve!: (r: RunnerResult) => void;
    t.model.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const pending = t.call('messages', { message: 'hi' }, f.token);
    await vi.waitFor(() => expect(t.model).toHaveBeenCalled());
    expect((await t.call('messages', { message: 'again' }, f.token)).status).toBe(409);
    resolve({ text: 'Hi' }); await pending;
  });
  it('persists real state with private file permissions', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'refella-store-')), path = join(directory, 'state.json');
    const store = fileStore(path), state: State = { version: 1, turns: 0, participants: {}, invitations: {}, rewards: {}, events: [] };
    expect(await store.load()).toBeUndefined(); await store.save(state);
    expect(await fileStore(path).load()).toEqual(state);
    expect((await stat(path)).mode & 0o777).toBe(0o600);
  });
});
