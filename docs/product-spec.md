# Cairn — product spec

**Status:** living document · **Date:** 2026-09-13 · **Release in scope:** Beta 1 — first users who are not me

Written after three phases shipped rather than before, so it describes a product that exists. Everything in §6 is running in production at [cairnpmai.netlify.app](https://cairnpmai.netlify.app/) and can be checked against [`supabase/migrations/`](../supabase/migrations/) and the README's Status section. Everything in §5 that is not marked *shipped* is a claim about the future and should be read as one.

Companion documents: [competitive teardown](research/competitive-teardown.md) (why this product), [problem-aware avatar](research/avatar-problem-aware.md) (for whom), [Azure DevOps spike](ado-integration-spike.md) (the integration argument), [admin page spec](admin-page-spec.md) (the operator surface).

---

## 1. What Cairn is

**The system of record for AI projects — track what every model and tool actually shipped, from user story to deployed agent.**

A project management application for teams whose work is produced partly by humans and partly by Claude, ChatGPT, Copilot and Gemini. It enforces a portfolio → project → user story → task hierarchy, attributes every task to whoever or whatever produced it, and keeps that ledger current as work moves.

It is **not** another agentic PM tool. Agents are commoditized — every incumbent shipped them in 2026, so competing there is competing on table stakes. Cairn consumes agents as *inputs* and keeps the ledger they do not.

## 2. Who it is for

| | |
|---|---|
| **Primary user** | Head of AI Engineering / senior engineering manager at a Series B-ish company, shipping AI features under board-level attention. See [Daniel Okafor](research/avatar-problem-aware.md). |
| **Awareness stage** | **Problem aware.** He feels the chaos daily but does not yet believe a purpose-built tool exists. He is searching for *why it hurts*, not shopping for *what fixes it*. Copy and onboarding must name the pain before naming the product. |
| **Buying context** | Team SaaS, target ~$25/user/month when billing exists. Today: free (§5, W1). |
| **Also a user** | The solo builder running several AI projects alone — the guest-mode path exists for exactly this person, who will not sign up to evaluate anything. |
| **Not the user** | General cross-functional PMO teams (Monday, Jira own that), pure engineering issue-tracking with no portfolio layer (Linear owns that), and anyone whose work has no AI in it at all — the attribution ledger is the product, and for them it is an empty column. |

## 3. The problem

Three symptoms, in the user's own words from the [diary](research/diary-problem-aware.md):

1. **Projects drift quietly.** Work sprawls across experiments and dead ends; nobody can answer "what is the status of everything" until something has already stalled.
2. **Context is scattered.** The truth lives in Slack threads, four chat tabs, a stale board, and his own head. He becomes the human source of truth and rebuilds the picture every morning.
3. **No AI ground truth.** Four providers produce output and nothing records which one produced what, or whether it landed back in the plan.

The first two are what every PM tool claims to fix. The third is the one no incumbent addresses, and it is the reason to build.

> The supporting market figures on the landing page ("1 in 3 AI initiatives stall", "9+ hrs per week") are labelled *illustrative* on the page itself and are persona modelling, not sourced research. They must not be used in any external pitch without sourcing.

## 4. Principles

These are not aspirations; each one settled a real argument during Phases 0–2, and each is enforced somewhere in the code.

1. **Never claim a state you do not know.** The header says "Checking session…" until auth resolves rather than "Sign in", because telling a signed-in user they are signed out costs them a magic link they never needed. The same rule produced the workspace loading state and the view-only badge. Three defects came from breaking it.
2. **The hierarchy is enforced, not suggested.** A task belongs to a story belongs to a project belongs to a portfolio. Flexible hierarchies become graveyards.
3. **Attribution is per work item and provider-agnostic.** Human, Claude, ChatGPT, Copilot, Gemini — the same field, no primary provider, no ecosystem lock.
4. **Guest mode is first class.** The whole product works with no account, in `localStorage`. The people worth hearing from are the ones who have not signed up.
5. **Append-only where trust matters.** The activity log and the feedback table have no update or delete policy at any role. A history anyone can tidy is worth less than one nobody can.
6. **Verify against the live database, not the DDL.** Every access guarantee is proven by impersonating the role in SQL and trying the thing that should fail. A Phase 2 test suite that inserted as `postgres` missed a production bug, because RLS does not apply to the owner.
7. **Say what is not built.** The pricing page carries the gap list next to the feature list. Nobody should discover a missing feature by being disappointed by it.

## 5. Scope — MoSCoW

Release in scope is **Beta 1: the product is usable, honestly described, and a second human can be invited into it.** Requirement IDs are stable; status is as of this date.

### Must have

| ID | Requirement | Status |
|---|---|---|
| M1 | Work survives a second tab, a refresh, and another device — row-level writes, no last-write-wins | **Shipped** (Phase 0) |
| M2 | Portfolio → project → story → task, editable in place, on a Kanban board | **Shipped** |
| M3 | Every task carries provider attribution, summarized per project | **Shipped** |
| M4 | Time-based questions are answerable: due dates, owners, completion stamps, % complete, overdue counts | **Shipped** (Phase 1) |
| M5 | A workspace can be shared with roles (owner / admin / member / viewer) enforced in the database | **Shipped** (Phase 2) |
| M6 | Returning users sign in without an email round trip | **Shipped** — OAuth appears for whichever provider is enabled; none is enabled yet (§10, D2) |
| M7 | Marketing describes the product that exists | **Shipped** (story 147) |
| M8 | Users can send feedback, and it can be read inside the product | **Shipped** (story 146) |
| M9 | The invite round trip is proven end to end with a second account | **Open** — task 128; the last thing blocking Epic 85 |
| M10 | Invitations reach people by email rather than by a copied link | **Open** — story 144; needs an SMTP provider (§10, D1) |

### Should have

| ID | Requirement | Status |
|---|---|---|
| S1 | Capture produces a backlog using Claude rather than the local heuristic | **Open** — needs a funded `ANTHROPIC_API_KEY` (§10, D3). The UI labels which one ran, so nothing is misrepresented meanwhile. |
| S2 | Two-way Azure DevOps sync — work items round-trip, with optimistic concurrency | **Open** — proven feasible in the [spike](ado-integration-spike.md); blocked on a Microsoft Entra app registration (§10, D4) |
| S3 | Cost and tokens per work item, not just which provider | **Open** — the teardown names this as half the differentiator, and only the provider half is built |
| S4 | Legacy `workspaces` table removed once nothing reads it | **Shipped** — dropped 2026-09-13 after every item in its last row was matched by id in the normalized tables |
| S5 | Remaining Schwartz awareness-stage avatars | **Open** — story 149 |

### Could have

| ID | Requirement |
|---|---|
| C1 | Drift and risk detection — surface a project that has stopped moving before a human notices |
| C2 | AI-built dashboards beyond the Markdown status report |
| C3 | MCP server, so Claude and Cursor can read and write the backlog directly — the teardown's argument is to integrate *via* MCP rather than rebuild connectors |
| C4 | Templates for the AI-product lifecycle (RAG eval → agent orchestration → deployment) |
| C5 | Pipeline (build/release) sync, as distinct from work-item sync |

### Won't have (this release)

| ID | Exclusion | Why |
|---|---|---|
| W1 | Billing and checkout | Nothing is worth charging for until people use it. The pricing page says so. |
| W2 | SSO / SAML, SLAs, enterprise governance | No enterprise buyer exists; building for one is fiction. |
| W3 | Agentic execution — Cairn planning or writing code itself | Commoditized. The ledger is the product; agents are inputs. |
| W4 | Native mobile apps | The web app is responsive; a second client is a maintenance tax with no user asking for it. |
| W5 | Real-time collaborative editing of the same field | Realtime sync of rows is shipped; cursor-level collaboration is not the pain. |

## 6. What exists today

| Surface | State |
|---|---|
| Landing page | Hero, problem, solution, features, ROI calculator, pricing, CTA. Social proof is persona material and is [under review](../src/components/SocialProof.tsx). |
| `/app` workspace | Project sidebar, Kanban board, story list, task detail, capture bar, attribution summary, board filters, activity feed, project header with target date and % complete, status report, team panel, Azure DevOps import, feedback |
| `/admin` console | Dashboard, users, **feedback**, subscriptions, security (role matrix + audit log), system config. Live against the database when Supabase is configured; a demo gate with seed data otherwise. |
| Auth | Magic link, OAuth (auto-detected per provider), guest mode |
| Integrations | Azure DevOps **read-only import** — org/project/PAT, preview, import; re-importing refreshes in place rather than duplicating |
| Backend | Supabase Postgres, 22 tables, RLS on every user-facing one, realtime keyed by team; three Netlify functions (`capture`, `ado-import`, `admin-users`) |

**Verified, not assumed.** Role restrictions, the completion-timestamp trigger, the append-only activity log, cross-team isolation, and the new `view:feedback` gate were each proven by SQL impersonation against the live database. Four defects were found this way, two of them in production.

## 7. Data model

`portfolios → projects → stories → tasks`, every row carrying `team_id`. Access is team membership, not `auth.uid() = user_id` — that predicate was the single-player assumption Phase 2 removed.

Guarantees worth naming because they are enforced in the database rather than the client:

- `sync_task_completed_at()` — a task's completion timestamp cannot drift from its status, whatever the client does.
- `activity_events`, `feedback` — insert and select policies only; no update or delete exists at any role.
- `protect_last_owner()` — a team cannot be left without an owner.
- Partial unique indexes on `(team_id, ado_id)` — re-importing an Azure DevOps project refreshes rows instead of duplicating them.
- SECURITY DEFINER helpers (`is_team_member`, `team_can_write`, `admin_has`) — membership checks that do not recurse through the policies that call them.

No legacy tables remain. `workspaces`, the pre-Phase-0 JSONB blob, was the last one and was dropped on 2026-09-13 (S4); there is now exactly one schema and no question about which is real.

## 8. Non-functional requirements

| Area | Requirement | Today |
|---|---|---|
| Performance | Landing page interactive on a cold load; app and admin code-split out of it | Landing ≈173 kB gzipped; `/app` and `/admin` are separate chunks |
| Correctness | No write may be silently lost | Serialized write queue; visible sync state with a retry; the header never shows "Saved" for a failed write |
| Security | Every user-facing table denies by default and is opened only by a policy | RLS on all of them; function EXECUTE revoked from `anon` |
| Privacy | Collect the minimum: email for auth, optional email on feedback, no tracking | Feedback context is route, viewport, team and signed-in flag — no content of the workspace |
| Availability | Free-tier hosting must not pause the database | Netlify auto-deploy from `main`; a keepalive job holds the Supabase project open |
| Accessibility | Keyboard-reachable controls, labelled inputs, light and dark themes | Implemented across app and admin; no formal audit yet |
| Honesty | Nothing in the UI may claim a capability that does not exist | Pricing, capture labelling, and the import's one-way notice |

## 9. How we will know it worked

The beta starts from approximately zero, and saying so is the point of a baseline.

| Measure | Baseline (2026-09-13) | Beta 1 target |
|---|---|---|
| Accounts | 2 — both mine | 10 people who are not me |
| Teams with more than one member | 0 | 3 |
| Projects tracked | 3 | 20 |
| Tasks moved to done | 1 | 100 |
| Feedback entries | 1, an internal smoke test | 10 from real users |
| Azure DevOps imports | 0 | 3 |

These are deliberately small. The failure mode for a solo build is not missing a growth target; it is building for six more months without a single outside user touching it.

## 10. Open decisions

Each of these blocks a requirement above and needs an account, a credential or a dollar — none is a coding problem.

| # | Decision | Blocks | Note |
|---|---|---|---|
| D1 | Configure an SMTP provider in Supabase | M10 | Free tiers cover beta volume comfortably |
| D2 | Register an OAuth app and enable the provider | M6 in practice | GitHub is usually fastest: personal account, no admin, no review |
| D3 | Fund `ANTHROPIC_API_KEY` | S1 | Deliberately deferred until people are using the product |
| D4 | Microsoft Entra app registration | S2 | Currently unavailable to this account; two-way sync stays parked |
| D5 | What to do about fabricated social proof | Credibility of §6's first row | Testimonials and usage metrics are persona material presented as real |

## 11. Sequencing

1. **Close Phase 2 for real** — M9, then the four QA behaviours behind it. This closes Epic 85 and is the only item that needs nothing but twenty minutes and a second email address.
2. **Let people in** — M10, D1, D2. An invite that arrives by itself is the difference between a demo and a product.
3. **Listen** — the feedback inbox exists; the input does not yet. Ten real entries should reorder everything below this line.
4. **Then, and only then, spend** — S1 and S2 both cost money or credentials, and both are easier to justify once §9 has numbers in it.

---

*This document is expected to be wrong in places within a month. When it is, change it — a spec that stops matching the product is worse than no spec, because people trust it.*
