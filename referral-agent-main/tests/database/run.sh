#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to a fresh local database named referral_test or referral_test_SUFFIX}"
if [[ "${REFERRAL_DB_TEST_CONFIRM:-}" != "isolated-local-database" ]]; then
  echo 'Set REFERRAL_DB_TEST_CONFIRM=isolated-local-database. This runner installs test auth scaffolding and the schema.' >&2
  exit 1
fi

# Inspect the actual server, not a potentially misleading connection URL.
target_info=$(psql "$DATABASE_URL" -X -A -t -F '|' -v ON_ERROR_STOP=1 -c "select current_database(), coalesce(host(inet_server_addr()), 'unix'), (select count(*) from information_schema.tables where table_schema in ('public','auth'))")
IFS='|' read -r target_database target_address target_tables <<< "$target_info"
if [[ ! "$target_database" =~ ^referral_test(_[A-Za-z0-9]+)?$ ]] ||
   [[ "$target_address" != "127.0.0.1" && "$target_address" != "::1" && "$target_address" != "unix" ]] ||
   [[ "$target_tables" != "0" ]]; then
  echo 'Refusing: requires an empty local referral_test[_SUFFIX] database. No schema was changed.' >&2
  exit 1
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
project_dir=$(cd -- "$script_dir/../.." && pwd)
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f "$script_dir/bootstrap.sql" \
  -f "$project_dir/supabase/migrations/202609120001_referral_core.sql" \
  -f "$script_dir/integration.sql"
echo 'Database tests passed. Test schema remains in the explicitly selected disposable database; fixture rows rolled back.'
