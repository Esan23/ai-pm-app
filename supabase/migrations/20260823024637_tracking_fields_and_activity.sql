-- Cairn Phase 1: the columns progress tracking actually needs, plus an
-- activity log.
--
-- Phase 0 made persistence trustworthy but the data model still could not
-- answer a single time-based question: tasks had a status and a created_at and
-- nothing else. "Are we on pace?", "what moved this week?" and "what's overdue?"
-- are all unanswerable without a due date, a completion timestamp, and a record
-- of what changed.
--
-- activity_events is deliberately NOT foreign-keyed to the entity it describes:
-- the history of a deleted task is the part you most want to keep.

-- ------------------------------------------------------------ task fields --

alter table public.tasks add column if not exists assignee     text;
alter table public.tasks add column if not exists due_date     date;
alter table public.tasks add column if not exists completed_at timestamptz;

alter table public.tasks drop constraint if exists tasks_assignee_len;
alter table public.tasks add  constraint tasks_assignee_len
  check (assignee is null or char_length(assignee) between 1 and 120);

-- Backfill: tasks already marked done predate completion tracking. created_at
-- is the only defensible stamp we have — better than pretending they finished
-- the moment this migration ran.
update public.tasks
   set completed_at = created_at
 where status = 'done' and completed_at is null;

-- Keep status and completed_at from drifting apart no matter who writes the row.
create or replace function public.sync_task_completed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done' or new.completed_at is null) then
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_sync_completed_at on public.tasks;
create trigger tasks_sync_completed_at before insert or update on public.tasks
  for each row execute function public.sync_task_completed_at();

-- --------------------------------------------------------- project fields --

alter table public.projects add column if not exists target_date date;

-- ---------------------------------------------------------------- activity --

create table if not exists public.activity_events (
  id           text primary key check (char_length(id) between 1 and 64),
  user_id      uuid not null references auth.users (id) on delete cascade,
  -- Nullable: portfolio-level events belong to no single project.
  project_id   text references public.projects (id) on delete cascade,
  entity_type  text not null check (entity_type in ('portfolio', 'project', 'story', 'task')),
  entity_id    text not null,
  -- Denormalized so the log still reads correctly after the entity is gone.
  entity_title text not null default '',
  action       text not null check (action in (
                 'created', 'renamed', 'updated', 'status_changed', 'completed',
                 'reopened', 'assigned', 'scheduled', 'deleted')),
  detail       text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists activity_user_time_idx
  on public.activity_events (user_id, created_at desc);
create index if not exists activity_project_time_idx
  on public.activity_events (project_id, created_at desc);

alter table public.activity_events enable row level security;

-- Append-and-read only: history a user can quietly rewrite is not history.
drop policy if exists "Users read their own activity" on public.activity_events;
create policy "Users read their own activity" on public.activity_events
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users append their own activity" on public.activity_events;
create policy "Users append their own activity" on public.activity_events
  for insert to authenticated
  with check (auth.uid() = user_id);

alter table public.activity_events replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'activity_events'
  ) then
    alter publication supabase_realtime add table public.activity_events;
  end if;
end;
$$;
