# Private business onboarding API

Implemented handler and OpenRouter model adapter. On 2026-09-12 a synthetic Studio Demo business completed a real model call and explicit draft save over HTTP (both 200); the saved file was verified with 0600 permissions. Missing visitor consent returned 400. This is a synthetic smoke test, not a customer conversion. All 98 tests and root/runtime typechecks pass.

Temporary API base: `https://sleeps-northern-warrior-retrieve.trycloudflare.com`. It depends on this computer and its running tunnel; it is not a permanent production deployment. Local API: `http://127.0.0.1:3019`. Start with `node --env-file=runtime/.env.local --import tsx scripts/onboarding-server.ts` from the repository root.

## Purpose

Describe business → clarify desired channel and existing agent → propose referral offer → explicit confirmation → persist a **draft**. No account connection, active campaign, verified ownership, payment, payout or customer message. Channel names describe desired setup, not supported live integrations.

## Configuration and boundaries

`DEMO_ENABLED=true`, private `DEMO_ACCESS_CODE` (16+ characters), `ONBOARDING_ORIGIN=https://refella.app`. The model-ready path additionally requires configured `OPENROUTER_API_KEY`; no provider credentials are returned to JavaScript. Do not embed the judging access code in public assets; ask the judge to enter it.

`ONBOARDING_DATA_DIR` is an optional private persistent directory. Default: `runtime/.onboarding-data` when running from repository root/runtime. Keep it ignored by Git and outside static serving. Directory 0700; random UUID JSON files 0600; synced temporary file + atomic rename. No arbitrary-file read endpoint. An ephemeral/serverless filesystem cannot guarantee persistence across instances/redeployments.

Single-process/private gate: 20 sessions, 60 model turns total per process lifetime, 12 turns/session, 20-minute sessions, 25-second model timeout, 800-character message, 16 KiB body, 30 start attempts/minute. Failed provider turns spend quota. Restart expires sessions and resets quotas; draft files remain on persistent storage. Public deployment requires distributed limits, durable shared state and real owner authentication.

## HTTP contract

All requests require Origin equal to API origin or exactly `https://refella.app`. Exact origin only; no path/trailing slash in config. CORS supports OPTIONS, GET/POST, Authorization and Content-Type. No wildcard/credentialed cookies. All responses no-store; errors `{error:string}`.

| Method | Path | Input |
|---|---|---|
| POST | `/api/onboarding/start` | `{code:"<private code>",consent:true}` |
| GET | `/api/onboarding/session` | Bearer token |
| POST | `/api/onboarding/messages` | Bearer token + `{message:"We run a barbershop called Studio Demo."}` |
| POST | `/api/onboarding/confirm` | Bearer token + `{proposalId:"<current preview UUID>"}` |

Start returns `token` (64 random hex characters) plus view. Other responses return view:

```json
{
  "messages": [{"role":"assistant","content":"Review your draft","source":"model"}],
  "proposal": {
    "proposalId":"<UUID>",
    "businessName":"Studio Demo",
    "businessType":"Barbershop",
    "channel":"telegram",
    "integrationMode":"our-agent",
    "offer":"Suggested: 100 noncash points after a qualifying referred purchase."
  },
  "draft":null,
  "remaining":10,
  "expiresAt":"2026-09-12T16:20:00.000Z",
  "mode":"draft-only"
}
```

Channels: `telegram|whatsapp|imessage|web`. Modes: `our-agent|existing-agent`. Render all text safely, never as HTML. Show all five draft fields and a **Save draft** button; do not automatically confirm from a model message. A new conversation turn invalidates/revises the old preview.

Successful confirmation returns `draft:{id,status:"draft",createdAt,businessName,businessType,channel,integrationMode,offer}` only after file write succeeds. Repeat same confirmation returns same draft ID without writing twice. Stale preview: 409 `proposal_changed`. Storage failure: 503 `draft_save_failed`; preview remains retryable. Saved session is read-only; no further messages.

## Landing example

```js
const base = 'https://YOUR-API-HOST'; // Separate hosting still required.
const response = await fetch(base + '/api/onboarding/start', {
  method: 'POST', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({code: judgeEnteredCode, consent: visitorCheckedConsent})
});
if (!response.ok) throw new Error('Onboarding unavailable');
const state = await response.json();
sessionStorage.setItem('onboardingToken', state.token);
const restored = await fetch(base + '/api/onboarding/session', {
  headers: {Authorization: `Bearer ${sessionStorage.getItem('onboardingToken')}`}
});
```

Token is a single-session capability, not an admin/provider credential. Protect the landing against XSS, do not log/share tokens. Restart/20-minute expiry requires a fresh session. Do not send personal contacts, customer data, credentials or payment information. Only confirmed business fields plus generated ID/status/time enter the draft JSON, not chat history or tokens.

## Required visitor notice and consent

Before Start, display this notice and an unchecked consent control. Do not hardcode consent=true or precheck the control:

> Your business descriptions and chat messages will be sent to OpenRouter and the selected AI model provider to generate responses. Do not share personal contact details, customer data, passwords or payment information. Confirmed business drafts are saved by this demo; no accounts are connected and no campaign is launched.

Control label: **I agree to send my business descriptions and chat messages to OpenRouter and the selected AI model provider.** Only after the visitor actively agrees may the landing send `consent:true`. Missing, false or string consent is rejected with 400 before creating a session. The API cannot verify how an independently implemented landing presented the notice: this is a required client integration obligation. A consented session expires after 20 minutes or restart; starting again requires consent. This does not authorize collection of personal/customer/payment data. No retention guarantees about external providers are asserted here.
