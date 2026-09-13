import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authenticateIntegration, authenticateOwner, bearerToken, createReferralService, safeError, ServiceError } from '../server/index';

export function database() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new ServiceError(503, 'storage_not_configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function authDatabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Backward-compatible server-only setup; never expose this fallback key to the browser.
  if (!key) return database();
  if (!url) throw new ServiceError(503, 'storage_not_configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new ServiceError(415, 'json_required');
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceError(400, 'invalid_input');
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const item = await reader.read(); if (item.done) break;
    size += item.value.byteLength;
    if (size > 16_384) { await reader.cancel(); throw new ServiceError(413, 'body_too_large'); }
    chunks.push(item.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ServiceError(400, 'invalid_json'); }
}
const uuid = z.string().uuid();
const identity = z.object({ externalId: z.string().min(1).max(200), displayName: z.string().max(200).optional() });
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw new ServiceError(400, 'invalid_input');
  return result.data;
};
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}
// ponytail: per-process cap; shared edge limits required before multi-instance production.
const loginAttempts = new Map<string, { count: number; until: number }>();
function loginLimit(email: string) {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) if (entry.until <= now) loginAttempts.delete(key);
  const previous = loginAttempts.get(email);
  if ((previous?.count ?? 0) >= 10 || (!previous && loginAttempts.size >= 1000)) throw new ServiceError(429, 'try_later');
  loginAttempts.set(email, { count: (previous?.count ?? 0) + 1, until: previous?.until ?? now + 60_000 });
}
export async function handleApi(request: Request): Promise<Response> {
  try {
    const path = new URL(request.url).pathname;
    if (path === '/api/health' && request.method === 'GET') return json({ status: 'ok', mode: 'prototype' });
    if (path === '/api/login' && request.method === 'POST') {
      const body = parse(z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) }).strict(), await readBody(request));
      loginLimit(body.email.toLowerCase());
      const authClient = authDatabase();
      const { data, error } = await authClient.auth.signInWithPassword(body);
      if (error || !data.session) throw new ServiceError(401, 'invalid_login');
      // User session enforces owner RLS even when only a publishable key is configured.
      const result = await authClient.from('businesses').select('id,name').eq('owner_id', data.user.id);
      if (result.error) throw new ServiceError(503, 'storage_unavailable');
      return json({ accessToken: data.session.access_token, businesses: result.data ?? [] });
    }
    if (path === '/api/dashboard' && request.method === 'GET') {
      const token = bearerToken(request), client = database();
      const owner = await authenticateOwner(client, token, new URL(request.url).searchParams.get('businessId'));
      return json(await createReferralService(client).dashboard(owner));
    }
    if ((path === '/api/confirm' || path === '/api/cancel') && request.method === 'POST') {
      const token = bearerToken(request);
      const body = parse(z.object({ businessId: uuid, requestId: uuid, eventId: z.string().min(1).max(128).optional(), amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional() }).strict(), await readBody(request));
      const client = database(), owner = await authenticateOwner(client, token, body.businessId);
      const service = createReferralService(client);
      return json(path === '/api/cancel' ? await service.cancelRequest(owner, body.requestId) : await service.confirmPurchase(owner, { requestId: body.requestId, externalEventId: body.eventId, amountMinor: body.amountMinor }));
    }
    if (path.startsWith('/api/referrals/') && request.method === 'POST') {
      // Trusted server credential may assert its own customers, never an arbitrary tenant.
      const { businessId } = authenticateIntegration(request, process.env);
      const raw = await readBody(request), base = parse(identity, raw);
      const context = { ...base, businessId, channel: 'api' as const };
      const service = createReferralService(database());
      switch (path) {
        case '/api/referrals/invite': parse(identity.strict(), raw); return json(await service.createInvite(context));
        case '/api/referrals/claim': {
          const body = parse(identity.extend({ token: z.string().min(1).max(128) }).strict(), raw);
          return json(await service.claimInvite(context, { token: body.token }));
        }
        case '/api/referrals/request': {
          const body = parse(identity.extend({ service: z.string().min(1).max(500), preferredTime: z.string(), requestKey: z.string() }).strict(), raw);
          return json(await service.createRequest(context, { service: body.service, preferredTime: body.preferredTime, requestKey: body.requestKey }));
        }
        case '/api/referrals/rewards': parse(identity.strict(), raw); return json(await service.ownRewards(context));
      }
    }
    return json({ error: 'not_found' }, 404);
  } catch (error) { const safe = safeError(error); return json(safe.body, safe.status); }
}
