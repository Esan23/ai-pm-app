# Azure DevOps integration — spike

**Status:** complete · **Date:** 2026-08-24 · **Prototype:** [`scripts/ado-import-spike.mjs`](../scripts/ado-import-spike.mjs)

Azure DevOps sync is one of the four claims in the [competitive teardown](research/competitive-teardown.md) whitespace argument, and the only one Cairn had not touched. This spike answers whether it is buildable, what it costs, and where it breaks — validated against the live Azure DevOps REST API (`api-version=7.1`) using this project's own board, not against documentation alone.

Everything below marked **verified** was executed against `dev.azure.com/esjurgensen/Cairn` during the spike.

---

## 1. Verdict

**Feasible, and cheaper than expected.** The two things that usually sink a sync integration — a stable status mapping and a safe write path — both have first-class support:

- ADO exposes a **state category** alongside every state name, so Cairn's three statuses map without a per-process lookup table.
- Work-item updates accept a JSON Patch **`test` operation on `/rev`**, giving true optimistic concurrency: a stale write is rejected with **412**, not silently applied.

The genuine risk is not the API. It is **authentication for a multi-tenant product** (§7) and the **absence of a due-date field** on the work item types Cairn maps to (§4).

Recommendation: build the **read-only import** first (§8). It is roughly a day of work, it makes the differentiator demonstrable, and it needs none of the hard parts.

---

## 2. What was verified

| Question | Result |
|---|---|
| Can a PAT read and write work items? | **Yes** — read, create, update, link, delete all returned 200 |
| Is there a stable status mapping? | **Yes** — every state carries a `category` (`Proposed`/`InProgress`/`Resolved`/`Completed`/`Removed`) |
| Is there optimistic concurrency? | **Yes** — `test` op on `/rev`: correct rev → **200**, stale rev → **412** with `VS403351` |
| Can hierarchy be written? | **Yes** — `System.LinkTypes.Hierarchy-Reverse` relation, 200 |
| Is completion time recorded? | **Yes** — `Microsoft.VSTS.Common.ClosedDate` is set automatically on close |
| Is incremental pull possible? | **Yes** — `/wit/reporting/workitemrevisions` returns a `continuationToken` watermark and `isLastBatch` |
| Is push-based sync possible? | **Yes** — service hooks publish `workitem.created`, `.updated`, `.deleted`, `.restored` |
| Can AI attribution round-trip without a custom field? | **Yes** — via `System.Tags`; `cairn-provider:Claude` survived a write/read cycle |
| Does the mapping survive real data? | **Yes** — 39 work items → 2 portfolios, 7 projects, 19 stories, 11 tasks, **0 unparented** |

The concurrency proof is the important one, because it is what makes two-way sync safe rather than hopeful:

```
PATCH …/workitems/123   [{"op":"test","path":"/rev","value":1}, …]   → 200
PATCH …/workitems/123   [{"op":"test","path":"/rev","value":1}, …]   → 412
   VS403351: Test Operation for path /rev failed, value 2 was not equal to test value 1.
```

---

## 3. Hierarchy mapping

The Agile process template lines up with Cairn's enforced hierarchy one-for-one, which is fortunate — the enforced hierarchy is a Cairn design decision, and it happens to match how ADO already models work.

| Cairn | Azure DevOps (Agile) | Scrum | Basic |
|---|---|---|---|
| Portfolio | Epic | Epic | Epic |
| Project | Feature | Feature | Issue |
| User Story | User Story | Product Backlog Item | Issue |
| Task | Task (and Bug) | Task | Task |

Basic has only three levels, so a Basic project collapses Project and Story. Worth detecting and reporting at import rather than guessing.

**Status** maps through the category, never the name:

| ADO category | Cairn |
|---|---|
| `Proposed` | `todo` |
| `InProgress`, `Resolved` | `in_progress` |
| `Completed` | `done` |
| `Removed` | not imported |

This is why the mapping is portable: Agile's "Active", Scrum's "Committed" and Basic's "Doing" all report `InProgress` without special-casing.

---

## 4. Field mapping, and two real gaps

| Cairn | Azure DevOps | Notes |
|---|---|---|
| `title` | `System.Title` | |
| `status` | `System.State` → category | §3 |
| `assignee` | `System.AssignedTo.displayName` | identity caveat in §6 |
| `completedAt` | `Microsoft.VSTS.Common.ClosedDate` | set by ADO on close — **verified** |
| `createdAt` | `System.CreatedDate` | |
| story `priority` | `Microsoft.VSTS.Common.Priority` (1–4) | 1–2 → high, 3 → medium, 4 → low |
| project `targetDate` | `Microsoft.VSTS.Scheduling.TargetDate` | exists on Epic/Feature |
| **`dueDate`** | **no native field** | see below |
| **`provider`** | **no native field** | see below |
| story `asA` / `iWant` / `soThat` | — | ADO keeps a prose `System.Description`; Cairn's three parts have no counterpart |
| `activity_events` | work item revisions | ADO has its own history; these are parallel logs, not a sync target |

### Gap 1 — no due date

`Microsoft.VSTS.Scheduling.DueDate` **does not exist on Task or User Story** in the Agile process. The available scheduling fields are `StartDate`, `FinishDate` and `RemainingWork`. Confirmed against the live field list, and reinforced by the import run: **0 of 11 tasks carried a due date**.

Options, in order of preference:

1. Map `dueDate` ⇄ `Microsoft.VSTS.Scheduling.FinishDate`. Semantically "planned finish", which is close, and needs no configuration. It does feed ADO scheduling rollups, so it is not inert.
2. Add a custom field via an inherited process. Exact, but requires org-level process customization and admin rights — a real adoption tax.
3. Keep due dates Cairn-only and do not sync them. Honest, and defensible for an MVP.

