# Database tests

`supabase/tests/run.sh` starts a throwaway local Postgres, replays every migration in `supabase/migrations/` on top of `supabase-stub.sql` (the roles, `auth.users`, `auth.uid()` and `auth.jwt()` that Supabase provides), and runs each `*.test.sql`. Nothing touches sdc-dev.

```sh
brew install postgresql@17   # once; puts initdb, pg_ctl and psql on PATH
supabase/tests/run.sh        # all tests
supabase/tests/run.sh supabase/tests/referrals.test.sql
```

A test file raises on the first failed check (`t.eq(label, got, want)`) and ends by printing `ALL ... TESTS PASSED`. Use `set role anon` / `reset role` to call functions as the public, the way the app's pages do.

Not in CI yet.
