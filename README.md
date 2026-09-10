# AI-Native Project Management Platform

> The system of record for AI projects — track what every model and tool actually shipped, from user story to deployed agent.

A project management application purpose-built for the **AI-product lifecycle** (web app → autonomous agent), with a portfolio → project → user story → task hierarchy, assisted user-story capture, a Kanban execution surface, **read-only Azure DevOps work-item import**, and **provider-agnostic attribution** of work produced by Copilot, ChatGPT, Gemini, and Claude.

*Pipeline sync and two-way Azure DevOps sync are on the roadmap, not shipped — see [Status](#status).*

**Live at [cairnpmai.netlify.app](https://cairnpmai.netlify.app/)** · Vite + React 18 + TypeScript + Tailwind · Supabase (Postgres, RLS, realtime, magic-link auth) · Netlify Functions · deployed from `main` on every merge.

---

## Why This Exists

Market research (June 2026) confirms that *agentic PM* is now commoditized across Jira, Linear, ClickUp, Monday, and Notion. **No incumbent** combines, in one system:

1. An enforced portfolio → project → story → task hierarchy
2. Multi-provider AI attribution (which model/tool produced which artifact, with cost/token visibility)
3. Azure DevOps pipeline / work-item sync
4. Templates built for how AI work actually moves (experimentation, RAG eval, agent orchestration, deployment)

Azure DevOps + Copilot is the closest overlap but is locked to the Microsoft/GitHub ecosystem. That gap is the product thesis. See [`docs/research/competitive-teardown.md`](docs/research/competitive-teardown.md).

---

## Marketing Landing Page

A front-end marketing site for Cairn lives at the repo root, built with **Vite + React 18 + TypeScript + Tailwind CSS** (self-hosted Inter + Sora fonts, Framer Motion, Heroicons, light/dark mode). Copy is grounded in the Problem-Aware avatar (Daniel Okafor) and the product concept.

```bash
npm install
npm run dev      # local dev server (Vite)
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build
```

Sections: hero (with a "scattered context → one legible plan" animation), the daily-tax problem, how it works (capture → deconstruct → track → next), features (incl. provider-agnostic AI attribution + Azure DevOps sync), social proof, pricing (Free / Pro / Enterprise), and a final CTA. The sign-up CTA sends a real magic link when Supabase is configured (`SignUpModal` calls `signInWithOtp`); it only simulates success in an unconfigured build.

## App Workspace (`/app`)

A working MVP of the product, reachable from the landing "Open app" / "Start free" CTAs and code-split into its own bundle:

- **Portfolio → Project → User Story → Task** hierarchy with a project sidebar.
- **Execution board** — a drag-and-drop Kanban (To do / In progress / Done) where every task carries **provider attribution** (Human / Claude / ChatGPT / Copilot / Gemini), the product's core differentiator. An **AI attribution** panel summarizes who/what shipped the work.
- **Capture** — describe what you're building and Cairn deconstructs it into user stories + tasks. A **Netlify function** (`netlify/functions/capture.ts`) calls **Claude (`claude-opus-4-8`, forced tool-use for structured JSON)** to produce the backlog; the client (`src/lib/capture.ts`) calls it and **gracefully falls back to a local heuristic** when the function is unreachable (plain `vite dev`) or runs in demo mode (no `ANTHROPIC_API_KEY`). The preview labels each result "via Claude" or "demo heuristic". Set `ANTHROPIC_API_KEY` in the Netlify dashboard to enable the real model.
- **Editable in place** — task titles rename inline, tasks can be linked to (or detached from) a user story straight from the card, and stories are editable/deletable (deleting a story keeps its tasks). Story progress therefore counts every task, not just the ones Capture generated. A **task detail panel** (the expand icon on a card) holds status, owner, due date, attribution, story link, and the created/completed stamps.
- **Progress tracking** — tasks carry a **due date**, an **owner**, and a **completion timestamp** (set when a task enters Done, cleared when it leaves — enforced by a database trigger as well as the client, so status and `completed_at` cannot drift). Cards show due-date chips that go amber today and red once overdue; the project header shows **percent complete, N of M done, an overdue count, and an editable target date**.
- **Activity feed** — every mutation writes an `activity_events` row, so the right rail answers **"what changed this week"** (grouped by day, with a Show-all toggle). A multi-field save reads as one line — `Done → In progress · assigned to Ana` — rather than five. Written client-side, so guest mode keeps a history too.
- **Board filters** — search, owner, attribution, and due-date (overdue / due within 7 days / no due date), with a match count. Filters narrow the board only; the story rollups and attribution mix always summarize the whole project.
- **Starts empty.** A new workspace opens on a "Track your first project" state; the demo portfolio is opt-in ("explore with demo data") rather than seeded, so nobody has to delete fictional data before tracking their own.
- **Send feedback** — a button in the app header opens a one-field form, available to **guests as well as signed-in users**: the people who haven't signed up yet are exactly the ones whose first impression is worth hearing. The route, team and viewport are attached automatically so nobody has to ask "which screen?". Stored in `public.feedback`, append-only (no update or delete policy at any role), readable only by platform admins.
- Runs entirely in **guest mode**, persisted to `localStorage` (`src/lib/store.ts`), so it's demoable with no backend.

Routing is `react-router-dom` v7: `/` (landing), `/app` (workspace), `/auth/callback` (magic-link return) — all lazy-loaded.

## Auth + cloud persistence (Supabase)

Optional and **off by default** — the app is fully usable as a guest. When `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set, the workspace syncs to a signed-in account:

- **Magic-link auth** (`src/lib/auth.tsx`, `src/lib/supabase.ts`) — passwordless email sign-in via `signInWithOtp`. The header shows "Sign in" / the signed-in email; unconfigured builds show the guest badge and no sign-in.
- **Per-user persistence, one row at a time** — the workspace lives in real `portfolios` / `projects` / `stories` / `tasks` tables (schema, RLS, and the JSONB back-fill in `supabase/migrations/20260823022606_normalized_workspace.sql`). `src/lib/remote.ts` maps rows to domain objects; `src/lib/store.ts` applies every mutation optimistically to local state and enqueues a **single-row** write.

  This replaced a whole-workspace JSONB blob that was rewritten on an 800 ms debounce, which made concurrent edits last-write-wins — a second tab or device silently erased the first. Writes are now serialized through one promise chain (so a child never reaches the server before its parent), inbound **realtime** events merge remote changes in, and a failed write surfaces in the header and re-syncs from the server instead of being swallowed.
- **Honest save state** — the header shows Guest / Loading / Saving / Saved / Not saved (with retry), backed by `useSyncState()`.
- **Migration on sign-in** — a guest workspace is pushed up on first sign-in; a cache belonging to the signed-in account is replaced by server state; a cache belonging to a different account is discarded on sign-out, so one person's work never lands in the next person's browser. Supabase is code-split into its own chunk, so the landing bundle is unaffected.

### Teams (Phase 2)

Work belongs to a **team**, not a person. `user_id` survives on every content row as "created by"; `team_id` is what RLS checks.

- **Roles** — `owner` (everything, including deleting the team), `admin` (edit + manage members), `member` (edit content), `viewer` (read-only). The UI hides what your role can't do; RLS enforces it independently, so a viewer who calls an update anyway gets zero rows back.
- **Invites** — an admin invites an email address and gets a link to send. Redeeming goes through `accept_team_invite(token)`, which checks the token **and** that it was issued to the caller's own address, so a forwarded link does nothing. Email delivery isn't wired up yet.
- **Safety rails in the database, not just the UI** — a trigger refuses to remove or demote a team's last owner, and `activity_events` still has no update or delete policy at any role.
- **Realtime is keyed on team**, so a teammate's edit arrives; the Phase 1 filter (`user_id`) would have ignored every change made by anyone else.
- Teammate names and emails come from `public.profiles` through one narrow additive policy: you can read a profile only if you already share a team with that person.

### Status report

The **Status report** button on the board renders a Markdown summary over a 7/14/30-day window — percent complete, what shipped, what's in flight, what's overdue, what's due next, story rollups, the attribution mix for the window, and derived risks — with copy and download. It's a pure function over the data (`src/lib/report.ts`): no model call, nothing to hallucinate. An AI-written narrative on top is a natural follow-up.

**To enable (one-time):** create a Supabase project → run the migrations in `supabase/migrations/` → in Netlify set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the publishable/anon key) → in Supabase **Authentication → URL Configuration**, set the Site URL and add `https://cairnpmai.netlify.app/auth/callback` (and `http://localhost:5180/auth/callback` for local) to the redirect allow-list.

**Deploy:** `netlify.toml` is configured (`npm run build` → publish `dist/`, SPA fallback, asset caching). Connect the repo to Netlify or drag-drop `dist/`.

## Repository Structure

```
.
├── index.html · vite.config.ts · tailwind.config.js · netlify.toml
├── src/
│   ├── pages/          LandingPage · AppPage · AdminPage · AuthCallback
│   ├── components/     landing sections (Hero, Pricing, Features…)
│   │   ├── app/        the workspace: KanbanBoard, TaskDetail, StoryList,
│   │   │               ProjectHeader, ActivityFeed, BoardFilters, TeamPanel,
│   │   │               StatusReport, AdoImportModal, SyncStatus, fallbacks
│   │   ├── admin/      admin console sections
│   │   └── ui/         Toast · ConfirmDialog · Pagination
│   ├── lib/            store.ts (workspace state + write queue)
│   │                   remote.ts (row ↔ domain, realtime)
│   │                   teams.ts · auth.ts · types.ts · dates.ts
│   │                   report.ts (status report) · adoImport.ts
│   │                   capture.ts · seed.ts · admin*.ts
│   └── hooks/          useTheme · useModal
├── netlify/functions/  capture.ts · ado-import.ts · admin-users.ts
├── supabase/migrations/  applied schema, mirrored from the live database
├── scripts/            ado-import-spike.mjs · generate-og.mjs
└── docs/
    ├── ado-integration-spike.md    Azure DevOps feasibility + mapping
    ├── admin-page-spec.md · admin-backend-plan.md
    ├── brand-design-system.md · landing-b2c-spec.md
    └── research/       avatar · diary · competitive teardown
```

---

## Research Foundation

| Document | Purpose |
|---|---|
| [Problem-Aware Avatar](docs/research/avatar-problem-aware.md) | Target buyer profile, language, fears, and triggers (Eugene Schwartz market-awareness framework). |
| [Problem-Aware Diary](docs/research/diary-problem-aware.md) | First-person persona narrative across the product journey — source for VOC copy and messaging. |
| [Competitive Teardown](docs/research/competitive-teardown.md) | Scored feature matrix of 7 incumbents/adjacents; whitespace map; positioning and SWOT. |

---

## Status

**Shipped and running in production.** Three phases are live, each deployed from `main` and verified against the live database:

| Phase | What it fixed |
|---|---|
| **0 — trustworthy persistence** | The workspace was one JSONB blob per user, rewritten on a debounce with no conflict check, so a second tab silently erased the first. Replaced with normalized tables, RLS, realtime, and single-row writes through a serialized queue. |
| **1 — trackable** | A task had a status and a created date and nothing else, so no time-based question could be answered. Added due dates, owners, completion timestamps, project targets, an activity log, and board filters. |
| **2 — shareable** | Access was `auth.uid() = user_id` — single-player. Replaced everywhere with team membership and roles (owner / admin / member / viewer), invite links, and a Markdown status report. |

Plus an [Azure DevOps integration spike](docs/ado-integration-spike.md) and the read-only import it recommended.

**Verified, not assumed.** Role restrictions, the completion-timestamp trigger, the append-only activity log, and cross-user isolation were each proven by SQL impersonation against the live database; the workspace paths were exercised in a browser. Four defects were found and fixed this way, two of them in production.

**Known gaps, stated plainly:**

- `ANTHROPIC_API_KEY` is not set, so **Capture runs its local heuristic rather than Claude**. The UI labels every result "via Claude" or "demo heuristic", so nothing is misrepresented to a user.
- **Invite emails are not sent** — an admin copies the link and sends it.
- Billing is advertised on the pricing page but **no checkout exists**; everyone has full access free.
- Five Phase 2 behaviours still need a second account to verify end to end (invite round trip, forwarded-link refusal, viewer read-only, live demotion, last-owner protection).

### Roadmap
- [x] Problem-Aware customer avatar
- [x] Competitive teardown + whitespace analysis
- [x] Persona-voice diary (messaging input)
- [ ] Remaining awareness-stage avatars (Schwartz set)
- [ ] Product spec / PRD (feature set, MoSCoW scope)
- [x] Data model (hierarchy + provider-attribution schema) — built across Phases 0–2; see `supabase/migrations/`
- [x] Marketing landing page (Vite + React + Tailwind)
- [x] App MVP scaffold — /app workspace (hierarchy, Kanban, AI capture, attribution) in guest mode
- [x] Server-side LLM capture (Claude via a Netlify function, demo fallback)
- [x] Auth + cloud persistence code (Supabase magic-link + per-user workspace; guest fallback) — needs a project + env vars to activate
- [x] **Phase 0 — trustworthy persistence**: normalized schema + RLS + realtime, row-level writes (no more last-write-wins), visible sync state, empty first-run with opt-in demo, inline task/story editing, Kanban tasks linked to stories
- [x] **Phase 1 — trackable**: `due_date` / `completed_at` / assignee on tasks, project target date + % complete, an `activity_events` log behind a "what changed this week" view, board filters
- [x] **Phase 2 — shareable**: teams, membership, roles (owner/admin/member/viewer) replacing the per-user RLS predicate, invite links, and Markdown status-report export
- [x] **Azure DevOps integration spike** — [`docs/ado-integration-spike.md`](docs/ado-integration-spike.md); feasible, validated against the live REST API. Recommended next slice is a read-only import (~1 day, no Entra needed); two-way sync is gated on a Microsoft Entra app registration
- [x] **Azure DevOps read-only import** (spike slice A) — paste org/project/PAT, preview, import; re-importing refreshes in place rather than duplicating; no Entra registration required
- [ ] Azure DevOps two-way sync — gated on a Microsoft Entra app registration
- [ ] Invite email delivery (needs SMTP; a free tier covers beta volume)
- [ ] Billing — the pricing page advertises plans with no checkout

---

*Research assets reflect persona modeling and market analysis; placeholder metrics and archetypal selections are flagged inline and must be replaced with sourced data before external use.*
