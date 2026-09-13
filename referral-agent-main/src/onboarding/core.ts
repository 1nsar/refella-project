import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { readBody, json } from '../http/api';
import { ServiceError, safeError } from '../server';
import { draftSchema, saveDraft, type DraftInput, type SavedDraft } from './storage';

export interface OnboardingMessage { role: 'user' | 'assistant'; content: string; source?: 'guide' | 'model' | 'event' }
export interface Proposal extends DraftInput { proposalId: string }
export interface OnboardingInput { messages: OnboardingMessage[]; proposal: Proposal | null; signal: AbortSignal }
export interface OnboardingResult { text: string; proposal?: DraftInput }
export type OnboardingRunner = (input: OnboardingInput) => Promise<OnboardingResult>;
interface Session { expiresAt: number; busy: boolean; turns: number; messages: OnboardingMessage[]; proposal: Proposal | null; draft: SavedDraft | null }
export const WELCOME = "Tell me your business name and what you sell. I’ll help you draft a referral offer and choose how it fits your messaging setup. This private preview saves drafts only; it doesn’t connect accounts or launch a campaign. Please don’t share personal contact details.";
export const CONSENT_NOTICE = 'Your business descriptions and chat messages will be sent to OpenRouter and the selected AI model provider to generate responses. Do not share personal contact details, customer data, passwords or payment information. Confirmed business drafts are saved by this demo; no accounts are connected and no campaign is launched.';