### Gap 2 — no attribution field (and why that is fine)

Provider attribution is Cairn's differentiator and ADO has nothing like it. **Tags work**: `cairn-provider:Claude` was written and read back intact.

This matters more than it looks. Tags need no process customization, no admin rights, and no inherited process — so the differentiating feature is the one part of the integration that installs with zero configuration. Tag ordering is normalized by ADO (returned alphabetically, `; `-separated), so parse rather than pattern-match on position.

---

## 5. Sync architecture

Three viable shapes:

**A. Read-only import.** One WIQL query for ids, then `workitemsbatch` (200 ids per call, `$expand=relations`). The whole prototype is two round trips for a project this size. No auth beyond read, no conflicts, no loops.

**B. Pull, incremental.** `/wit/reporting/workitemrevisions` with a stored `continuationToken`. This is the right primitive — a watermark over revisions, rather than polling WIQL by `ChangedDate`, which suffers clock skew and pagination drift. Cheap enough to run on a schedule.

**C. Push.** Service hooks fire `workitem.updated` at a URL. Cairn already runs Netlify Functions, so the receiver is a small addition. Hooks can be missed, so C should always be backed by B as reconciliation — hooks for latency, watermark for correctness.

**Recommended:** A now; B when two-way is wanted; C only once B exists and latency is the complaint.

### Echo suppression

Two-way sync loops unless writes are attributable. Store `ado_rev` per linked entity; when a hook arrives whose rev matches the one Cairn just wrote, drop it. Combined with the `/rev` test op this gives:

- Cairn writes → records new rev → hook echo ignored.
- Someone edits in ADO → rev advances beyond the stored one → applied to Cairn.
- Both edit → `test` fails with 412 → surface a conflict rather than silently overwriting.

Cairn's Phase 0 store already has the local half of this: a serialized write queue and realtime reconciliation.

---

## 6. Identity

Cairn's `assignee` is **free text** (Phase 1 decision; Phase 2 deliberately left it alone). ADO's `System.AssignedTo` is a directory identity with a `uniqueName` email.

Import can populate the display name immediately — 10 of 11 tasks came through with an owner. Writing back needs a real mapping from a Cairn member to an ADO identity, which means matching on email. That is a natural follow-on to Phase 2: `team_members` already joins to `profiles.email`.

Until then, **import assignees, do not export them.**

---

## 7. Authentication — the actual blocker

Everything above used a **Personal Access Token**, which is correct for a spike and wrong for a product: PATs are per-user, long-lived, coarsely scoped, and cannot be issued on a customer's behalf.

A shipping integration needs a **Microsoft Entra ID app registration** with delegated Azure DevOps scopes (`vso.work` for read, `vso.work_write` for write), an OAuth consent flow, and refresh-token storage. Note that ADO's own legacy OAuth is being retired in favour of Entra, so building on the legacy flow would be building on sand.

Concretely this needs an Azure tenant, an app registration, a redirect URI, and encrypted per-team token storage — a Supabase table with RLS as tight as `team_invites`, or a secrets store. **This is the single largest unknown in the whole integration and it is an infrastructure task, not a coding one.**

A read-only import sidesteps it entirely for a demo: paste a PAT, import once, done. That is a legitimate MVP for a course project and an early product, provided the PAT is never stored server-side.

---

## 8. Recommended slice, and cost

| Slice | Scope | Estimate | Needs Entra? |
|---|---|---|---|
| **A. Import** | Paste org/project/PAT → preview → create a Cairn portfolio from an ADO project | **~1 day** | No |
| B. Status push | Cairn task status → ADO state, one way, with `/rev` guard | ~2–3 days | Yes |
| C. Two-way | Watermark pull + hooks + conflict surface + identity map | ~1 week | Yes |

Slice A is the whole demo value: it proves the hierarchy claim, imports real work in seconds, and shows attribution surviving a round trip. It also produces the exact artifact this spike already prototypes.

**Do A next. Do not start B until Entra registration exists**, because B without it just accumulates PAT-shaped debt.

---

## 9. Open questions

1. **Direction of truth.** If a task is Done in Cairn and Active in ADO, which wins? The spike assumes "last writer wins with conflict surfaced", but that is a product decision.
2. **Delete semantics.** ADO deletes go to a recycle bin (**verified** — the probe item was recoverable). Cairn deletes are permanent. Safest default: an ADO delete *unlinks* rather than deletes in Cairn.
3. **Scope of a link.** Is an ADO project imported as one Cairn project, or one portfolio containing several? The prototype assumes Epic → Portfolio, which produced 2 portfolios from this board — plausible, but it means a Cairn workspace mirrors ADO's shape rather than the user's.
4. **Basic process collapse.** Three levels into four — detect and warn, or refuse?
5. **Rate limits.** Not encountered at this size. ADO bills throughput in TSTUs and returns `Retry-After` under pressure; any loop over items needs to honour it before this meets a real backlog.

---

## 10. Reproducing this

```bash
AZURE_DEVOPS_EXT_PAT=<pat> node scripts/ado-import-spike.mjs --org <org> --project <project>
AZURE_DEVOPS_EXT_PAT=<pat> node scripts/ado-import-spike.mjs --org <org> --project <project> --json
```

Read-only; it never writes to Azure DevOps. Against this project's board it reports:

```
  read          39 work items
  portfolios    2  (from Epic)
  projects      7  (from Feature)
  stories       19  (from User Story)
  tasks         11  (from Task + Bug)
  task status   {"done":8,"todo":3}
  with owner    10
  with due date 0        <- gap 1, visible in real data
  completed at  8
  unparented    0        <- hierarchy fully resolved
```

The write probes in §2 were run against a throwaway work item, which was deleted afterwards.
