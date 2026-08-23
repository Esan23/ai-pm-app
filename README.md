# AI-Native Project Management Platform

> The system of record for AI projects — track what every model and tool actually shipped, from user story to deployed agent.

A project management application purpose-built for the **AI-product lifecycle** (web app → autonomous agent), with a portfolio → project → user story → task hierarchy, AI-assisted user-story generation, a Kanban execution surface, Azure DevOps pipeline sync, and **provider-agnostic attribution** of work produced by Copilot, ChatGPT, Gemini, and Claude.

**Stack (planned):** React front end · backend + integration layer TBD (ADO / LLM providers via MCP).

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

Sections: hero (with a "scattered context → one legible plan" animation), the daily-tax problem, how it works (capture → deconstruct → track → next), features (incl. provider-agnostic AI attribution + Azure DevOps sync), social proof, pricing (Free / Pro / Enterprise), and a final CTA. The sign-up flow is front-end-only (simulated) — wire it to real auth / a waitlist before launch.

## App Workspace (`/app`)

A working MVP of the product, reachable from the landing "Open app" / "Start free" CTAs and code-split into its own bundle:

- **Portfolio → Project → User Story → Task** hierarchy with a project sidebar.
- **Execution board** — a drag-and-drop Kanban (To do / In progress / Done) where every task carries **provider attribution** (Human / Claude / ChatGPT / Copilot / Gemini), the product's core differentiator. An **AI attribution** panel summarizes who/what shipped the work.
- **Capture** — describe what you're building and Cairn deconstructs it into user stories + tasks. A **Netlify function** (`netlify/functions/capture.ts`) calls **Claude (`claude-opus-4-8`, forced tool-use for structured JSON)** to produce the backlog; the client (`src/lib/capture.ts`) calls it and **gracefully falls back to a local heuristic** when the function is unreachable (plain `vite dev`) or runs in demo mode (no `ANTHROPIC_API_KEY`). The preview labels each result "via Claude" or "demo heuristic". Set `ANTHROPIC_API_KEY` in the Netlify dashboard to enable the real model.
- **Editable in place** — task titles rename inline, tasks can be linked to (or detached from) a user story straight from the card, and stories are editable/deletable (deleting a story keeps its tasks). Story progress therefore counts every task, not just the ones Capture generated.
- **Starts empty.** A new workspace opens on a "Track your first project" state; the demo portfolio is opt-in ("explore with demo data") rather than seeded, so nobody has to delete fictional data before tracking their own.
- Runs entirely in **guest mode**, persisted to `localStorage` (`src/lib/store.ts`), so it's demoable with no backend.

Routing is `react-router-dom` v7: `/` (landing), `/app` (workspace), `/auth/callback` (magic-link return) — all lazy-loaded.

## Auth + cloud persistence (Supabase)

Optional and **off by default** — the app is fully usable as a guest. When `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set, the workspace syncs to a signed-in account:

- **Magic-link auth** (`src/lib/auth.tsx`, `src/lib/supabase.ts`) — passwordless email sign-in via `signInWithOtp`. The header shows "Sign in" / the signed-in email; unconfigured builds show the guest badge and no sign-in.
- **Per-user persistence, one row at a time** — the workspace lives in real `portfolios` / `projects` / `stories` / `tasks` tables (schema, RLS, and the JSONB back-fill in `supabase/migrations/20260822143000_normalized_workspace.sql`). `src/lib/remote.ts` maps rows to domain objects; `src/lib/store.ts` applies every mutation optimistically to local state and enqueues a **single-row** write.

  This replaced a whole-workspace JSONB blob that was rewritten on an 800 ms debounce, which made concurrent edits last-write-wins — a second tab or device silently erased the first. Writes are now serialized through one promise chain (so a child never reaches the server before its parent), inbound **realtime** events merge remote changes in, and a failed write surfaces in the header and re-syncs from the server instead of being swallowed.
- **Honest save state** — the header shows Guest / Loading / Saving / Saved / Not saved (with retry), backed by `useSyncState()`.
- **Migration on sign-in** — a guest workspace is pushed up on first sign-in; a cache belonging to the signed-in account is replaced by server state; a cache belonging to a different account is discarded on sign-out, so one person's work never lands in the next person's browser. Supabase is code-split into its own chunk, so the landing bundle is unaffected.

**To enable (one-time):** create a Supabase project → run the migrations in `supabase/migrations/` → in Netlify set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the publishable/anon key) → in Supabase **Authentication → URL Configuration**, set the Site URL and add `https://cairnpmai.netlify.app/auth/callback` (and `http://localhost:5180/auth/callback` for local) to the redirect allow-list.

**Deploy:** `netlify.toml` is configured (`npm run build` → publish `dist/`, SPA fallback, asset caching). Connect the repo to Netlify or drag-drop `dist/`.

## Repository Structure

```
.
├── README.md                          # This file
├── LICENSE
├── .gitignore
├── index.html · vite.config.ts · tailwind.config.js · netlify.toml
├── src/
│   ├── App.tsx · main.tsx · index.css
│   ├── hooks/useTheme.ts
│   └── components/                     # Navbar, Hero, Problem, HowItWorks, Features,
│       │                              # SocialProof, Pricing, FinalCTA, Footer, SignUpModal…
│       └── ContextCollapseVisual.tsx   # signature hero animation
└── docs/
    └── research/
        ├── avatar-problem-aware.md     # Problem-Aware customer avatar (Schwartz framework)
        ├── diary-problem-aware.md      # Persona-voice diary: before / during / after product use
        └── competitive-teardown.md     # MECE competitive analysis + whitespace map
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

**Phase: Research & Discovery** — customer and market research complete; product spec and architecture pending.

### Roadmap (stub)
- [x] Problem-Aware customer avatar
- [x] Competitive teardown + whitespace analysis
- [x] Persona-voice diary (messaging input)
- [ ] Remaining awareness-stage avatars (Schwartz set)
- [ ] Product spec / PRD (feature set, MoSCoW scope)
- [ ] Data model (hierarchy + provider-attribution schema)
- [x] Marketing landing page (Vite + React + Tailwind)
- [x] App MVP scaffold — /app workspace (hierarchy, Kanban, AI capture, attribution) in guest mode
- [x] Server-side LLM capture (Claude via a Netlify function, demo fallback)
- [x] Auth + cloud persistence code (Supabase magic-link + per-user workspace; guest fallback) — needs a project + env vars to activate
- [x] **Phase 0 — trustworthy persistence**: normalized schema + RLS + realtime, row-level writes (no more last-write-wins), visible sync state, empty first-run with opt-in demo, inline task/story editing, Kanban tasks linked to stories
- [ ] **Phase 1 — trackable**: `due_date` / `completed_at` / assignee on tasks, project target date + % complete, an `activity` log behind a "what changed this week" view, filters
- [ ] **Phase 2 — shareable**: team membership + invites + roles (replacing the per-user RLS predicate), status-report export
- [ ] Azure DevOps + MCP integration spike
- [ ] Billing (Pricing currently advertises plans with no checkout; the landing sign-up modal is still simulated)

---

*Research assets reflect persona modeling and market analysis; placeholder metrics and archetypal selections are flagged inline and must be replaced with sourced data before external use.*