// Private, single-process judging gate: not a distributed public onboarding service.
export function createOnboardingHandler(run: OnboardingRunner, env = process.env, now = Date.now,
  persist: (draft: DraftInput, directory?: string) => Promise<SavedDraft> = saveDraft) {
  const sessions = new Map<string, Session>();
  let starts = 0, turns = 0, attempts = 0, attemptWindow = 0;
  const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
    const result = schema.safeParse(value);
    if (!result.success) throw new ServiceError(400, 'invalid_input');
    return result.data;
  };
  const view = (s: Session) => ({ messages: s.messages, proposal: s.proposal, draft: s.draft,
    remaining: Math.max(0, 12 - s.turns), expiresAt: new Date(s.expiresAt).toISOString(), mode: 'draft-only' });
  return async (req: Request): Promise<Response> => {
    let corsOrigin: string | null = null;
    const respond = (value: unknown, status = 200) => {
      const response = status === 204 ? new Response(null, { status }) : json(value, status);
      response.headers.set('vary', 'Origin'); response.headers.set('cache-control', 'no-store');
      if (corsOrigin) response.headers.set('access-control-allow-origin', corsOrigin);
      return response;
    };
    try {
      if (env.DEMO_ENABLED !== 'true' || !env.DEMO_ACCESS_CODE || env.DEMO_ACCESS_CODE.length < 16 || !env.ONBOARDING_ORIGIN) throw new ServiceError(503, 'onboarding_disabled');
      let allowed: URL;
      try { allowed = new URL(env.ONBOARDING_ORIGIN); } catch { throw new ServiceError(503, 'onboarding_disabled'); }
      if (!['https:', 'http:'].includes(allowed.protocol) || allowed.origin !== env.ONBOARDING_ORIGIN) throw new ServiceError(503, 'onboarding_disabled');
      const origin = req.headers.get('origin');
      if (!origin || (origin !== new URL(req.url).origin && origin !== allowed.origin)) throw new ServiceError(403, 'origin_rejected');
      corsOrigin = origin;
      const path = new URL(req.url).pathname;
      if (!['/api/onboarding/start', '/api/onboarding/session', '/api/onboarding/messages', '/api/onboarding/confirm'].includes(path)) throw new ServiceError(404, 'not_found');
      if (req.method === 'OPTIONS') {
        const requestedMethod = req.headers.get('access-control-request-method');
        const headers = (req.headers.get('access-control-request-headers') || '').toLowerCase().split(',').map(h => h.trim()).filter(Boolean);
        if (!['GET', 'POST'].includes(requestedMethod || '') || headers.some(h => !['authorization', 'content-type'].includes(h))) throw new ServiceError(403, 'preflight_rejected');
        const response = respond(null, 204);
        response.headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
        response.headers.set('access-control-allow-headers', 'Authorization, Content-Type');
        return response;
      }
      for (const [id, s] of sessions) if (s.expiresAt <= now() && !s.busy) sessions.delete(id);
      if (path.endsWith('/start') && req.method === 'POST') {
        if (now() >= attemptWindow) { attempts = 0; attemptWindow = now() + 60000; }
        if (++attempts > 30) throw new ServiceError(429, 'try_later');
        const { code } = parse(z.object({ code: z.string().min(1).max(200), consent: z.literal(true) }).strict(), await readBody(req));
        const digest = (value: string) => createHash('sha256').update(value).digest();
        if (!timingSafeEqual(digest(code), digest(env.DEMO_ACCESS_CODE))) throw new ServiceError(401, 'invalid_code');
        if (starts >= 20 || turns >= 60) throw new ServiceError(429, 'onboarding_capacity');
        const token = randomBytes(32).toString('hex');
        const session: Session = { expiresAt: now() + 1200000, busy: false, turns: 0,
          messages: [{ role: 'assistant', content: WELCOME, source: 'guide' }], proposal: null, draft: null };
        sessions.set(token, session); starts++;
        return respond({ token, ...view(session) });
      }
      const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.get('authorization') || '')?.[1];
      const s = token ? sessions.get(token) : undefined;
      if (!s || s.expiresAt <= now()) throw new ServiceError(401, 'session_expired');
      if (path.endsWith('/session') && req.method === 'GET') return respond(view(s));
      if (req.method !== 'POST' || !['/api/onboarding/messages', '/api/onboarding/confirm'].includes(path)) throw new ServiceError(404, 'not_found');
      if (s.busy) throw new ServiceError(409, 'turn_in_progress');
      s.busy = true;
      try {
        const body = await readBody(req);
        if (path.endsWith('/confirm')) {
          const { proposalId } = parse(z.object({ proposalId: z.string().uuid() }).strict(), body);
          if (!s.proposal || s.proposal.proposalId !== proposalId) throw new ServiceError(409, 'proposal_changed');
          if (!s.draft) {
            const { proposalId: _, ...input } = s.proposal;
            try { s.draft = await persist(input, env.ONBOARDING_DATA_DIR); }
            catch { throw new ServiceError(503, 'draft_save_failed'); }
            s.messages.push({ role: 'assistant', content: 'Your draft is saved. No channel is connected and no campaign is live. A separate setup and approval are still required.', source: 'event' });
          }
        } else {
          if (s.draft) throw new ServiceError(409, 'draft_already_saved');
          const { message } = parse(z.object({ message: z.string().trim().min(1).max(800) }).strict(), body);
          if (!env.OPENROUTER_API_KEY) throw new ServiceError(503, 'model_not_configured');
          if (s.turns >= 12 || turns >= 60) throw new ServiceError(429, 'onboarding_limit');
          s.turns++; turns++;
          const messages = [...s.messages, { role: 'user' as const, content: message }];
          const controller = new AbortController();
          let timeout: ReturnType<typeof setTimeout> | undefined;
          let result: OnboardingResult;
          try {
            result = await Promise.race([run({ messages, proposal: structuredClone(s.proposal), signal: controller.signal }),
              new Promise<never>((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, 25000); })]);
          } catch { throw new ServiceError(503, 'model_unavailable'); }
          finally { clearTimeout(timeout); }
          if (!result.text?.trim()) throw new ServiceError(503, 'model_unavailable');
          if (result.proposal) s.proposal = { ...parse(draftSchema, result.proposal), proposalId: randomUUID() };
          // A new message invalidates old confirmation unless the model explicitly proposes again.
          else s.proposal = null;
          s.messages = [...messages, { role: 'assistant', content: result.proposal
            ? 'Here’s a suggested draft to review. Confirm it to save; nothing will be connected or launched.' : result.text.slice(0, 2000), source: 'model' }];
        }
        return respond(view(s));
      } finally { s.busy = false; }
    } catch (error) { const safe = safeError(error); return respond(safe.body, safe.status); }
  };
}
