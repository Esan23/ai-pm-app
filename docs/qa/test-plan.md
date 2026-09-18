# Cairn — QA test plan

| | |
|---|---|
| **Product** | Cairn — AI-native project management ([cairnpmai.netlify.app](https://cairnpmai.netlify.app), [github.com/Esan23/ai-pm-app](https://github.com/Esan23/ai-pm-app)) |
| **Release under test** | Beta 1 — Sprints 1–3 (Epics 84, 85, 132, 139) |
| **Suite** | `Cairn_PM_Test` — Playwright for .NET + NUnit, Visual Studio solution |
| **Author** | E. Sanch-Jurgensen · ISM6427c |
| **Date** | 2026-09-18 |
| **Status** | Active |
| **Related** | [product spec](https://github.com/Esan23/ai-pm-app/blob/main/docs/product-spec.md) · [traceability matrix](traceability.md) · [manual checks](manual-checks.md) |

---

## 1. Scope

### In scope

| Area | Work items |
|---|---|
| Guest workspace: hierarchy, board, task tracking | Epic 84 · US-93, 94, 95, 96, 97 |
| Board filters and the activity log | US-100, US-101 |
| Status report generation and export | US-110, US-111 |
| In-app feedback (up to, not including, the send) | US-134 |
| One-click sign-in provider discovery | US-136 |
| Session state during auth resolution | US-137 |
| Pricing honesty and call-to-action claims | US-147 |
| Admin console gating | US-146 |
| Guest-visible team controls | US-109 |

### Out of scope, and why

| Area | Why |
|---|---|
| Anything requiring two authenticated accounts | Sign-in is a magic link to a real inbox. Declared as ignored tests (US-127 · tasks 118, 128–131) and executed by hand — see [manual checks](manual-checks.md). |
| The admin console's contents | Needs a platform-admin session. The **gate** is tested; the contents are not. |
| Database access rules | Proven by SQL impersonation against the live database in the app repository, which is a stronger test than any browser can make. Duplicating it here would be theatre. |
| Billing, SSO, two-way Azure DevOps sync, invite email delivery | Not built. Marked W1–W2 / S1–S2 in the product spec. |
| Load and performance | No latency SLA exists to test against, and the user base is currently two accounts. |
| Formal WCAG audit | Not yet performed. Partial coverage falls out of the approach below. |

### A note on accessibility

Every locator in the suite is by **role and accessible name**. This is deliberate: a control the test can only reach by CSS class is a control a screen reader cannot reach either. The approach has already produced one finding — the execution-board `<section>` carries no accessible name, so it is not a landmark anyone can navigate to (see §8, F-1).

---

## 2. Risk assessment

| Risk area | Likelihood | Impact | Priority | Rationale |
|---|---|---|---|---|
| Work is lost or silently not saved | M | **H** | **P1** | The defect Phase 0 existed to fix. A user who loses a day's tracking does not come back. |
| The app claims a state it does not know | **H** | **H** | **P1** | Has occurred three times (auth header, workspace empty state, demoted-role controls). One reached production. |
| Marketing promises what the product cannot do | M | **H** | **P1** | Advertising a trial and a checkout that do not exist is the fastest way to lose a beta user's trust. |
| Team data leaks across accounts | L | **H** | **P1** | Row-level security is the whole access model. Verified by impersonation rather than here. |
| Feedback cannot be collected or read | M | M | P2 | The entire "listen before spending" plan depends on it. |
| Tracking fields drift from status | L | M | P2 | A database trigger enforces it, so the client cannot break it alone. |
| Layout fails at phone width | M | M | P2 | Claimed as supported; a broken phone layout is invisible from a desktop. |
| Azure DevOps import duplicates on re-import | L | M | P3 | Partial unique indexes make duplication a database error, not a silent mess. |

Test effort follows this table: P1 rows have automated coverage today, P3 does not.

---

## 3. Test strategy

| Type | Applicable | How |
|---|---|---|
| Functional / acceptance | **Yes** | One or more tests per acceptance criterion, named `TC_<workitem>_<n>` |
| Negative / edge | **Yes** | Every story has at least one. They find more than happy paths do. |
| Regression | **Yes** | Each production defect (bugs 120, 122, 125, US-137) leaves a permanent test behind |
| Integration | Partial | Supabase auth endpoints are stubbed to test branches that cannot be produced on demand |
| Persistence | **Yes** | Tests read `localStorage` back, because rendered ≠ stored |
| Accessibility | Partial | Role/name locators throughout; no formal audit |
| Responsive | **Yes** | A phone-shaped context, not a pinched desktop window |
| Security | No (here) | Access rules are proven by SQL impersonation in the app repository |
| Performance / load | No | No SLA to test against |
| Exploratory | **Yes** | Ad hoc, recorded as bugs in Azure DevOps |

### Environments

| | |
|---|---|
| Default target | `https://cairnpmai.netlify.app` — production, because it is what users meet |
| Override | `BASE_URL=http://localhost:5180` for a branch before it ships |
| Browser | Chromium, headed by default (`cairn.runsettings`) |
| Data | Guest mode only. The workspace lives in `localStorage`, so the suite creates and deletes freely without touching anyone's data. |

### The production-data rule

A default run **writes nothing to the database**. Tests that would are marked `[Category("Writes")]` and skipped unless `ALLOW_WRITES=1` is set deliberately. This is enforced in `CairnPageTest`, not left to discipline: the feedback table is append-only at every role, so a row written by a careless run cannot be deleted by anyone.

---

## 4. Entry and exit criteria

**Entry**
- [x] The target environment is reachable and serving the build under test
- [x] Acceptance criteria exist on the work item in Azure DevOps
- [x] Chromium installed (`playwright.ps1 install chromium`)
- [ ] For the blocked suites: a second account and a stored session

**Exit**
- [ ] Every P1 test executed
- [ ] Zero failing P1 tests
- [ ] Every skipped test carries a written reason and a work item
- [ ] The traceability matrix regenerated and committed
- [ ] Results recorded against the work item in Azure DevOps

---

## 5. Test cases

Full case list: **[traceability.md](traceability.md)**, generated from the suite itself so it cannot drift.

Naming: `TC_<work item>_<n>_<what it proves>`. The number in the name is what ties a test to its story — rename the story's coverage and the claim moves with it.

Worked example of the mapping from acceptance criterion to cases, using US-147 ("pricing states plainly that the product is free during beta; no CTA implies a payment that cannot happen; future tiers may be shown as direction"):

| Case | Type | Proves |
|---|---|---|
| TC_147_01 | Happy path | The heading, the $0, and "No card. Nothing to cancel." |
| TC_147_02 | Happy path | The gap list sits next to the feature list |
| TC_147_03 | Boundary | Planned tiers are present but the section offers exactly one link |
| TC_147_04 | **Negative** | Ten forbidden claims absent from the whole rendered page, not just the pricing section |
| TC_147_05 | **Negative** | No "Request a demo" / "Start free trial" control anywhere |
| TC_147_06 | Theme | Renders in dark mode |
| TC_147_07 | Responsive | No sideways scroll at phone width |
| TC_147_08 | Responsive | No single element hangs off the side — names the offender when it fails |

TC_147_04 is the one that matters. A page can say "free during beta" at the top and still promise a 30-day trial three sections down; that was the actual state before the story, and only a whole-page negative check catches it.

---

## 6. Defect classification

| Severity | Definition | Example from this product | Release impact |
|---|---|---|---|
| **P1 Critical** | Data loss, or access granted to the wrong person | Bug 122: first sign-in created no team, so the workspace rendered empty | Stop ship |
| **P2 High** | Core feature broken, no workaround | Bug 125: signing out of one browser signed the user out everywhere | Stop ship |
| **P3 Medium** | Degraded, workaround exists | Bug 121: secondary text failed WCAG AA contrast | Next sprint |
| **P4 Low** | Cosmetic or minor friction | Team panel sat too close to the top of the window | Backlog |

---

## 7. Metrics

| Metric | Formula | This run |
|---|---|---|
| Tests | | **53** |
| Executed | run / total | **44 / 53** (83%) |
| Pass rate | passed / executed | **44 / 44** (100%) |
| Declared gaps | ignored with a reason | **9** |
| Work-item coverage | leaf items with ≥1 test | **21 / 59** (36%) |
| Duration | | **40 s** |

The coverage figure is deliberately unflattering. Thirty-eight leaf work items have no automated test — most are closed Sprint 1 items whose behaviour is covered indirectly, but some are real gaps, and [traceability.md](traceability.md) names each one.

---

## 8. Findings

| # | Finding | Severity | Status |
|---|---|---|---|
| F-1 | The execution-board `<section>` has no accessible name, so it is not a landmark a screen reader can jump to. Found by locating it by role and failing. | P3 | **Bug 151.** TC_151_01 is written and ignored; un-ignore it when the bug is fixed and it becomes the regression test |
| F-2 | The pricing page at 375px in a *desktop* window overflows by 11px, because a classic scrollbar takes 15px from the content box. On a real phone, scrollbars are overlays and it fits. Not a product defect — but a reminder that "narrow window" is not "phone". | — | Closed: test moved to a mobile context |

---

## 9. QA risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tests run against production and pollute it | M | **H** | Guest mode only; `Writes` category gated behind an environment variable |
| The suite drifts from the backlog | **H** | M | The matrix is generated from test names and a work-item snapshot; regenerate it in the same commit |
| Blocked tests quietly disappear | M | **H** | They exist as ignored tests with written reasons, and appear in Test Explorer and the matrix |
| Production deploys change copy and break tests | M | L | Copy assertions are deliberate — if the pricing wording changes, someone should have to look at it |
| A single maintainer misses their own blind spots | **H** | M | Negative tests required per story; findings recorded even when they are the test's fault, as F-2 above |
