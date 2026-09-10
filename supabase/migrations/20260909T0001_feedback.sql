-- In-app feedback.
--
-- The app is going in front of real users to gather feedback before more money
-- is spent on it, and until now there was no way for anyone to say anything.
-- Everything else Cairn stores belongs to a team; this deliberately does not.
-- Feedback belongs to the product, and the person leaving it may not be in a
-- team at all — guest mode is a first-class path, so a guest must be able to
-- submit.
--
-- Append-only, like activity_events: insert and read, no update or delete
-- policy at any role. Feedback nobody can quietly edit is worth more than
-- feedback anyone can tidy up.

create table if not exists public.feedback (
  id         text primary key check (char_length(id) between 1 and 64),
  -- Null for a guest. Not a foreign key to teams: feedback outlives them.
  user_id    uuid references auth.users (id) on delete set null,
  -- Whatever address they gave, or the signed-in one. Optional on purpose:
  -- demanding contact details suppresses the blunt feedback worth having.
  email      text check (email is null or char_length(email) between 3 and 200),
  message    text not null check (char_length(message) between 1 and 4000),
  -- Where they were when they wrote it: route, team, viewport. Saves the
  -- round trip of asking "which screen?".
  context    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Anyone can leave feedback, signed in or not. This is deliberately open: the
-- cost of a spam row is a row, and the cost of a login wall is the feedback of
-- everyone who has not signed up yet - which is exactly who we need to hear
-- from. The length check above is the only bound.
drop policy if exists "Anyone can leave feedback" on public.feedback;
create policy "Anyone can leave feedback" on public.feedback
  for insert to anon, authenticated
  with check (
    -- A signed-in submitter cannot attribute feedback to somebody else.
    user_id is null or user_id = (select auth.uid())
  );

-- Reading is for platform admins only, reusing the gate the admin console
-- already relies on. Ordinary users cannot read each other's feedback.
drop policy if exists "Platform admins read feedback" on public.feedback;
create policy "Platform admins read feedback" on public.feedback
  for select to authenticated
  using (public.is_platform_admin());

comment on table public.feedback is
  'In-app feedback. Append-only: no update or delete policy exists at any role.';
