#!/usr/bin/env bash
# Replays every migration on a throwaway local Postgres, then runs each *.test.sql against it.
# Needs Postgres 15+ binaries (initdb, pg_ctl, psql) on PATH, e.g. `brew install postgresql@17`.
# Usage: supabase/tests/run.sh [test file...]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
data=$(mktemp -d)
port=${PGTEST_PORT:-54329}
export PGHOST=127.0.0.1 PGPORT=$port PGUSER=postgres

initdb -D "$data" -U postgres -A trust >/dev/null
pg_ctl -D "$data" -o "-p $port -k '' -c listen_addresses=127.0.0.1" -l "$data/log" -w start >/dev/null
trap 'pg_ctl -D "$data" -m immediate stop >/dev/null; rm -rf "$data"' EXIT

run() { psql -q -v ON_ERROR_STOP=1 -d "$1" -f "$2" >/dev/null 2>"$data/err" || { echo "FAILED: $2"; cat "$data/err"; exit 1; }; }

tests=("$@")
[ ${#tests[@]} -eq 0 ] && tests=("$here"/*.test.sql)
for t in "${tests[@]}"; do
  psql -q -c "set client_min_messages = warning" -c "drop database if exists sdc_test" -c "create database sdc_test" >/dev/null
  run sdc_test "$here/supabase-stub.sql"
  for m in "$root"/supabase/migrations/*.sql; do run sdc_test "$m"; done
  echo "$(basename "$t")"
  if psql -q -v ON_ERROR_STOP=1 -d sdc_test -f "$t" >"$data/out" 2>&1; then
    grep -E "NOTICE:  ok|PASSED" "$data/out" | sed 's/.*NOTICE:  /  /'
  else
    grep -E "NOTICE:  ok" "$data/out" | sed 's/.*NOTICE:  /  /'
    grep -E "ERROR" "$data/out"
    exit 1
  fi
done
