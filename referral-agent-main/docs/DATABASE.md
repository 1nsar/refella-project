# Database contract

Migration: `supabase/migrations/202609120001_referral_core.sql`. Requires Supabase roles and auth schema. Local-only bootstrap in `tests/database/bootstrap.sql` emulates these for disposable PostgreSQL; never apply that bootstrap to Supabase.

## API

All functions return JSONB and execute only as `service_role`. The server must derive business/customer identity from authenticated channel context and authorize staff confirmations. Possession of the service key bypasses RLS; it must never reach a browser or model.

- `api_create_invite(p_business_id uuid, p_customer_id uuid)` → invite_id, token, campaign_id, version, reward_units, terms. Reusable opaque invite per customer per campaign.
- `api_claim_invite(p_business_id uuid, p_customer_id uuid, p_token text)` → referral_id, status=claimed, referrer_id. One attribution per customer per business; repeat same invite succeeds; changing attribution fails. No claiming after a recorded purchase.
- `api_create_request(p_business_id uuid, p_customer_id uuid, p_service text, p_preferred_time timestamptz, p_request_key text)` → request_id, status, service, preferred_time. This is a request, never confirmation of a booked slot. Same key with changed payload fails.
- `api_cancel_request(p_business_id uuid, p_request_id uuid)` → request_id, status=cancelled. Cannot cancel a purchased request; refunds are not implemented.
- `api_confirm_purchase(p_business_id uuid, p_request_id uuid, p_external_event_id text, p_amount_minor bigint)` → conversion_id, request_id, status=purchased, reward_units, rewarded_customer_id (null without reward).

Purchase confirmation is atomic. A tenant lock serializes events (deliberately simple MVP). Same event/request/amount returns stored identical JSON. Conflicting event reuse fails. First eligible purchase awards fixed units once per referred customer per business; below-threshold purchases are recorded without reward and do not prevent a later eligible purchase for an already claimed referral. Campaign terms, threshold and fixed units are immutable; deactivation prevents new claims but honors previously claimed terms. Units are demo credits, not money or payouts. Customer identity cannot detect the same human using two unrelated channel identities.

## Tables and permissions

`businesses.owner_id` references `auth.users`; owner-only SELECT RLS applies to all tenant tables. `customers` is unique on `(business_id,channel,external_id)`. `campaigns` permits one active version per business. `referral_invites` owns reusable opaque tokens; `referrals` records one claimant each. `booking_requests`, `conversions`, `reward_ledger` separate intent, trusted purchase and reward truth. Composite foreign keys prevent references to other tenants. Server service role can seed/update records; SQL RPC privileges deny anon/authenticated. Owners cannot invoke mutations directly.

Conversion/reward UPDATE and DELETE are blocked by triggers, including service-role operations; service-role TRUNCATE is revoked. Database owners/superusers remain trusted administrators and can change schema. Refunds need explicit reversing entries in a future migration, not edits to history. `supabase/demo-seed.sql` is manual-only synthetic data; supply an existing test auth user via the `demo_owner_id` psql variable. It creates a fixed demo business and campaign and intentionally fails on reuse rather than overwriting existing data.

## Real PostgreSQL checks

`npm run test:db` requires `DATABASE_URL` and `REFERRAL_DB_TEST_CONFIRM=isolated-local-database`. It refuses non-loopback servers, databases not named `referral_test` or `referral_test_SUFFIX`, and databases with existing public/auth tables. Create a new empty disposable database for each run. The runner never drops a database or existing tables.

In a new disposable local database, run these files with `psql -v ON_ERROR_STOP=1` in order:

1. `tests/database/bootstrap.sql`
2. `supabase/migrations/202609120001_referral_core.sql`
3. `tests/database/integration.sql`

The transaction rolls fixtures back. Checks cover repeats, changed payload, cross-tenant requests/customers/tokens, cancellation, self-referral, reward threshold, second purchase, immutable terms, owner read isolation and denied anonymous/owner writes. This does not test real Supabase auth tokens, deployed network APIs, refund handling or identity fraud. Concurrent correctness relies on tenant/customer/request row locks plus unique constraints; load testing is separate.
