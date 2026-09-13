# Owner workspace

Static files: `public/app.html`, `public/app.css`, `public/app.js`. Serve `/app` as `app.html`, `/assets/style` as `app.css`, and `/assets/script` as `app.js` same-origin. The extensionless asset routes avoid the runtime bundler interpreting a route name as CSS source. No build, external fonts, client SDK, API keys, or fixture backend.

The workspace uses the approved referral lifecycle. Requests are not bookings. Only authorized staff confirm a purchase; the backend computes rewards. Bonus units are distinct from tenge. The UI never labels attributed purchase totals as incremental revenue.

## Design

White `#ffffff` canvas, navy `#183247` text, muted `#526675`, teal `#08756e` actions, pale `#f3f7f8` review panel, red `#a12636` errors. System font with native Cyrillic. Left-aligned request register beside a purchase-review panel; separate purchase and reward histories below. This is an operational workspace, not a landing page. No decorative metrics, gradients, animation, or fabricated activity. Mobile layout moves the action panel below the register; tables scroll within their containers.

## API

- POST `/api/login` `{email,password}` → `{accessToken,businesses:[{id,name}]}`. Token and accessible business list live in sessionStorage, never localStorage. Every subsequent request carries Bearer token.
- GET `/api/dashboard?businessId=...` → campaign, requests, conversions, rewards. Campaign fields: string `terms`, `reward_units`, `min_purchase_minor`. Rewards: `reward_units`. `limit` is displayed when provided. Missing conversion data is explicitly labelled unavailable, not zero.
- Request actions are available only for `requested`. `purchased` and `cancelled` display read-only. Unknown statuses are read-only.
- POST `/api/confirm` `{businessId,requestId,eventId,amountMinor}`. Decimal input is validated and converted without floating-point fraction multiplication. Stable UUID plus amount is persisted per business/request for retries; an uncertain result cannot silently be retried with another amount. Backend must enforce tenant authorization, idempotency, request eligibility, and reward rules.
- POST `/api/cancel` `{businessId,requestId}` after explicit owner confirmation.
- Mutations reload authoritative dashboard data. No optimistic purchases/rewards. Errors display text only. Fetched data is inserted with textContent, not HTML.
- Test label is shown only for server boolean `testMode`.

## Verification checklist

- Login failure, successful login, account with no business, expired token, logout, reload in same tab.
- Owner A cannot fetch or mutate owner B's business even after browser changes (server security test).
- Empty lists and missing conversion data; long Cyrillic names; untrusted HTML strings render as text.
- Requested→purchased and requested→cancelled; unknown/non-pending status has no controls.
- Confirm requires checked payment verification and positive amount; reject negatives, exponent notation, third decimal, unsafe integers. Accept `5000`, `5000,50`, `5000.50`.
- Network failure then repeat preserves eventId and amount; double click disabled; server emits one conversion/reward.
- Changing business during pending request cannot mix results; buttons disabled during mutation.
- Keyboard tab/focus, associated form labels, live error region, horizontal table scroll at 375px, readable desktop at 1440px.

No live owner authentication or database mutation was performed by the UI worker. Runtime verification requires the integrated server and authorized test credentials.

## Observed browser check — 2026-09-12

Real runtime at `http://localhost:3017/app`: login view loaded with extensionless CSS/JS routes. A deliberately synthetic email (`example.invalid`) and password returned the actual `storage_not_configured` response, displayed in Russian; the login button re-enabled. Browser console contained no captured warnings/errors. Desktop and a requested 375×812 mobile viewport were inspected. At the browser's effective CSS width of 341px, document scroll width equalled client width (no horizontal page overflow). Temporary viewport override was reset and synthetic input cleared. Screenshots were inspected inline, not persisted to files. Authenticated dashboard, purchase confirmation, and cancellation remain unverified in a browser until a test database/account is configured.
