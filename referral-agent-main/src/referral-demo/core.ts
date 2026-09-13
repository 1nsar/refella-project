import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { readBody, json } from '../http/api';
import { ServiceError, safeError } from '../server';
import { proposalSchema, type Proposal, type DemoMessage } from '../demo/core';

export const CONSENT_NOTICE = 'Your chat messages will be sent to OpenRouter and its selected AI provider to generate replies. Use fictional details only. Do not enter contact, payment or sensitive information. This demo simulates purchases and rewards.';
export const BUSINESS = { name: 'Studio Demo', services: ['Haircut', 'Haircut and beard'], rewardPoints: 100,
  terms: 'The inviter earns 100 noncash demo points after a referred friend’s first simulated paid visit. No real payment, booking or reward.' };
interface Participant { id: string; role: 'advocate' | 'friend'; alias: string; expiresAt: number; invite: string;
  messages: DemoMessage[]; turns: number; proposal: (Proposal & { id: string }) | null;
  request: (Proposal & { id: string; status: 'requested' | 'simulated_paid' }) | null }
interface Invitation { owner: string; expiresAt: number; joins: Record<string, string> }
export interface State { version: 1; turns: number; participants: Record<string, Participant>; invitations: Record<string, Invitation>;
  rewards: Record<string, { requestId: string; advocateId: string; points: number }>; events: { type: string; participantId: string; at: string }[] }
export interface RunnerInput { messages: DemoMessage[]; signal: AbortSignal; inviter: string; proposal: Proposal | null }
export interface RunnerResult { text: string; proposal?: Proposal }
export interface Store { load(): Promise<State | undefined>; save(state: State): Promise<void> }
const empty = (): State => ({ version: 1, turns: 0, participants: {}, invitations: {}, rewards: {}, events: [] });
const secret = () => randomBytes(32).toString('hex');
const digest = (s: string) => createHash('sha256').update(s).digest();
const validate = <T>(schema: z.ZodType<T>, value: unknown): T => { const parsed = schema.safeParse(value); if (!parsed.success) throw new ServiceError(400, 'invalid_input'); return parsed.data; };
const alias = z.string().trim().min(1).max(40);

