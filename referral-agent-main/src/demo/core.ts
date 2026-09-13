import { randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { readBody, json } from '../http/api';
import { ServiceError, safeError } from '../server/index';

export const proposalSchema = z.object({
  service: z.enum(['Haircut', 'Haircut and beard']),
  preferredTime: z.string().datetime({ offset: true }),
}).strict();
export interface DemoMessage { role: 'user' | 'assistant'; content: string; source?: 'guide' | 'model' | 'event' }
export interface Proposal { service: 'Haircut' | 'Haircut and beard'; preferredTime: string }
export interface DemoState {
  proposal: Proposal | null;
  request: (Proposal & { status: 'requested' | 'purchased' }) | null;
  rewardUnits: number;
}
interface Session { expires: number; busy: boolean; turns: number; messages: DemoMessage[]; state: DemoState }
export interface DemoInput { messages: DemoMessage[]; state: DemoState }
export interface DemoResult { text: string; proposal?: Proposal }
export type DemoRunner = (input: DemoInput) => Promise<DemoResult>;
export const WELCOME = 'Maya invited you to Studio Demo. I can help you choose a service and request a time. After your simulated paid visit, Maya earns 100 demo points. What would you like to know?';

// Deliberately single-process, private judging sandbox. No production DB or real actions.
export function createDemoHandler(run: DemoRunner, env = process.env, now = Date.now) {
  const sessions = new Map<string, Session>();
  let turns = 0, starts = 0, attempts = 0, attemptWindow = 0;
  const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
    const result = schema.safeParse(value);
    if (!result.success) throw new ServiceError(400, 'invalid_input');
    return result.data;
  };
  const view = (s: Session) => ({ messages: s.messages, state: s.state, remaining: Math.max(0, 12 - s.turns), mode: 'synthetic' });
  return async (req: Request): Promise<Response> => {
    try {
      if (env.DEMO_ENABLED !== 'true' || !env.DEMO_ACCESS_CODE || env.DEMO_ACCESS_CODE.length < 16 || !env.DEMO_ORIGIN) throw new ServiceError(503, 'demo_disabled');
      const origin = new URL(env.DEMO_ORIGIN).origin;
      if (!env.OPENROUTER_API_KEY) throw new ServiceError(503, 'model_not_configured');
      if (req.method !== 'GET' && req.headers.get('origin') !== origin) throw new ServiceError(403, 'origin_rejected');
      for (const [id, s] of sessions) if (s.expires <= now() && !s.busy) sessions.delete(id);
      const path = new URL(req.url).pathname;
      if (path === '/api/demo/start' && req.method === 'POST') {
        if (now() >= attemptWindow) { attempts = 0; attemptWindow = now() + 60_000; }
        if (++attempts > 30) throw new ServiceError(429, 'try_later');
        const { code } = parse(z.object({ code: z.string().min(1).max(200) }).strict(), await readBody(req));
        const supplied = Buffer.from(code), expected = Buffer.from(env.DEMO_ACCESS_CODE);
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new ServiceError(401, 'invalid_code');
        if (starts >= 20 || turns >= 60) throw new ServiceError(429, 'demo_capacity');
        const id = randomBytes(32).toString('hex');
        const s: Session = { expires: now() + 20 * 60_000, busy: false, turns: 0, messages: [{ role: 'assistant', content: WELCOME, source: 'guide' }], state: { proposal: null, request: null, rewardUnits: 0 } };
        sessions.set(id, s); starts++;
        const response = json(view(s));
        response.headers.set('set-cookie', `referral_demo=${id}; Path=/api/demo; HttpOnly; SameSite=Strict; Max-Age=1200${origin.startsWith('https:') ? '; Secure' : ''}`);
        return response;
      }
      const id = /(?:^|;\s*)referral_demo=([a-f0-9]{64})(?:;|$)/.exec(req.headers.get('cookie') || '')?.[1];
      const s = id ? sessions.get(id) : undefined;
      if (!s || s.expires <= now()) throw new ServiceError(401, 'demo_expired');
      if (path === '/api/demo/state' && req.method === 'GET') return json(view(s));
      if (req.method !== 'POST') throw new ServiceError(404, 'not_found');
      if (s.busy) throw new ServiceError(409, 'turn_in_progress');
      // Reserve before reading the asynchronous body, so two requests cannot pass the lock.
      s.busy = true;
      try {
        const body = await readBody(req);
        if (path === '/api/demo/message') {
          const { message } = parse(z.object({ message: z.string().trim().min(1).max(800) }).strict(), body);
          if (s.turns >= 12 || turns >= 60) throw new ServiceError(429, 'demo_limit');
          s.turns++; turns++; // Failed provider calls still spend quota; never auto-retry.
          const history = [...s.messages, { role: 'user' as const, content: message }];
          let result: DemoResult;
          try { result = await run({ messages: history, state: structuredClone(s.state) }); }
          catch { throw new ServiceError(503, 'model_unavailable'); }
          if (!result.text?.trim()) throw new ServiceError(503, 'model_unavailable');
          let proposal: Proposal | undefined;
          if (result.proposal && !s.state.request) {
            proposal = parse(proposalSchema, result.proposal);
            if (Date.parse(proposal.preferredTime) <= now()) throw new ServiceError(400, 'future_time_required');
          }
          s.messages = [...history, { role: 'assistant', content: result.text.slice(0, 2000), source: 'model' }];
          if (proposal) s.state.proposal = proposal;
        } else if (path === '/api/demo/confirm') {
          parse(z.object({}).strict(), body);
          if (!s.state.request) {
            if (!s.state.proposal) throw new ServiceError(409, 'proposal_required');
            if (Date.parse(s.state.proposal.preferredTime) <= now()) throw new ServiceError(400, 'future_time_required');
            s.state.request = { ...s.state.proposal, status: 'requested' }; s.state.proposal = null;
            s.messages.push({ role: 'assistant', content: 'Demo request submitted. This is not a confirmed booking. The business would confirm availability separately.', source: 'event' });
          }
        } else if (path === '/api/demo/purchase') {
          parse(z.object({}).strict(), body);
          if (!s.state.request) throw new ServiceError(409, 'request_required');
          if (s.state.request.status !== 'purchased') {
            s.state.request.status = 'purchased'; s.state.rewardUnits = 100;
            s.messages.push({ role: 'assistant', content: 'Simulated paid visit recorded. Maya received 100 demo points. No money was charged and no real reward was issued.', source: 'event' });
          }
        } else throw new ServiceError(404, 'not_found');
        return json(view(s));
      } finally { s.busy = false; }
    } catch (error) { const safe = safeError(error); return json(safe.body, safe.status); }
  };
}
