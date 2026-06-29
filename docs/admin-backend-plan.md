# Cairn Admin — Supabase Backend Scoping Plan

> How to turn the front-end Admin Page demo (`/admin`, seed-driven) into a real backend where **Supabase Row-Level Security is the security boundary**, with privileged operations behind server functions, Stripe billing, an immutable audit log, and Realtime. Grounded in the actual project state (verified via the Supabase API on 2026-06-29).

## 1. Current state (verified)

- **Supabase project "Cairn"** — ref `bfrjukznqwxultdkfvlz`, org `dbdrqgdrdgovauuuepij`, region us-east-2, Postgres 17, status **ACTIVE_HEALTHY**.
- **Schema:** only `public.workspaces` exists — `user_id uuid PK → auth.users.id`, `data jsonb`, `updated_at timestamptz`, **RLS enabled**, 0 rows. One migration: `create_workspaces_table`.
- **Auth:** Supabase magic-link (passwordless) wired client-side (`src/lib/auth.tsx`, `SignInModal`). `src/lib/supabase.ts` guards on `isSupabaseConfigured` (client is null when env unset → app runs guest-only).
- **Server functions:** Netlify Functions already used (`netlify/functions/capture.ts` calls Claude). This is the established place for server-side secrets.
- **Admin app today:** 100% front-end. `src/lib/adminStore.ts` (localStorage) holds users, subscriptions, audit, integrations, settings, rolePermissions; `src/lib/adminAuth.ts` is a demo staff-picker gate (NOT a security boundary).

**Implication:** the admin backend is greenfield. Nothing below conflicts with existing data; `workspaces` (tenant data) stays as-is and is referenced, not replaced.

## 2. Goal & guiding principles

1. **RLS is the boundary.** Every table denies by default; admin access is granted only to authenticated users who are platform staff, checked in SQL. The UI's `useCan()` stays for UX, never for security.
2. **Least privilege on the client.** The browser only ever uses the **anon/publishable** key. The **service_role** key lives only in server functions.
3. **Privileged ops run server-side.** Anything that touches `auth.users` (create/invite/suspend), billing, or must be guaranteed-audited goes through a Netlify Function (service role), which writes the audit row in the same transaction.
4. **Demo stays working.** Keep the `isSupabaseConfigured` fork: configured → live backend; unconfigured → current demo store. Ship behind that flag and cut over per-section.

## 3. Architecture

```
Browser (/admin, anon key)
  │  reads  → Supabase REST/Realtime, gated by RLS (admin-only policies)
  │  writes → Netlify Functions (privileged)
  ▼
Netlify Functions (service_role key, server-only)
  - admin-users   : create/invite/suspend/role-change (Supabase Admin API)
  - admin-billing : Stripe calls + plan/seat changes
  - stripe-webhook : Stripe → customer_subscriptions sync
  - all write to audit_logs in the same DB transaction (RPC)
  ▼
Supabase Postgres (RLS) + Auth + Realtime
```

- **Reads** (directories, usage, audit, settings) go directly from the browser via PostgREST, protected by admin-only RLS — fast, and Realtime-capable.
- **Writes** that are sensitive go through Netlify Functions; simple admin-owned writes (e.g. toggling a setting) can be direct if RLS allows the admin role.
- **Why Netlify (not Supabase Edge Functions):** the repo already has the Netlify Functions toolchain, env-var store, and deploy pipeline (`capture.ts`). One pattern, one place for secrets. (Supabase Edge Functions remain a valid alternative if we later want DB-colocated compute.)

## 4. Data model (migrations to add)

New tables in `public` (all RLS-enabled, admin-only policies unless noted). Maps the spec's 8 tables + the demo store's extra state.

| Table | Purpose | Notes |
|---|---|---|
| `profiles` | App user directory mirror of `auth.users` | `id uuid PK → auth.users.id`, email, full_name, workspace_id, plan, status, last_active_at. Populated by a trigger on `auth.users` insert. Admin reads this (not `auth.users` directly). |
| `roles` | Admin role catalog | seed: super_admin, platform_admin, billing_admin, support_admin, auditor |
| `permissions` | Permission catalog | `key` = `action:resource` |
| `role_permissions` | Role → permission grants | editable (powers the matrix) |
| `admin_users` | Who is platform staff + their role | `user_id → auth.users.id`, `role_id → roles.id`. **Membership here = admin access.** |
| `subscription_plans` | Free / Pro / Enterprise + entitlements | seat/project/capture limits, prices, feature flags (jsonb) |
| `customer_subscriptions` | Per-workspace subscription | status, cycle, seats, stripe ids, periods. Synced from Stripe. |
| `usage_records` | Metered usage | metric (seats/projects/captures/tokens), provider enum, quantity, cost, period |
| `audit_logs` | Immutable admin action log | append-only (no UPDATE/DELETE policy); actor_id, action, resource, changes jsonb, ip, created_at |
| `integrations` | Connector status per platform/workspace | provider/tool, status, encrypted cred ref |
| `platform_settings` | Singleton settings row | email/localization/branding toggles |

Conventions: `uuid` PKs (`gen_random_uuid()`), `timestamptz`, `jsonb` for flexible fields, FKs with sensible `on delete`. These mirror `docs/admin-page-spec.md` §Database Schema exactly, plus `profiles`, `integrations`, `platform_settings` for parity with the built UI.

## 5. RBAC enforced in SQL (the core)

SQL helper functions (SECURITY DEFINER, `search_path` pinned):

```sql
-- Is the current user platform staff?
create function public.is_platform_admin() returns boolean ...
  -- exists (select 1 from admin_users where user_id = auth.uid())

-- Does the current user's role grant a permission?
create function public.admin_has(perm text) returns boolean ...
  -- super_admin → always true; else join admin_users→role_permissions
```

