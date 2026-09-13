# Engineering dispatch and contracts

Build started 2026-09-12. Private branch `codex/referral-mvp`. No production deployment or public export authorized by this document.

## Ownership

| Engineer | Owned files | Responsibility |
|---|---|---|
| Database | supabase/, tests/database/, docs/DATABASE.md | Tenant constraints, RPC transactions, RLS, actual Postgres checks |
| Backend | src/server/, tests/server/ | Validated services, owner/integration authentication, sanitized errors |
| Workspace UI | public/, docs/UI.md | Owner login, requests, manual purchase confirmation, reward visibility |
| Integrator | runtime/, root config, route tests, runbook | Agent tools, channels, integration, build and end-to-end checks |

Shared worktree. Do not revert someone else's changes. Changes to public interfaces must be communicated before editing consumers. After implementation an engineer reviews code they did not author. Reviewer reports correctness/security blockers, not taste-only rewrites.

KISS: one backend process, static owner workspace, one database. No generic repository hierarchy or speculative adapters. Existing agents use explicit API operations. Native messaging adapter uses verified sender identity. SQL owns transactional eligibility and idempotency; TypeScript owns transport validation and authorization; model owns neither.

First path accepts a booking request, not a confirmed slot. Owner confirms a qualifying paid visit. Bonus units are not a cash payout. No partner cross-sell, payment processing, autonomous marketing or fake live integrations.

## Verification gate

Typecheck, runtime build, HTTP authorization tests, real Postgres checks for cross-tenant access, self-referral, cancellation, duplicate confirmations and immutable rewards. No live/provider verification claims without actual credentials and observed results. Secrets never in git.
