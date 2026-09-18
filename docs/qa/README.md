# QA

The automated suite lives in its own solution — **`Cairn_PM_Test`**, Playwright
for .NET + NUnit, opened and run from Visual Studio — because the tests target
the deployed site rather than this source tree, and a test suite that can only
run where the code is built is a suite that stops being run.

The documents here are copies, kept with the product they describe:

| | |
|---|---|
| [test-plan.md](test-plan.md) | Scope, risk assessment, strategy, entry and exit criteria, defect classes, metrics, findings |
| [traceability.md](traceability.md) | Every Azure DevOps work item against the tests that cover it — generated from the test names, so it cannot quietly drift |
| [manual-checks.md](manual-checks.md) | The checks that need a second human, written as procedures: the Phase 2 invite round trip and the four behaviours behind it |

## Where it stands

**52 tests · 44 executed and passing · 8 declared gaps · 39 seconds.**

Coverage is organised by work item, not by file: a test named `TC_147_04` covers
story 147, and that name is what the traceability matrix reads. Twenty of the
fifty stories, tasks and bugs in the backlog carry at least one test; the matrix
names the thirty that do not.

The eight gaps are not missing tests. They exist, they are ignored with the
reason written into the test, and they appear in Test Explorer and in the matrix
as gaps — every one of them blocked on the same thing: a second authenticated
account. That is task 128, and it is the last item between Phase 2 and closed.

## Two rules the suite is built around

**A default run writes nothing to this project's database.** Guest mode keeps
the whole workspace in `localStorage`, so workspace tests create and delete
freely without touching anyone's data. Anything that would write to Postgres is
gated behind `ALLOW_WRITES=1`, enforced in the base fixture rather than left to
discipline — the `feedback` table is append-only at every role, so a row a
careless run writes cannot be deleted by anyone afterwards.

**Locators are by role and accessible name.** Not purity for its own sake: a
control a test can only reach by CSS class is a control a screen reader user
cannot reach either. It has already produced one finding — the execution board's
`<section>` carries no accessible name, so it is not a landmark anyone can
navigate to. That is tracked as a bug rather than worked around in the test.

## Running it

From the suite's own directory:

```bash
dotnet test                                    # headed, against production
dotnet test --filter Category=P1               # the release gate
dotnet test --filter Category=US-147           # one story
```

Point it at a branch before it ships with `BASE_URL=http://localhost:5180`.
