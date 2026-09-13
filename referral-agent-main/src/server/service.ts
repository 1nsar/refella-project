import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerContext } from './auth';
import { ServiceError } from './errors';
import { claimSchema, idSchema, identitySchema, purchaseSchema, requestSchema, validate, type TrustedCustomerContext } from './validation';

const rpcErrors: Record<string, number> = {
  no_active_campaign: 409, customer_not_found: 404, invite_not_found: 404,
  self_referral: 409, already_attributed: 409, campaign_inactive: 409,
  existing_customer_purchase: 409, idempotency_conflict: 409,
  request_not_found: 404, already_purchased: 409, invalid_purchase: 400,
  business_not_found: 404, request_cancelled: 409,
};

// Only server adapters create trusted contexts. Never copy identity from model arguments.
export function createReferralService(client: SupabaseClient) {
  async function rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await client.rpc(name, args);
    if (error) {
      const status = rpcErrors[error.message];
      throw new ServiceError(status ?? 503, status ? error.message : 'storage_unavailable');
    }
    return data;
  }

  async function upsertCustomer(context: TrustedCustomerContext) {
    const identity = validate(identitySchema, context);
    const values = { business_id: identity.businessId, channel: identity.channel,
      external_id: identity.externalId, ...(identity.displayName ? { display_name: identity.displayName } : {}) };
    const { data, error } = await client.from('customers')
      .upsert(values, { onConflict: 'business_id,channel,external_id' })
      .select('id,business_id,channel,external_id,display_name').single();
    if (error || !data || data.business_id !== identity.businessId) throw new ServiceError(503, 'storage_unavailable');
    return data as { id: string; business_id: string; channel: string; external_id: string; display_name: string | null };
  }

  async function getOffer(businessId: string) {
    const tenant = validate(idSchema, businessId);
    const { data, error } = await client.from('campaigns')
      .select('id,version,name,reward_units,min_purchase_minor,terms')
      .eq('business_id', tenant).eq('active', true).maybeSingle();
    if (error) throw new ServiceError(503, 'storage_unavailable');
    if (!data) throw new ServiceError(404, 'no_active_campaign');
    return data;
  }

  async function createInvite(context: TrustedCustomerContext) {
    const customer = await upsertCustomer(context);
    return rpc('api_create_invite', { p_business_id: customer.business_id, p_customer_id: customer.id });
  }

  async function getCustomerOffer(context: TrustedCustomerContext) {
    const customer = await upsertCustomer(context);
    const { data: referral, error: referralError } = await client.from('referrals')
      .select('campaign_id').eq('business_id', customer.business_id).eq('referred_id', customer.id).maybeSingle();
    if (referralError) throw new ServiceError(503, 'storage_unavailable');
    if (!referral) return getOffer(customer.business_id);
    const { data, error } = await client.from('campaigns')
      .select('id,version,name,reward_units,min_purchase_minor,terms')
      .eq('business_id', customer.business_id).eq('id', referral.campaign_id).maybeSingle();
    if (error || !data) throw new ServiceError(503, 'storage_unavailable');
    return data;
  }

  async function claimInvite(context: TrustedCustomerContext, input: unknown) {
    const { token } = validate(claimSchema, input);
    const customer = await upsertCustomer(context);
    const result = await rpc('api_claim_invite', { p_business_id: customer.business_id, p_customer_id: customer.id, p_token: token });
    // Do not expose another customer's identifier to the guest or model.
    return { referral_id: result.referral_id, status: result.status };
  }

  async function createRequest(context: TrustedCustomerContext, input: unknown) {
    const value = validate(requestSchema, input);
    const customer = await upsertCustomer(context);
    return rpc('api_create_request', { p_business_id: customer.business_id, p_customer_id: customer.id,
      p_service: value.service, p_preferred_time: value.preferredTime, p_request_key: value.requestKey });
  }

  async function ownRewards(context: TrustedCustomerContext) {
    const customer = await upsertCustomer(context);
    const { data, error } = await client.from('reward_ledger')
      .select('id,reward_units,created_at').eq('business_id', customer.business_id)
      .eq('customer_id', customer.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw new ServiceError(503, 'storage_unavailable');
    return { rewards: data ?? [], limit: 100 };
  }

  async function dashboard(owner: OwnerContext) {
    const tenant = validate(idSchema, owner.businessId);
    const [requests, rewards, campaign, business, conversions] = await Promise.all([
      client.from('booking_requests').select('id,customer_id,service,preferred_time,status,created_at')
        .eq('business_id', tenant).order('created_at', { ascending: false }).limit(100),
      client.from('reward_ledger').select('id,customer_id,referred_id,reward_units,created_at')
        .eq('business_id', tenant).order('created_at', { ascending: false }).limit(100),
      client.from('campaigns').select('id,name,version,terms,reward_units,min_purchase_minor')
        .eq('business_id', tenant).eq('active', true).maybeSingle(),
      client.from('businesses').select('id,name').eq('id', tenant).maybeSingle(),
      client.from('conversions').select('id,request_id,customer_id,amount_minor,external_event_id,created_at')
        .eq('business_id', tenant).order('created_at', { ascending: false }).limit(100),
    ]);
    if (requests.error || rewards.error || campaign.error || business.error || conversions.error) throw new ServiceError(503, 'storage_unavailable');
    return { requests: requests.data ?? [], rewards: rewards.data ?? [], campaign: campaign.data,
      business: business.data, conversions: conversions.data ?? [], limit: 100 };
  }

  async function cancelRequest(owner: OwnerContext, requestId: unknown) {
    return rpc('api_cancel_request', { p_business_id: validate(idSchema, owner.businessId), p_request_id: validate(idSchema, requestId) });
  }

  async function confirmPurchase(owner: OwnerContext, input: unknown) {
    const value = validate(purchaseSchema, input);
    return rpc('api_confirm_purchase', { p_business_id: validate(idSchema, owner.businessId),
      p_request_id: value.requestId, p_external_event_id: value.externalEventId, p_amount_minor: value.amountMinor });
  }

  return { upsertCustomer, getOffer, getCustomerOffer, createInvite, claimInvite, createRequest, ownRewards, dashboard, cancelRequest, confirmPurchase };
}
