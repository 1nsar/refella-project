import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
import { handleApi, authDatabase, database } from '../../src/http/api';

const businessId = '11111111-1111-4111-8111-111111111111';
const otherBusinessId = '22222222-2222-4222-8222-222222222222';
const requestId = '33333333-3333-4333-8333-333333333333';
const customerId = '44444444-4444-4444-8444-444444444444';
const integrationKey = 'synthetic-integration-key';

function post(path: string, body: unknown, token?: string): Request {
  return new Request('http://localhost' + path, { method: 'POST', body: JSON.stringify(body), headers: {
    'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}),
  } });
}
function query(data: unknown) {
  const value = { data, error: null };
  const result = {
    select: vi.fn(), eq: vi.fn(), upsert: vi.fn(), order: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(value), single: vi.fn().mockResolvedValue(value),
    limit: vi.fn().mockResolvedValue(value),
    then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject),
  };
  for (const name of ['select', 'eq', 'upsert', 'order'] as const) result[name].mockReturnValue(result);
  return result;
}
function clientMock() {
  const business = query({ id: businessId, name: 'Synthetic shop' });
  const customer = query({ id: customerId, business_id: businessId });
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'verified-owner' } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: { message: 'secret detail' } }),
    },
    from: vi.fn((table: string) => table === 'businesses' ? business : table === 'customers' ? customer : query([])),
    rpc: vi.fn().mockResolvedValue({ data: { request_id: requestId, status: 'purchased' }, error: null }),
  };
  mocks.createClient.mockReturnValue(client);
  return { client, business, customer };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SUPABASE_URL', 'https://synthetic.invalid');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'synthetic-service-key');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('REFERRAL_API_KEY', integrationKey);
  vi.stubEnv('REFERRAL_BUSINESS_ID', businessId);
});
afterEach(() => vi.unstubAllEnvs());

