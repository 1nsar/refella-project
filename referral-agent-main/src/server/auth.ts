import { createHash, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ServiceError } from './errors';
import { idSchema, validate } from './validation';

export interface OwnerContext { businessId: string; ownerId: string }
export interface IntegrationEnvironment { REFERRAL_API_KEY?: string; REFERRAL_BUSINESS_ID?: string }

export function bearerToken(request: Request): string {
  const value = request.headers.get('authorization');
  if (!value || value.length > 8192 || !/^Bearer [^\s]+$/i.test(value)) {
    throw new ServiceError(401, 'unauthorized');
  }
  return value.slice(7);
}

export function authenticateIntegration(request: Request, env: IntegrationEnvironment): { businessId: string } {
  if (!env.REFERRAL_API_KEY || !env.REFERRAL_BUSINESS_ID || !idSchema.safeParse(env.REFERRAL_BUSINESS_ID).success) {
    throw new ServiceError(503, 'integration_unavailable');
  }
  const supplied = bearerToken(request);
  const digest = (value: string) => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(digest(supplied), digest(env.REFERRAL_API_KEY))) {
    throw new ServiceError(401, 'unauthorized');
  }
  return { businessId: env.REFERRAL_BUSINESS_ID };
}

export async function authenticateOwner(client: SupabaseClient, token: string, businessId: unknown): Promise<OwnerContext> {
  const tenant = validate(idSchema, businessId);
  if (!token || token.length > 8192) throw new ServiceError(401, 'unauthorized');
  let userResult;
  try { userResult = await client.auth.getUser(token); }
  catch { throw new ServiceError(401, 'unauthorized'); }
  if (userResult.error || !userResult.data.user) throw new ServiceError(401, 'unauthorized');
  const ownerId = userResult.data.user.id;
  const { data, error } = await client.from('businesses').select('id').eq('id', tenant).eq('owner_id', ownerId).maybeSingle();
  if (error) throw new ServiceError(503, 'storage_unavailable');
  if (!data) throw new ServiceError(403, 'forbidden');
  return { businessId: tenant, ownerId };
}