export function createReferralDemo(run: (input: RunnerInput) => Promise<RunnerResult>, store: Store, env = process.env, now = Date.now) {
  let state: State | undefined, busy = false, attempts = 0, windowEnd = 0;
  const event = (s: State, type: string, p: Participant) => s.events.push({ type, participantId: p.id, at: new Date(now()).toISOString() });
  const view = (s: State, token: string) => {
    const p = s.participants[token], invitation = s.invitations[p.invite];
    const referrals = p.role === 'advocate' ? Object.values(s.participants).filter(f => f.role === 'friend' && f.invite === p.invite)
      .map(f => ({ id: f.id, alias: f.alias, status: f.request?.status || 'joined', requestId: f.request?.id || null })) : [];
    const rewards = Object.values(s.rewards).filter(r => r.advocateId === p.id);
    const url = new URL('/demo', env.REFERRAL_LANDING_ORIGIN || 'https://refella.app'); url.searchParams.set('ref', p.invite);
    return { mode: 'demo', business: BUSINESS, participant: { id: p.id, role: p.role, alias: p.alias }, expiresAt: new Date(p.expiresAt).toISOString(),
      messages: p.messages, proposal: p.proposal, request: p.request, remaining: Math.max(0, 6 - p.turns),
      invitation: p.role === 'advocate' ? { code: p.invite, url: url.href, expiresAt: new Date(invitation.expiresAt).toISOString(),
        shareText: `Try Studio Demo with my invitation: ${url.href}\nAfter your simulated paid visit, I get 100 demo points. No real payment.` } : null,
      attribution: p.role === 'friend' ? { inviter: s.participants[invitation.owner].alias } : null,
      referrals, rewardPoints: rewards.reduce((sum, r) => sum + r.points, 0), rewards,
      events: s.events.filter(e => e.participantId === p.id) };
  };
  return async (req: Request): Promise<Response> => {
    let origin: string | null = null, acquired = false;
    const respond = (body: unknown, status = 200) => { const r = status === 204 ? new Response(null, { status }) : json(body, status);
      r.headers.set('vary', 'Origin'); r.headers.set('cache-control', 'no-store'); if (origin) r.headers.set('access-control-allow-origin', origin); return r; };
    try {
      const allowed = env.REFERRAL_LANDING_ORIGIN || 'https://refella.app';
      if (env.DEMO_ENABLED !== 'true' || !env.DEMO_ACCESS_CODE || env.DEMO_ACCESS_CODE.length < 16 || new URL(allowed).origin !== allowed) throw new ServiceError(503, 'demo_disabled');
      if (req.headers.get('origin') !== allowed) throw new ServiceError(403, 'origin_rejected');
      origin = allowed;
      const url = new URL(req.url), path = url.pathname.replace('/api/referral-demo/', '');
      if (!['start', 'invitation', 'join', 'session', 'messages', 'confirm', 'simulate-purchase'].includes(path)) throw new ServiceError(404, 'not_found');
      if (req.method === 'OPTIONS') {
        if (!['POST', 'GET'].includes(req.headers.get('access-control-request-method') || '') ||
          (req.headers.get('access-control-request-headers') || '').split(',').some(h => h.trim() && !['authorization', 'content-type'].includes(h.trim().toLowerCase()))) throw new ServiceError(403, 'preflight_rejected');
        const r = respond(null, 204); r.headers.set('access-control-allow-methods', 'GET, POST, OPTIONS'); r.headers.set('access-control-allow-headers', 'Authorization, Content-Type'); return r;
      }
      if (!['GET', 'POST'].includes(req.method)) throw new ServiceError(405, 'method_not_allowed');
      if (busy) throw new ServiceError(409, 'busy_retry');
      busy = true; acquired = true;
      state ??= await store.load() || empty();
      if (state.version !== 1) throw new ServiceError(503, 'storage_version');
      const s = structuredClone(state);
      const persist = async () => { try { await store.save(s); state = structuredClone(s); } catch { throw new ServiceError(503, 'save_failed'); } };
      const invitation = (code: string) => { const i = s.invitations[code]; if (!i || i.expiresAt <= now()) throw new ServiceError(410, 'invitation_expired'); return i; };
      if (path === 'invitation' && req.method === 'GET') {
        const i = invitation(url.searchParams.get('ref') || '');
        return respond({ business: BUSINESS, inviter: s.participants[i.owner].alias, consentNotice: CONSENT_NOTICE, expiresAt: new Date(i.expiresAt).toISOString() });
      }
      if (['start', 'join'].includes(path) && req.method === 'POST') {
        if (now() >= windowEnd) { attempts = 0; windowEnd = now() + 60_000; }
        if (++attempts > 30) throw new ServiceError(429, 'try_later');
        const raw = await readBody(req);
        const data = validate(z.object({ consent: z.literal(true), alias, code: z.string().max(200), joinKey: z.string().uuid().optional() }).strict(), raw);
        if (path === 'start' && !timingSafeEqual(digest(data.code), digest(env.DEMO_ACCESS_CODE))) throw new ServiceError(401, 'invalid_code');
        const i = path === 'join' ? invitation(data.code) : undefined;
        const current = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.get('authorization') || '')?.[1];
        if (i && current === i.owner) throw new ServiceError(409, 'self_referral');
        if (i && !data.joinKey) throw new ServiceError(400, 'join_key_required');
        if (i && i.joins[data.joinKey!]) { const token = i.joins[data.joinKey!]; if (s.participants[token].expiresAt <= now()) throw new ServiceError(410, 'session_expired'); return respond({ token, ...view(s, token) }); }
        if (Object.keys(s.participants).length >= 60 || (i && Object.keys(i.joins).length >= 5)) throw new ServiceError(429, 'demo_capacity');
        const token = secret(), inviteCode = i ? data.code : randomBytes(18).toString('hex');
        const p: Participant = { id: randomUUID(), role: i ? 'friend' : 'advocate', alias: data.alias, expiresAt: now() + 86400_000,
          invite: inviteCode, messages: [{ role: 'assistant', source: 'guide', content: i
            ? `${s.participants[i.owner].alias} invited you to Studio Demo. Haircut, or haircut and beard? I can prepare a request for the shop to review.`
            : 'Your invitation is ready to share. When your friend completes a simulated paid visit, you earn 100 demo points. You can track it here.' }], turns: 0, proposal: null, request: null };
        s.participants[token] = p;
        if (i) i.joins[data.joinKey!] = token; else s.invitations[inviteCode] = { owner: token, expiresAt: p.expiresAt, joins: {} };
        event(s, i ? 'friend_joined' : 'invitation_created', p); await persist();
        return respond({ token, ...view(s, token) }, 201);
      }
      const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.get('authorization') || '')?.[1];
      const p = token ? s.participants[token] : undefined;
      if (!p || p.expiresAt <= now()) throw new ServiceError(401, 'session_expired');
      if (path === 'session' && req.method === 'GET') return respond(view(s, token!));
      if (req.method !== 'POST') throw new ServiceError(405, 'method_not_allowed');
      const raw = await readBody(req);
      if (path === 'simulate-purchase') {
        if (p.role !== 'advocate') throw new ServiceError(403, 'advocate_required');
        const { requestId, simulate } = validate(z.object({ requestId: z.string().uuid(), simulate: z.literal(true) }).strict(), raw);
        void simulate;
        const friend = Object.values(s.participants).find(f => f.role === 'friend' && f.invite === p.invite && f.request?.id === requestId);
        if (!friend?.request) throw new ServiceError(404, 'request_not_found');
        if (!s.rewards[requestId]) {
          friend.request.status = 'simulated_paid';
          s.rewards[requestId] = { requestId, advocateId: p.id, points: 100 };
          event(s, 'demo_reward_credited', p); event(s, 'visit_simulated_paid', friend);
          friend.messages.push({ role: 'assistant', source: 'event', content: 'Test visit marked as paid. Your inviter earned 100 demo points. No money was charged.' });
        }
      } else if (path === 'confirm') {
        if (p.role !== 'friend') throw new ServiceError(403, 'friend_required');
        const { proposalId } = validate(z.object({ proposalId: z.string().uuid() }).strict(), raw);
        if (!p.proposal || p.proposal.id !== proposalId) throw new ServiceError(409, 'proposal_changed');
        if (!p.request) {
          if (Date.parse(p.proposal.preferredTime) <= now()) throw new ServiceError(400, 'future_time_required');
          const { id: _, ...details } = p.proposal;
          p.request = { ...details, id: randomUUID(), status: 'requested' }; event(s, 'request_submitted', p);
          p.messages.push({ role: 'assistant', source: 'event', content: 'Your demo request is submitted. The shop still needs to confirm availability; this is not a reserved slot.' });
        }
      } else if (path === 'messages') {
        if (p.role !== 'friend') throw new ServiceError(403, 'friend_required');
        if (p.request) throw new ServiceError(409, 'request_already_submitted');
        const { message } = validate(z.object({ message: z.string().trim().min(1).max(800) }).strict(), raw);
        if (p.turns >= 6 || s.turns >= 30) throw new ServiceError(429, 'model_limit');
        p.turns++; s.turns++; p.proposal = null;
        // Persist the budget reservation BEFORE provider egress, including failed calls.
        await persist();
        const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
        let result: RunnerResult;
        try { result = await Promise.race([run({ messages: [...p.messages, { role: 'user', content: message }], signal: controller.signal,
          inviter: s.participants[s.invitations[p.invite].owner].alias, proposal: null }),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, 15_000); })]); }
        catch { throw new ServiceError(503, 'model_unavailable'); } finally { clearTimeout(timer); }
        if (!result.text?.trim()) throw new ServiceError(503, 'model_unavailable');
        if (result.proposal) { const value = validate(proposalSchema, result.proposal); if (Date.parse(value.preferredTime) <= now()) throw new ServiceError(400, 'future_time_required'); p.proposal = { ...value, id: randomUUID() }; }
        p.messages.push({ role: 'user', content: message }, { role: 'assistant', source: 'model', content: p.proposal
          ? 'Here’s your request to review. Confirm it to send it to the demo shop; availability is not confirmed.' : result.text.slice(0, 1600) });
      } else throw new ServiceError(404, 'not_found');
      await persist(); return respond(view(s, token!));
    } catch (error) { const safe = safeError(error); return respond(safe.body, safe.status); }
    finally { if (acquired) busy = false; }
  };
}
