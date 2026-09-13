import { database } from '../../../src/http/api';
import { createReferralService, ServiceError, type TrustedCustomerContext } from '../../../src/server/index';
export function customerContext(auth: unknown): TrustedCustomerContext {
  const value = auth as { authenticator?: string; principalId?: string; attributes?: Record<string, unknown> } | null;
  if (value?.authenticator !== 'referral-telegram' || typeof value.principalId !== 'string' || typeof value.attributes?.businessId !== 'string') throw new ServiceError(403, 'forbidden');
  return { businessId: value.attributes.businessId, channel: 'telegram', externalId: value.principalId };
}
export function service() { return createReferralService(database()); }
