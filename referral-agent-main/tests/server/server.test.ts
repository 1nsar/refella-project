import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authenticateIntegration, authenticateOwner, createReferralService, safeError } from '../../src/server';
import { purchaseSchema, requestSchema, validate } from '../../src/server/validation';

const businessId = '11111111-1111-4111-8111-111111111111';
const otherBusiness = '22222222-2222-4222-8222-222222222222';
const customerId = '33333333-3333-4333-8333-333333333333';
const identity = { businessId, channel: 'telegram' as const, externalId: 'synthetic-123' };
const asClient = (value: unknown) => value as SupabaseClient;

describe('integration authentication', () => {
  const env = { REFERRAL_API_KEY: 'synthetic-secret-not-a-real-key', REFERRAL_BUSINESS_ID: businessId };
  it('derives tenant solely from configured key context', () => {
    const req = new Request('http://localhost/api?businessId=' + otherBusiness, {
      headers: { authorization: `Bearer ${env.REFERRAL_API_KEY}`, 'x-business-id': otherBusiness },
    });
    expect(authenticateIntegration(req, env)).toEqual({ businessId });
  });
  it.each([undefined, 'Bearer bad', 'Basic xyz', 'Bearer secret with spaces'])('rejects invalid credentials %s', (header) => {
    const request = new Request('http://localhost', { headers: header ? { authorization: header } : {} });
    expect(() => authenticateIntegration(request, env)).toThrow('unauthorized');
  });
  it('fails closed for unconfigured integration', () => {
    expect(() => authenticateIntegration(new Request('http://localhost'), {})).toThrow('integration_unavailable');
  });
});

describe('owner authentication', () => {
  it('rejects invalid Supabase session before querying businesses', async () => {
    const from = vi.fn();
    const client = asClient({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: {} }) }, from });
    await expect(authenticateOwner(client, 'invalid', businessId)).rejects.toThrow('unauthorized');
    expect(from).not.toHaveBeenCalled();
  });
  it('requires the requested business to belong to the verified user', async () => {
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'verified-owner' } }, error: null });
    await expect(authenticateOwner(asClient({ auth: { getUser }, from: () => query }), 'valid', otherBusiness)).rejects.toThrow('forbidden');
    expect(getUser).toHaveBeenCalledWith('valid');
    expect(query.eq.mock.calls).toEqual([['id', otherBusiness], ['owner_id', 'verified-owner']]);
  });
});

describe('boundaries', () => {
  const purchase = { requestId: customerId, externalEventId: 'event-1', amountMinor: 100 };
  it.each([-1, 0, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1, '100'])('rejects invalid money %s', amountMinor => {
    expect(() => validate(purchaseSchema, { ...purchase, amountMinor })).toThrow('invalid_input');
  });
  it('rejects tenant injection and ambiguous timestamps', () => {
    expect(() => validate(purchaseSchema, { ...purchase, businessId })).toThrow('invalid_input');
    expect(() => validate(requestSchema, { service: 'Haircut', preferredTime: 'tomorrow', requestKey: 'request-123' })).toThrow('invalid_input');
  });
  it('sanitizes unexpected errors', () => {
    expect(safeError(new Error('database password=secret'))).toEqual({ status: 500, body: { error: 'internal_error' } });
  });
});

describe('service tenant isolation', () => {
  function mockClient(customerBusiness = businessId) {
    const query = { upsert: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: { id: customerId, business_id: customerBusiness }, error: null }) };
    query.upsert.mockReturnValue(query); query.select.mockReturnValue(query);
    const rpc = vi.fn().mockResolvedValue({ data: { referral_id: 'referral', status: 'claimed', referrer_id: 'private' }, error: null });
    return { query, rpc, client: asClient({ from: () => query, rpc }) };
  }
  it('scopes identity upsert and RPC to trusted tenant and hides referrer identity', async () => {
    const { client, query, rpc } = mockClient();
    const result = await createReferralService(client).claimInvite(identity, { token: 'invite-token-123' });
    expect(query.upsert).toHaveBeenCalledWith({ business_id: businessId, channel: 'telegram', external_id: 'synthetic-123' }, { onConflict: 'business_id,channel,external_id' });
    expect(rpc).toHaveBeenCalledWith('api_claim_invite', { p_business_id: businessId, p_customer_id: customerId, p_token: 'invite-token-123' });
    expect(result).toEqual({ referral_id: 'referral', status: 'claimed' });
  });
  it('fails closed on inconsistent customer tenant', async () => {
    const { client, rpc } = mockClient(otherBusiness);
    await expect(createReferralService(client).createInvite(identity)).rejects.toThrow('storage_unavailable');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects injected identity input before accessing DB', async () => {
    const { client, query } = mockClient();
    await expect(createReferralService(client).claimInvite(identity, { token: 'invite-token-123', customerId })).rejects.toThrow('invalid_input');
    expect(query.upsert).not.toHaveBeenCalled();
  });
  it('only surfaces allowlisted database errors', async () => {
    const { client, rpc } = mockClient();
    rpc.mockResolvedValue({ data: null, error: { message: 'secret internal SQL detail' } });
    await expect(createReferralService(client).createInvite(identity)).rejects.toThrow('storage_unavailable');
    rpc.mockResolvedValue({ data: null, error: { message: 'self_referral' } });
    await expect(createReferralService(client).createInvite(identity)).rejects.toThrow('self_referral');
  });
  it('scopes owner confirmation RPC to the authorized owner context', async () => {
    const { client, rpc } = mockClient();
    await createReferralService(client).confirmPurchase({ businessId, ownerId: 'owner' }, {
      requestId: customerId, externalEventId: 'staff-confirm-1', amountMinor: 2500,
    });
    expect(rpc).toHaveBeenCalledWith('api_confirm_purchase', {
      p_business_id: businessId, p_request_id: customerId, p_external_event_id: 'staff-confirm-1', p_amount_minor: 2500,
    });
  });
  it('reads only the caller reward ledger and excludes other customer identities', async () => {
    const { client } = mockClient();
    const ledger = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
    ledger.select.mockReturnValue(ledger); ledger.eq.mockReturnValue(ledger); ledger.order.mockReturnValue(ledger);
    const customerFrom = client.from;
    client.from = ((table: string) => table === 'reward_ledger' ? ledger : customerFrom(table)) as typeof client.from;
    expect(await createReferralService(client).ownRewards(identity)).toEqual({ rewards: [], limit: 100 });
    expect(ledger.eq.mock.calls).toEqual([['business_id', businessId], ['customer_id', customerId]]);
    expect(ledger.select).toHaveBeenCalledWith('id,reward_units,created_at');
  });
  it('returns the claimed campaign version even after deactivation', async () => {
    const { client } = mockClient();
    const originalFrom = client.from;
    const campaign = { id: 'old-campaign', version: 1, terms: 'Pinned terms', reward_units: 25 };
    const referralQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { campaign_id: 'old-campaign' }, error: null }) };
    const campaignQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: campaign, error: null }) };
    for (const query of [referralQuery, campaignQuery]) { query.select.mockReturnValue(query); query.eq.mockReturnValue(query); }
    client.from = ((table: string) => table === 'referrals' ? referralQuery : table === 'campaigns' ? campaignQuery : originalFrom(table)) as typeof client.from;
    expect(await createReferralService(client).getCustomerOffer(identity)).toEqual(campaign);
    expect(referralQuery.eq.mock.calls).toEqual([['business_id', businessId], ['referred_id', customerId]]);
    expect(campaignQuery.eq.mock.calls).toEqual([['business_id', businessId], ['id', 'old-campaign']]);
  });
});
