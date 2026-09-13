# Refella: two-person referral demo API

Verified locally on 2026-09-12. API only; the landing page must implement `/demo?ref=...`. Generating a URL does not publish that page or send a message to anyone.

## Run

```sh
node --env-file=runtime/.env.local --import tsx scripts/referral-demo-server.ts
```

Local base: `http://127.0.0.1:3020`. Routes are under `/api/referral-demo/`. This is not a public deployment. HTTPS landing pages need an HTTPS API host or a server-side proxy; do not call this localhost address from the published page.

Server configuration: `DEMO_ENABLED=true`, private `DEMO_ACCESS_CODE` (16+ characters), `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL` (default `openai/gpt-4.1-mini`), `REFERRAL_LANDING_ORIGIN=https://refella.app`, and `REFERRAL_DEMO_DATA` (default `runtime/.referral-demo/state.json`). Keep provider credentials server-side. The judge code is an admission gate, not a provider API key: do not hardcode it into a public bundle.

## Frontend contract

Every request needs `Origin: https://refella.app` (set automatically by the browser). POST uses `Content-Type: application/json`. Session actions use `Authorization: Bearer <token>`. OPTIONS preflight supports these headers. Wrong origins are rejected; CORS does not authenticate a caller. Keep participant tokens out of links, logs and analytics.

Show this notice and collect explicit consent before `start` or `join`:

> Your chat messages will be sent to OpenRouter and its selected AI provider to generate replies. Use fictional details only. Do not enter contact, payment or sensitive information. This demo simulates purchases and rewards.

| Method / route | Body or query | Result |
|---|---|---|
| POST `start` | `{code: judgeCode, consent: true, alias: "Alex Demo"}` | Advocate token, personal `invitation.url` and `shareText` |
| GET `invitation` | `?ref=<invitation.code>` | Public synthetic business information, inviter alias, notice and expiry |
| POST `join` | `{code: referralCode, consent: true, alias: "Sam Demo", joinKey: crypto.randomUUID()}` | New friend token and immutable inviter attribution |
| GET `session` | Bearer token | Current participant state |
| POST `messages` | `{message: "Haircut next Friday at 14:00 UTC"}` plus friend token | Assistant response; proposal once service and time are clear |
| POST `confirm` | `{proposalId: proposal.id}` plus friend token | `request.status: "requested"`; not a confirmed calendar booking |
| POST `simulate-purchase` | `{requestId: request.id, simulate: true}` plus advocate token | Friend becomes `simulated_paid`; advocate gets 100 demo points exactly once |

Keep the same `joinKey` for retries of one join. Generate it once per invitation/browser session, not on each click. Repeated joins return the same token. It is a secret retry capability; do not put it in the referral URL. Opening the link alone does not create a participant. No judge code is needed by a referred friend; the unguessable invitation grants bounded demo admission.

### Response fields

`start`/`join` return `{token, ...state}`. Other successful session operations return state:

```ts
interface ReferralState {
  mode: 'demo';
  participant: { id: string; role: 'advocate' | 'friend'; alias: string };
  messages: Array<{ role: 'user' | 'assistant'; content: string; source?: 'guide' | 'model' | 'event' }>;
  invitation: null | { code: string; url: string; shareText: string; expiresAt: string };
  attribution: null | { inviter: string };
  proposal: null | { id: string; service: string; preferredTime: string };
  request: null | { id: string; service: string; preferredTime: string; status: 'requested' | 'simulated_paid' };
  referrals: Array<{ id: string; alias: string; status: string; requestId: string | null }>;
  rewardPoints: number;
  rewards: Array<{ requestId: string; advocateId: string; points: number }>;
  remaining: number;
  expiresAt: string;
}
```

Render model text as text, never raw HTML. Display `proposal` with a separate confirmation control. Sharing uses `invitation.shareText` through the browser share sheet or copy action; the API does not deliver messages. Poll the advocate `session` on refresh or every few seconds while that view is visible. The simulated purchase control belongs to the advocate's demo view, clearly labeled as a simulation; friends cannot call it. To show both roles on one computer, use separate browser sessions and preserve their separate tokens.

## Boundaries and failure handling

- 24-hour sessions/invitations; at most 60 participants and 5 friends per invitation per stored demo dataset.
- At most 6 model calls per friend and 30 in the stored dataset, including failed calls; one model step, 220 output tokens, no provider retries, 15-second deadline. The smoke consumed one call.
- Global single-process serialization returns `409 busy_retry` during another operation. Retry deterministic requests after a short delay; do not automatically retry a failed model call.
- `400 invalid_input`/`future_time_required`: fix input. `401 invalid_code`/`session_expired`: re-enter gate or restart. `410 invitation_expired`: obtain another link. `429 model_limit`/`demo_capacity`: show demo limit reached. `503 model_unavailable`/`save_failed`: show failure, never fabricate success.
- `409 proposal_changed`: refresh the session and display the current proposal. Duplicate confirmation and simulated-purchase requests are idempotent.
- State is atomically saved to a private local file, including tokens and synthetic conversations. One process owns it. It survives process restarts but is **not Vercel/serverless or multi-replica ready**. A transactional external store is needed for that deployment.
- No real identity verification or production antifraud: self-referral is rejected when the advocate token is supplied, but a person can open a different browser. Points have no cash or redemption value. There is no real payment, calendar booking or messenger integration in this API.

## Verified evidence

`npm test`: 108 tests passed. `npm run typecheck`: root and runtime passed.

```sh
node --env-file=runtime/.env.local --import tsx scripts/referral-demo-smoke.ts
```

The real HTTP smoke performed exactly one OpenRouter turn. It created an invitation URL, joined a second session, verified attribution, generated a service proposal, confirmed it, simulated a paid visit, and verified duplicate joins, confirmations and rewards do not duplicate the outcome. Final status: `simulated_paid`; advocate balance: 100 points. No tokens were logged. Landing rendering and real message delivery were not tested.
