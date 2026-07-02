# Migrations

Mirror of the live Cairn Supabase project's migration history (`supabase_migrations.schema_migrations`), so the schema is reviewable and reproducible from the repo.

Notes:
- `0001_workspaces.sql` predates the timestamped convention; it corresponds to the applied migration `20260620045105_create_workspaces_table`.
- `20260629*` / `20260702*` — the admin backend (RBAC, billing/usage, audit, profiles + bootstrap trigger, hardening, integrations seed, audit triggers). Applied to the live project via the Supabase API at those timestamps.
- `20260630*` — free-tier keepalive (pg_cron/pg_net + ping log), added outside this repo's workflow; included for parity.
- `20260629035458_seed_admin_data.sql`: the live bootstrap-admin email is **redacted** (public repo). New environments must insert their own row into `public.admin_bootstrap` before first sign-in.
- These files are a record, not a pipeline: applying them to a fresh project via `supabase db push`/CLI should work top-to-bottom, but the live project is the source of truth.
