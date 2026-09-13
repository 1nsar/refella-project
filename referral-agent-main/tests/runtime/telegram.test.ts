import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ claimInvite: vi.fn(), createRequest: vi.fn() }));
vi.mock('../../runtime/node_modules/eve/dist/src/public/channels/telegram/index.js', () => ({ telegramChannel: (config: unknown) => config }));
vi.mock('../../runtime/node_modules/eve/dist/src/public/tools/index.js', () => ({ defineTool: (config: unknown) => config }));
vi.mock('../../runtime/node_modules/eve/dist/src/public/tools/approval/index.js', () => ({ always: () => 'ALWAYS_APPROVE' }));
vi.mock('../../runtime/agent/lib/service', async importOriginal => {
  const original = await importOriginal<typeof import('../../runtime/agent/lib/service')>();
  return { ...original, service: () => calls };
});
import telegramDefinition from '../../runtime/agent/channels/telegram';
import submitDefinition from '../../runtime/agent/tools/submit_request';
import { customerContext } from '../../runtime/agent/lib/service';

// Definitions are captured before the framework boots: no network or live Telegram.
const telegram = telegramDefinition as unknown as {
  onMessage: (ctx: any, message: any) => Promise<any>;
  events: { 'input.requested': (event: any, channel: any) => Promise<void> };
};
const submit = submitDefinition as unknown as { approval: unknown; execute: (input: any, context: any) => Promise<any> };
const businessId = '11111111-1111-4111-8111-111111111111';
const auth = { authenticator: 'referral-telegram', principalId: 'synthetic-user', attributes: { businessId } };
const message = { chat: { type: 'private' }, from: { id: 'synthetic-user', firstName: 'Test', isBot: false }, text: 'Hello' };
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('TELEGRAM_BUSINESS_ID', businessId);
  calls.claimInvite.mockResolvedValue({ status: 'claimed' });
  calls.createRequest.mockResolvedValue({ status: 'requested' });
});
afterEach(() => vi.unstubAllEnvs());

describe('runtime trusted customer identity', () => {
  it('uses authenticated channel identity', () => {
    expect(customerContext(auth)).toEqual({ businessId, channel: 'telegram', externalId: 'synthetic-user' });
  });
  it.each([null, {}, { ...auth, authenticator: 'eve' }, { ...auth, principalId: undefined }, { ...auth, attributes: {} }])('rejects untrusted identity %#', value => {
    expect(() => customerContext(value)).toThrow('forbidden');
  });
});

describe('Telegram message hook', () => {
  it.each([
    { ...message, chat: { type: 'group' } },
    { ...message, from: undefined },
    { ...message, from: { ...message.from, isBot: true } },
    { ...message, text: '' },
    { ...message, text: 'x'.repeat(4001) },
  ])('ignores unsupported message %#', async input => {
    expect(await telegram.onMessage({ telegram: { post: vi.fn() } }, input)).toBeNull();
    expect(calls.claimInvite).not.toHaveBeenCalled();
  });
  it('derives auth from native sender, never text-supplied tenant', async () => {
    const result = await telegram.onMessage({}, { ...message, text: 'businessId=other; externalId=someone-else' });
    expect(result.auth).toEqual({ ...auth, principalType: 'user' });
  });
  it('claims a valid invitation before handing the conversation to the model', async () => {
    const token = 'a'.repeat(48);
    const result = await telegram.onMessage({}, { ...message, text: `/start ${token}` });
    expect(calls.claimInvite).toHaveBeenCalledWith({ businessId, channel: 'telegram', externalId: 'synthetic-user', displayName: 'Test' }, { token });
    expect(result.context[0]).toContain('Referral invitation applied by backend.');
  });
  it('does not claim a malformed invite', async () => {
    await telegram.onMessage({}, { ...message, text: '/start not-a-valid-token' });
    expect(calls.claimInvite).not.toHaveBeenCalled();
  });
  it('stops processing and sanitizes a failed claim', async () => {
    calls.claimInvite.mockRejectedValue(new Error('secret SQL detail'));
    const post = vi.fn();
    expect(await telegram.onMessage({ telegram: { post } }, { ...message, text: `/start ${'b'.repeat(48)}` })).toBeNull();
    expect(post.mock.calls[0][0]).toContain('internal_error');
    expect(post.mock.calls[0][0]).not.toContain('secret SQL');
  });
  it('keeps channel authentication on a plain-text approval reply', async () => {
    const result = await telegram.onMessage({}, { ...message, text: 'approve' });
    expect(result.auth).toEqual({ ...auth, principalType: 'user' });
  });
});

describe('request approval definition and display', () => {
  it('requires approval and displays a request, not a booked slot', async () => {
    expect(submit.approval).toBe('ALWAYS_APPROVE');
    const post = vi.fn();
    await telegram.events['input.requested']({ requests: [{ action: { toolName: 'submit_request', input: { service: 'Haircut', preferredTime: '2026-09-13T12:00:00Z' } }, prompt: 'Confirm' }] }, { telegram: { post } });
    expect(post.mock.calls[0][0]).toContain('This is a request, not a confirmed booking.');
    expect(post.mock.calls[0][0]).toContain('approve');
    expect(post.mock.calls[0][0]).toContain('cancel');
    expect(calls.createRequest).not.toHaveBeenCalled();
  });
  it('uses trusted session identity and stable request idempotency for execution', async () => {
    const input = { service: 'Haircut', preferredTime: '2026-09-13T12:00:00Z' };
    const ctx = { session: { id: 'session-1', auth: { current: auth } }, callId: 'call-1' };
    await submit.execute(input, ctx); await submit.execute(input, ctx);
    expect(calls.createRequest.mock.calls[0]).toEqual(calls.createRequest.mock.calls[1]);
    expect(calls.createRequest.mock.calls[0][0]).toEqual({ businessId, channel: 'telegram', externalId: 'synthetic-user' });
    expect(calls.createRequest.mock.calls[0][1].requestKey).toMatch(/^agent-[a-f0-9]{64}$/);
  });
});
