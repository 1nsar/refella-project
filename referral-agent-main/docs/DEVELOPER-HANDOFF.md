# Current build handoff

Repository is private. Implementation branch: `codex/referral-mvp`. The separate landing is not included. No real credentials, participant data or media files are included.

## Run the two-person referral API

Use Node.js 24+.

```sh
git clone --branch codex/referral-mvp https://github.com/yerdaulet-damir/referral-agent.git
cd referral-agent
npm ci
cp runtime/.env.example runtime/.env.local
```

Set `DEMO_ENABLED=true`, a private `DEMO_ACCESS_CODE` of at least 16 characters, `OPENROUTER_API_KEY`, and `REFERRAL_LANDING_ORIGIN=https://refella.app`. Get credentials privately from the team; do not put them in source or the frontend. Leave unused optional paths unset/empty.

```sh
npm test
npm run typecheck
node --env-file=runtime/.env.local --import tsx scripts/referral-demo-server.ts
```

API listens on `127.0.0.1:3020`. Exact endpoints, consent text, tokens, sharing and UI responsibilities: [REFERRAL-DEMO-API.md](REFERRAL-DEMO-API.md).

Optional real smoke, in a second terminal: `node --env-file=runtime/.env.local --import tsx scripts/referral-demo-smoke.ts`. This consumes one short model call and writes synthetic participants; ordinary tests do not call the provider.

## Other entry points

- `scripts/onboarding-server.ts`: business-owner draft onboarding on `127.0.0.1:3019`; see ONBOARDING-API.md. This is not the two-person referral flow.
- `scripts/telegram-demo.ts`: older standalone Telegram polling demo; separate synthetic state. Do not run two pollers with the same bot token.
- `npm run dev`: original eve application. Starting it does not start the standalone referral API above.

## Deployment boundary

This snapshot is verified locally, not deployed and not a drop-in Vercel deployment. The standalone referral server binds localhost; a traditional host needs an HTTPS reverse proxy and persistent disk. Only one process may own the state file. Container hosting requires an appropriate public bind/port configuration.

For Vercel, wrap the handler in server routes AND replace local file storage/single-process locking with transactional shared storage. Also move quotas and session coordination out of process. Merely wrapping it in a route will not solve persistence or concurrency. Existing Supabase configuration alone does not create the required schema.

The landing must implement `/demo?ref=...`, render the API state, and provide sharing/copy and explicit confirmation. Generated links are not evidence that the landing route exists. The API does not send messenger messages. Payment and rewards are simulated.

Telegram media is optional via `TELEGRAM_INTRO_VIDEO_PATH`; the original local video is not included. Obtain the approved asset pack separately.

## Evidence

108 tests and root/runtime typechecks passed. Real HTTP flow verified with one model call: invite → separate friend → attribution → proposal → confirmation → simulated purchase → exactly one 100-point reward. Duplicate joins/confirmations/purchases tested. No real bookings, payments or identity verification.
