import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtemp, readFile, readdir, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOnboardingHandler } from '../../src/onboarding/core';
import { saveDraft } from '../../src/onboarding/storage';
const env = { DEMO_ENABLED: 'true', DEMO_ACCESS_CODE: 'synthetic-code-123456', ONBOARDING_ORIGIN: 'https://refella.app', OPENROUTER_API_KEY: 'synthetic-no-network' };
const proposal = { businessName: 'Studio Demo', businessType: 'Barbershop', channel: 'telegram' as const, integrationMode: 'our-agent' as const, offer: '100 noncash points after a paid referral visit.' };
const request = (path: string, body?: unknown, token?: string, origin = 'https://refella.app') => new Request('https://api.example.test/api/onboarding/' + path, {
  method: body === undefined ? 'GET' : 'POST', headers: { origin, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
async function start(handler: (r: Request) => Promise<Response>) { return (await handler(request('start', { code: env.DEMO_ACCESS_CODE, consent: true }))).json(); }
afterEach(() => vi.useRealTimers());
describe('private onboarding boundary', () => {
  it('requires configured gate and correct access code', async () => {
    const run = vi.fn();
    expect((await createOnboardingHandler(run, {})(request('start', { code: 'x' }))).status).toBe(503);
    expect((await createOnboardingHandler(run, env)(request('start', { code: 'x', consent: true }))).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });
  it.each([undefined, false, 'true'])('requires explicit true visitor consent %s', async consent => {
    const run = vi.fn(); const handler = createOnboardingHandler(run, env);
    const response = await handler(request('start', { code: env.DEMO_ACCESS_CODE, ...(consent === undefined ? {} : { consent }) }));
    expect(response.status).toBe(400); expect(run).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ error: 'invalid_input' });
  });
  it('allows exact-origin preflight without credentials, rejects other origin', async () => {
    const handler = createOnboardingHandler(vi.fn(), env);
    const res = await handler(new Request('https://api.example.test/api/onboarding/messages', { method: 'OPTIONS', headers: { origin: 'https://refella.app', 'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization, content-type' } }));
    expect(res.status).toBe(204); expect(res.headers.get('access-control-allow-origin')).toBe('https://refella.app');
    expect(res.headers.get('access-control-allow-credentials')).toBeNull();
    const denied = await handler(request('start', { code: env.DEMO_ACCESS_CODE }, undefined, 'https://refella.app.evil.test'));
    expect(denied.status).toBe(403); expect(denied.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('restores only matching bearer session and expires after restart', async () => {
    const handler = createOnboardingHandler(vi.fn(), env); const state = await start(handler);
    expect(state.token).toMatch(/^[a-f0-9]{64}$/);
    expect((await handler(request('session', undefined, state.token))).status).toBe(200);
    expect((await handler(request('session', undefined, 'a'.repeat(64)))).status).toBe(401);
    expect((await createOnboardingHandler(vi.fn(), env)(request('session', undefined, state.token))).status).toBe(401);
  });
  it('rejects tenant injection and oversized text before calling model', async () => {
    const run = vi.fn(); const handler = createOnboardingHandler(run, env); const { token } = await start(handler);
    expect((await handler(request('messages', { message: 'hello', businessId: 'other' }, token))).status).toBe(400);
    expect((await handler(request('messages', { message: 'x'.repeat(801) }, token))).status).toBe(400);
    expect((await handler(request('messages', { message: 'x'.repeat(17000) }, token))).status).toBe(413);
    expect(run).not.toHaveBeenCalled();
  });
  it('saves only on explicit current confirmation and is idempotent', async () => {
    const persist = vi.fn().mockResolvedValue({ ...proposal, id: 'saved-id', status: 'draft' });
    const handler = createOnboardingHandler(vi.fn().mockResolvedValue({ text: 'live now', proposal }), env, Date.now, persist);
    const { token } = await start(handler);
    const preview = await (await handler(request('messages', { message: 'Describe setup' }, token))).json();
    expect(persist).not.toHaveBeenCalled(); expect(preview.messages.at(-1).content).not.toContain('live now');
    expect((await handler(request('confirm', { proposalId: '00000000-0000-4000-8000-000000000000' }, token))).status).toBe(409);
    const first = await (await handler(request('confirm', { proposalId: preview.proposal.proposalId }, token))).json();
    const second = await (await handler(request('confirm', { proposalId: preview.proposal.proposalId }, token))).json();
    expect(first.draft.id).toBe(second.draft.id); expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith(proposal, undefined);
  });
  it('never reports saved after persistence failure', async () => {
    const handler = createOnboardingHandler(vi.fn().mockResolvedValue({ text: 'preview', proposal }), env, Date.now, vi.fn().mockRejectedValue(new Error('disk secret')));
    const { token } = await start(handler);
    const state = await (await handler(request('messages', { message: 'test' }, token))).json();
    const response = await handler(request('confirm', { proposalId: state.proposal.proposalId }, token));
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: 'draft_save_failed' });
    const current = await (await handler(request('session', undefined, token))).json(); expect(current.draft).toBeNull();
  });
  it('blocks concurrent turns and invalidates stale previews', async () => {
    let resolve: (result: {text:string}) => void = () => {};
    const run = vi.fn().mockResolvedValueOnce({ text: 'preview', proposal }).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const handler = createOnboardingHandler(run, env); const { token } = await start(handler);
    const first = await (await handler(request('messages', { message: 'test' }, token))).json();
    const pending = handler(request('messages', { message: 'change it' }, token));
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    expect((await handler(request('confirm', { proposalId: first.proposal.proposalId }, token))).status).toBe(409);
    resolve({ text: 'What should change?' }); await pending;
    expect((await handler(request('confirm', { proposalId: first.proposal.proposalId }, token))).status).toBe(409);
  });
  it('enforces session/start/global quotas', async () => {
    const run = vi.fn().mockResolvedValue({ text: 'question' }); const handler = createOnboardingHandler(run, env);
    for (let session = 0; session < 5; session++) {
      const { token } = await start(handler);
      for (let turn = 0; turn < 12; turn++) expect((await handler(request('messages', { message: 'test' }, token))).status).toBe(200);
      expect((await handler(request('messages', { message: 'overflow' }, token))).status).toBe(429);
    }
    expect(run).toHaveBeenCalledTimes(60);
    expect((await handler(request('start', { code: env.DEMO_ACCESS_CODE, consent: true }))).status).toBe(429);
    const handler2 = createOnboardingHandler(run, env);
    for (let i = 0; i < 20; i++) await start(handler2);
    expect((await handler2(request('start', { code: env.DEMO_ACCESS_CODE, consent: true }))).status).toBe(429);
  });
  it('aborts hung model after 25 seconds', async () => {
    vi.useFakeTimers(); let signal: AbortSignal | undefined;
    const handler = createOnboardingHandler(input => { signal = input.signal; return new Promise(() => {}); }, env);
    const { token } = await start(handler); const response = handler(request('messages', { message: 'test' }, token));
    await vi.advanceTimersByTimeAsync(25001);
    expect((await response).status).toBe(503); expect(signal?.aborted).toBe(true);
  });
});
describe('real draft filesystem persistence', () => {
  it('persists only draft fields using restrictive permissions', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'onboarding-test-'));
    try {
      const saved = await saveDraft(proposal, dir);
      expect(saved.id).toMatch(/^[a-f0-9-]{36}$/);
      expect(await readdir(dir)).toEqual([`${saved.id}.json`]);
      expect(JSON.parse(await readFile(join(dir, `${saved.id}.json`), 'utf8'))).toEqual(saved);
      expect((await stat(dir)).mode & 0o777).toBe(0o700);
      expect((await stat(join(dir, `${saved.id}.json`))).mode & 0o777).toBe(0o600);
    } finally { await rm(dir, { recursive: true }); }
  });
});