Example policies:

```sql
alter table profiles enable row level security;
create policy "admins read profiles" on profiles
  for select using (admin_has('view:users'));
-- writes to profiles/auth happen via service-role function only (no client write policy)

create policy "admins read audit" on audit_logs
  for select using (admin_has('view:audit_logs'));
-- no insert/update/delete policy → only service_role (functions) can write; table is append-only

create policy "manage role perms" on role_permissions
  for all using (admin_has('manage:roles')) with check (admin_has('manage:roles'));
```

This makes the live `useCan()` edits we built map 1:1 to `role_permissions` rows, and gating is then **also** enforced server-side.

## 6. Admin authentication & the /admin gate (replaces the demo picker)

1. Reuse the existing magic-link sign-in (`auth.tsx` / `SignInModal`) for `/admin`.
2. On load, the route guard checks `is_platform_admin()` (a cheap RPC or a `select` on `admin_users`); non-admins are redirected/denied.
3. The signed-in admin's role (from `admin_users.role_id`) drives `useCan()` — same UI as today, real identity underneath.
4. Seed the **first** super admin by inserting an `admin_users` row for the owner's email (see §10).

## 7. Privileged operations (Netlify Functions, service role)

| Function | Does | Audit |
|---|---|---|
| `admin-users` | `auth.admin.createUser` + `inviteUserByEmail`; suspend = `auth.admin.updateUserById({ ban_duration })`; role/plan change → `profiles`/`admin_users` | writes `audit_logs` row in same txn (via RPC `log_action`) |
| `admin-billing` | create/adjust Stripe subscription, seats, promotions | logs |
| `stripe-webhook` | verify signature, upsert `customer_subscriptions` from Stripe events | logs |

Each function: verifies the caller's Supabase JWT, re-checks `admin_has(...)` server-side (defense in depth), performs the action with the service-role client, then logs. Audit writes use a SECURITY DEFINER `log_action()` RPC so the append happens atomically.

## 8. Stripe billing

- Products/prices for **Free / Pro ($25, annual $20) / Enterprise (custom)**; store price IDs in env.
- Checkout/Customer Portal for self-serve; admin-billing function for staff overrides.
- `stripe-webhook` keeps `customer_subscriptions` as the source of truth (status, period, seats); MRR/usage dashboards read from it.
- Usage metering: a scheduled function (or DB job) rolls capture/token counts into `usage_records` with provider cost.

## 9. Realtime & dashboards

- Subscribe to `audit_logs` and `usage_records` (admin-RLS) via Supabase Realtime so the dashboard activity feed and usage update live across admins — replacing the demo store's local emit.

## 10. Front-end migration path (per-section, behind the flag)

1. Add a typed data layer (`src/lib/adminApi.ts`) with the same shape as `adminStore` getters, backed by Supabase queries when `isSupabaseConfigured`, else the demo store. Sections already read via hooks, so swaps are localized.
2. Replace `AdminSignIn` demo picker with the magic-link gate + `is_platform_admin()` check.
3. Move mutations (`createUser`, `setUserStatus`, `setRolePermission`, …) to call Netlify Functions; keep optimistic UI + toasts.
4. Point reads at PostgREST/Realtime; delete the localStorage persistence once parity is confirmed.

## 11. What I need from you to implement

1. **Confirm target project** = `bfrjukznqwxultdkfvlz` ("Cairn"). ✅ (verified active)
2. **Service-role key** set as a **Netlify env var** (server-only) — do NOT paste it in chat; add it in the Netlify dashboard. (Anon key + URL already known.)
3. **First super-admin email** to seed into `admin_users`.
4. **Stripe** (when we reach billing): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and price IDs — also via Netlify env. Test mode first.
5. **Email/SMTP** decision: Supabase's built-in email has a tight free-tier rate limit (magic-link tests hit "email rate limit exceeded"); custom SMTP needed for any volume.
6. **Go-ahead to apply migrations** to the live project (I can run them via the Supabase tools, or hand you SQL to run). I'll start read-only/idempotent and reversible.

## 12. Sequencing (milestones)

1. **Schema & RLS** — migrations for all tables + helper functions + seed roles/permissions + seed first super admin. *(I can apply via Supabase tools on approval.)*
2. **Admin auth gate** — magic-link + `is_platform_admin()` route guard; cut `/admin` over from the demo picker.
3. **Read path** — wire Dashboard / Users / Subscriptions / Security / System to live RLS-protected queries.
4. **Write path** — `admin-users` Netlify Function + atomic audit; wire create/edit/suspend/role-edit; flip those off the demo store.
5. **Stripe** — products, `admin-billing` + `stripe-webhook`, billing UI.
6. **Realtime + usage metering** — live audit/usage; scheduled rollups.
7. **Hardening** — security review, rate limits, idempotency keys, remove demo fallback for admin, add a "production" banner removal.

## 13. Risks & decisions to confirm

- **Modeling customer users:** introduce `profiles` (admin-RLS, trigger-populated) rather than querying `auth.users` from the client. *(Recommended; assumed above.)*
- **Server compute:** Netlify Functions (recommended, matches repo) vs Supabase Edge Functions.
- **Cost/limits:** Supabase free tier + Stripe test→live; the org currently runs Cairn + Trine.
- **Security review** before `/admin` is exposed without the demo banner.
- **Data:** `workspaces` stays the tenant store; admin reads aggregate from `profiles`/`customer_subscriptions`, not by parsing the workspace jsonb.

---

*Estimate: Milestones 1–4 (schema + RLS + admin auth + read/write parity for Users/Security) are the meaningful "real backend" cut and are the recommended first slice. Billing (5) and Realtime/metering (6) follow.*
