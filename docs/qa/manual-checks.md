# Manual checks

Everything here needs something the suite cannot conjure: a second human, a
second inbox, or two live sessions at once. Each one exists as an **ignored
test** in the suite so it stays visible in Test Explorer and in the
[traceability matrix](traceability.md) — a gap you can see beats coverage you
only believe in.

Record results on the work item in Azure DevOps, not here.

---

## TASK-128 — Invite round trip with a real second account

**Unblocks:** 129, 118, 130, 131 → US-127 → Feature 91 → Epic 85. This is the
last thing standing between Phase 2 and closed.

**You do not need a second mailbox.** Supabase does not normalise plus
addressing, so `you+cairn2@gmail.com` is a distinct account whose magic links
arrive in your existing inbox.

1. Main browser: sign in as yourself, open a team, **Team → invite**
   `you+cairn2@gmail.com` as **member**. Copy the invite link (invite emails are
   not built — US-144).
2. Incognito window: open the link. Expect a sign-in prompt.
3. Sign in as the alias via the magic link.
4. **Expect:** the alias lands in *your* team, sees the same projects, and can
   edit. The Team panel in the main window lists two members.
5. **Expect:** the workspace the alias had as a guest is not silently adopted
   into the team.

**Fails if:** the alias gets an empty workspace, a team of their own, or an
error. A blank `/app` after sign-in is bug 122 returning and is P1.

---

## TASK-129 — A forwarded invite link is refused

1. With the invite from 128 still pending, open the same link as a **third**
   identity (another alias, another incognito window).
2. **Expect:** a clear refusal. Not a silent join, and not a raw error.

**Fails if:** anyone holding the URL can join. That is a P1 access defect.

---

## TASK-118 — A viewer sees read-only surfaces end to end

1. As owner, set the second account's role to **viewer**.
2. In the second window, reload `/app`.
3. **Expect:** the "View only" badge in the header; no add-task controls on the
   board; no rename on task titles; the task panel offers **Close**, not
   **Save**; the Azure DevOps import is unavailable.
4. Try to edit anyway through the UI. **Expect:** nothing changes, and no error
   that blames the user.

---

## TASK-130 — A live demotion is visible to the demoted user

1. Both windows open on `/app`, the second as **member**.
2. In the owner's window, demote them to **viewer**.
3. **Expect:** within a few seconds and **without a reload**, the second window
   shows "View only" and the editing controls disappear.

**Fails if:** the demoted user keeps editing until they refresh. The
subscription exists (US-119); whether the UI follows it is the open question.

---

## TASK-131 — Last-owner protection reads legibly

1. In a team with exactly one owner, try to demote or remove that owner.
2. **Expect:** a refusal in plain language — a team cannot be left without an
   owner — rather than a database error string.

The database rule is already proven (`protect_last_owner`). What is untested is
whether the person on the other end understands what happened.

---

## US-146 — Reading feedback as a platform admin

Automatable once a stored admin session exists; until then:

1. Sign in at `/admin` as the super-admin account.
2. **Expect:** a **Feedback** entry in the sidebar, with a count badge for
   anything that arrived since this browser last opened it.
3. **Expect:** entries newest first; a **Reply** link only where an email was
   given; **Export** produces a CSV of the current filter.
4. Search for a word in a known entry. **Expect:** it narrows; the empty state
   distinguishes "no feedback yet" from "nothing matches that filter".
