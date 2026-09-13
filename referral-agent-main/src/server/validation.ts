import { z } from 'zod';
import { ServiceError } from './errors';

export const idSchema = z.string().uuid();
export const identitySchema = z.object({
  businessId: idSchema,
  channel: z.enum(['telegram', 'whatsapp', 'demo', 'api']),
  externalId: z.string().trim().min(1).max(200),
  displayName: z.string().trim().min(1).max(120).optional(),
}).strict();
export interface TrustedCustomerContext {
  businessId: string;
  channel: 'telegram' | 'whatsapp' | 'demo' | 'api';
  externalId: string;
  displayName?: string;
}
export const claimSchema = z.object({ token: z.string().trim().min(8).max(200).regex(/^[A-Za-z0-9_-]+$/) }).strict();
export const requestSchema = z.object({
  service: z.string().trim().min(1).max(200),
  preferredTime: z.string().datetime({ offset: true }),
  requestKey: z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/),
}).strict();
export const purchaseSchema = z.object({
  requestId: idSchema,
  externalEventId: z.string().trim().min(1).max(200),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict();
export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ServiceError(400, 'invalid_input');
  return result.data;
}