describe('HTTP authentication and ownership', () => {
  it.each(['/api/dashboard', '/api/confirm', '/api/cancel'])('rejects unauthenticated %s before storage access', async path => {
    const req = path === '/api/dashboard' ? new Request('http://localhost' + path + '?businessId=' + businessId) : post(path, { businessId, requestId });
    const response = await handleApi(req);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('rejects an expired owner JWT and exposes no provider detail', async () => {
    const { client } = clientMock();
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'secret auth detail' } } as never);
    const response = await handleApi(post('/api/confirm', { businessId, requestId, eventId: 'e1', amountMinor: 100 }, 'expired'));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('rejects a different business before confirming a purchase', async () => {
    const { client, business } = clientMock();
    business.maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await handleApi(post('/api/confirm', { businessId: otherBusinessId, requestId, eventId: 'e1', amountMinor: 100 }, 'owner-token'));
    expect(response.status).toBe(403);
    expect(business.eq.mock.calls).toEqual([['id', otherBusinessId], ['owner_id', 'verified-owner']]);
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('rejects invalid login credentials with a generic error', async () => {
    const { client } = clientMock();
    const response = await handleApi(post('/api/login', { email: 'invalid@example.test', password: 'synthetic-password' }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'invalid_login' });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe('HTTP JSON boundary', () => {
  it('rejects a body larger than 16 KiB even without a Content-Length header', async () => {
    const response = await handleApi(post('/api/login', { email: 'large@example.test', password: 'x'.repeat(17000) }));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'body_too_large' });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON', async () => {
    const response = await handleApi(new Request('http://localhost/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_json' });
  });
  it('rejects non-JSON content', async () => {
    const response = await handleApi(new Request('http://localhost/api/login', { method: 'POST', body: 'email=test' }));
    expect(response.status).toBe(415);
  });
  it('rejects missing purchase facts rather than inventing them', async () => {
    const { client } = clientMock();
    const response = await handleApi(post('/api/confirm', { businessId, requestId }, 'owner-token'));
    expect(response.status).toBe(400);
    expect(client.rpc).not.toHaveBeenCalled();
  });
});

describe('trusted integration boundary', () => {
  it.each(['/invite', '/claim', '/request', '/rewards'])('rejects missing integration key %s', async suffix => {
    const response = await handleApi(post('/api/referrals' + suffix, { externalId: 'synthetic-person' }));
    expect(response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('rejects an invalid integration credential', async () => {
    expect((await handleApi(post('/api/referrals/invite', { externalId: 'synthetic-person' }, 'incorrect'))).status).toBe(401);
  });
  it.each(['/invite', '/claim', '/request', '/rewards'])('rejects tenant injection even with valid key %s', async suffix => {
    const { client } = clientMock();
    const response = await handleApi(post('/api/referrals' + suffix, {
      externalId: 'synthetic-person', businessId: otherBusinessId,
      ...(suffix === '/claim' ? { token: 'long-invite-token' } : {}),
      ...(suffix === '/request' ? { service: 'Haircut', preferredTime: '2026-09-13T12:00:00Z', requestKey: 'request-123' } : {}),
    }, integrationKey));
    expect(response.status).toBe(400);
    expect(client.rpc).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
  });
  it('passes the configured tenant and API channel to customer upsert', async () => {
    const { customer, client } = clientMock();
    const response = await handleApi(post('/api/referrals/invite', { externalId: 'synthetic-person' }, integrationKey));
    expect(response.status).toBe(200);
    expect(customer.upsert).toHaveBeenCalledWith({ business_id: businessId, channel: 'api', external_id: 'synthetic-person' }, { onConflict: 'business_id,channel,external_id' });
    expect(client.rpc).toHaveBeenCalledWith('api_create_invite', { p_business_id: businessId, p_customer_id: customerId });
  });
});

describe('owner HTTP action mapping', () => {
  it('maps eventId to the purchase RPC only after verified owner lookup', async () => {
    const { client } = clientMock();
    const response = await handleApi(post('/api/confirm', { businessId, requestId, eventId: 'staff-event-7', amountMinor: 2500 }, 'owner-token'));
    expect(response.status).toBe(200);
    expect(client.auth.getUser).toHaveBeenCalledWith('owner-token');
    expect(client.rpc).toHaveBeenCalledWith('api_confirm_purchase', {
      p_business_id: businessId, p_request_id: requestId, p_external_event_id: 'staff-event-7', p_amount_minor: 2500,
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('maps cancel to the scoped cancellation RPC', async () => {
    const { client } = clientMock();
    client.rpc.mockResolvedValue({ data: { request_id: requestId, status: 'cancelled' }, error: null });
    const response = await handleApi(post('/api/cancel', { businessId, requestId }, 'owner-token'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ request_id: requestId, status: 'cancelled' });
    expect(client.rpc).toHaveBeenCalledWith('api_cancel_request', { p_business_id: businessId, p_request_id: requestId });
  });
});

describe('publishable auth configuration', () => {
  it.each(['SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])('supports login with %s and no server secret', async keyName => {
    const { client, business } = clientMock();
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    vi.stubEnv(keyName, 'synthetic-publishable');
    client.auth.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'synthetic-session' }, user: { id: 'verified-owner' } }, error: null } as never);
    const response = await handleApi(post('/api/login', { email: `${keyName.toLowerCase()}@example.test`, password: 'synthetic-password' }));
    expect(response.status).toBe(200);
    expect(mocks.createClient).toHaveBeenCalledExactlyOnceWith('https://synthetic.invalid', 'synthetic-publishable', { auth: { persistSession: false, autoRefreshToken: false } });
    expect(business.eq).toHaveBeenCalledWith('owner_id', 'verified-owner');
    expect(JSON.stringify(await response.json())).not.toContain('synthetic-publishable');
  });
  it('uses NEXT_PUBLIC_SUPABASE_URL alias for auth and server clients', () => {
    clientMock();
    vi.stubEnv('SUPABASE_URL', ''); vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://alias.invalid');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'synthetic-publishable');
    authDatabase(); database();
    expect(mocks.createClient.mock.calls.map(call => call.slice(0, 2))).toEqual([
      ['https://alias.invalid', 'synthetic-publishable'], ['https://alias.invalid', 'synthetic-service-key'],
    ]);
  });
  it.each(['/api/confirm', '/api/cancel', '/api/referrals/invite'])('fails closed on %s without service secret', async path => {
    const { client } = clientMock();
    vi.stubEnv('SUPABASE_SECRET_KEY', ''); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'synthetic-publishable');
    const integration = path.includes('referrals');
    const response = await handleApi(post(path, integration ? { externalId: 'synthetic-user' } : { businessId, requestId, eventId: 'test', amountMinor: 100 }, integration ? integrationKey : 'owner-token'));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'storage_not_configured' });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('fails closed on dashboard without service secret', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', ''); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'synthetic-publishable');
    const response = await handleApi(new Request(`http://localhost/api/dashboard?businessId=${businessId}`, { headers: { authorization: 'Bearer owner-token' } }));
    expect(response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
