# Browser demo for judges

The landing-page button should say **Try the demo** and link to the runtime's `/demo` URL. No Telegram account or product installation is required. The colleague's landing repository has not been changed. Use a top-level link; this app's security policy intentionally blocks iframe embedding.

The English demo follows Maya's invitation to a fictional salon, Studio Demo. The visitor asks a question, chooses Haircut or Haircut and beard, gives a future date/time and timezone, reviews a proposed request, and explicitly submits it. A separate **Simulate paid visit** button records a synthetic purchase and awards Maya 100 demo points. It does not reserve a slot, charge money, send messages, write to Supabase or issue a real reward.

This sandbox demonstrates the interaction, not the production database path: referral attribution is pre-seeded per session, requests and reward state are in memory. The production referral engine remains separate and requires its own live end-to-end test. AI replies use OpenRouter; the static introduction and system events are labelled separately. No fake reply fallback is used when the model is unavailable.

## Activation

1. Replace any credentials pasted into chat. Store fresh credentials only in ignored `runtime/.env.local`.
2. Configure `OPENROUTER_API_KEY` with a small provider-side credit limit. The existing `OPENROUTER_MODEL` setting is reused.
3. Set `DEMO_ENABLED=true`, `DEMO_ACCESS_CODE` to a randomly generated secret of at least 16 characters, and `DEMO_ORIGIN` to the exact browser origin (for local testing `http://localhost:3017`). Share the access code privately with judges, never in landing HTML or source.
4. Run one Node runtime instance. Use HTTPS for any remote access. Restart after changing configuration.
5. Test with a fresh browser: code gate, question, request, explicit confirmation, synthetic purchase, refresh. Repeat with a second browser to verify its state is separate.

## Abuse boundary

- HttpOnly, SameSite=Strict session cookie; Secure on HTTPS; 20-minute expiry.
- Same-origin validation on every POST, no open CORS, no client-selected tenant/session identifier.
- 800-character messages, 16 KiB request bodies, 12 model turns per session.
- At most 2 model steps per turn, 400 output tokens per step, no SDK retries, 25-second abort.
- 20 session admissions and 60 model turns total per process lifetime, including failed model calls. Access-code attempts capped at 30 per minute per process. Concurrent writes to a session are rejected.
- No model tool can confirm a purchase, issue a real reward, query production data or execute arbitrary code.

These are single-process safeguards, not distributed quotas or a guaranteed dollar ceiling. A restart clears sessions and counters; multiple replicas multiply limits. Do not enable this sandbox on autoscaling/serverless infrastructure without a shared quota store. Provider-side spending limits are still required. The session code can be forwarded; it is an access gate, not verified judge identity. No IP tracking or fingerprinting is used.

## Telegram presentation

Live local demo transport: `node --env-file=runtime/.env.local --import tsx scripts/telegram-demo.ts`. Uses polling, refuses to run when a webhook is configured, and reuses the isolated demo engine. User authorized message transmission to OpenRouter. No Supabase writes; state and quotas reset when the process restarts. Run only one poller. Old messages predating startup are skipped; shutdown/restart is not durable message delivery.

Updated Telegram name, description, short description and cleared commands through the API. Reply keyboard is removed on the next bot message. The English shop-host voice gathers the service and preferred time. After a displayed preview, a plain “yes” confirms; outside that context it does not. “Simulate paid visit” is an explicit test action, never a claim of actual payment. Profile avatar has not been changed.

The bot's response instructions and confirmation/error messages are English. Original suggested BotFather text (superseded by the live profile update above):

- Name: Referral Agent
- About: Invitations, service requests and referral rewards, right in chat.
- Description: Have an invitation? Start here. Ask about the business, request a visit, or check your referral rewards. Requests are confirmed separately by the business.

The product brand remains unapproved. Keep this descriptive name until the user chooses one. Profile names/descriptions can be configured via the [Telegram Bot API](https://core.telegram.org/bots/api#setmydescription); do not commit or print bot tokens.
