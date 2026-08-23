-- Cairn Phase 0: normalized workspace schema.
--
-- Replaces the single-row-per-user JSONB blob (public.workspaces) with real
-- tables. The blob forced the client to rewrite the entire workspace on every
-- keystroke-debounced save, which meant last-write-wins across tabs/devices —
-- silent data loss. With rows, the client writes one record at a time and can
-- subscribe to realtime changes instead of clobbering them.
--
-- Ownership is denormalized onto every table (user_id) so RLS stays a single
-- predicate with no joins. Team sharing (Phase 2) will replace these policies
-- with a membership lookup; user_id then becomes "created by".
--
-- IDs are client-generated text (crypto.randomUUID-backed, prefixed pf_/pr_/
-- st_/tk_) so the guest workspace in localStorage can be pushed up on first
-- sign-in without remapping every foreign key.

-- ---------------------------------------------------------------- helpers --

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------- tables --

create table if not exists public.portfolios (
  id          text primary key check (char_length(id) between 1 and 64),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id           text primary key check (char_length(id) between 1 and 64),
  user_id      uuid not null references auth.users (id) on delete cascade,
  portfolio_id text not null references public.portfolios (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 200),
  description  text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.stories (
  id         text primary key check (char_length(id) between 1 and 64),
  user_id    uuid not null references auth.users (id) on delete cascade,
  project_id text not null references public.projects (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 300),
  as_a       text not null default '',
  i_want     text not null default '',
  so_that    text not null default '',
  priority   text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id         text primary key check (char_length(id) between 1 and 64),
  user_id    uuid not null references auth.users (id) on delete cascade,
  project_id text not null references public.projects (id) on delete cascade,
  story_id   text references public.stories (id) on delete set null,
  title      text not null check (char_length(title) between 1 and 500),
  status     text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  provider   text not null default 'Human'
             check (provider in ('Human', 'Claude', 'ChatGPT', 'Copilot', 'Gemini')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes --

create index if not exists portfolios_user_idx on public.portfolios (user_id);
create index if not exists projects_user_idx   on public.projects (user_id);
create index if not exists projects_pf_idx     on public.projects (portfolio_id);
create index if not exists stories_user_idx    on public.stories (user_id);
create index if not exists stories_project_idx on public.stories (project_id);
create index if not exists tasks_user_idx      on public.tasks (user_id);
create index if not exists tasks_project_idx   on public.tasks (project_id);
create index if not exists tasks_story_idx     on public.tasks (story_id);

-- --------------------------------------------------------------- triggers --

drop trigger if exists portfolios_touch on public.portfolios;
create trigger portfolios_touch before update on public.portfolios
  for each row execute function public.touch_updated_at();

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists stories_touch on public.stories;
create trigger stories_touch before update on public.stories
  for each row execute function public.touch_updated_at();

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------------- RLS --

alter table public.portfolios enable row level security;
alter table public.projects   enable row level security;
alter table public.stories    enable row level security;
alter table public.tasks      enable row level security;

drop policy if exists "Users manage their own portfolios" on public.portfolios;
create policy "Users manage their own portfolios" on public.portfolios
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own projects" on public.projects;
create policy "Users manage their own projects" on public.projects
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own stories" on public.stories;
create policy "Users manage their own stories" on public.stories
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --------------------------------------------------------------- realtime --
-- REPLICA IDENTITY FULL so DELETE events carry user_id (the realtime filter
-- matches on it); without it Postgres only ships the primary key.

alter table public.portfolios replica identity full;
alter table public.projects   replica identity full;
alter table public.stories    replica identity full;
alter table public.tasks      replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['portfolios', 'projects', 'stories', 'tasks'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- -------------------------------------------------------- data. migration --
-- Carry every existing JSONB workspace over. Migrated IDs are suffixed with the
-- first 8 hex chars of the owner's UUID: the old seed used hardcoded IDs
-- ('pf_demo', 'tk1', ...) that would collide across users under a global PK.
-- The same suffix is applied to parent references, so relationships survive.

insert into public.portfolios (id, user_id, name, description, created_at)
select
  (p ->> 'id') || '_' || left(replace(w.user_id::text, '-', ''), 8),
  w.user_id,
  coalesce(nullif(p ->> 'name', ''), 'Untitled portfolio'),
  coalesce(p ->> 'description', ''),
  coalesce(to_timestamp(nullif(p ->> 'createdAt', '')::double precision / 1000.0), now())
from public.workspaces w,
     lateral jsonb_array_elements(coalesce(w.data -> 'portfolios', '[]'::jsonb)) p
where p ->> 'id' is not null
on conflict (id) do nothing;

insert into public.projects (id, user_id, portfolio_id, name, description, created_at)
select
  (pr ->> 'id') || '_' || left(replace(w.user_id::text, '-', ''), 8),
  w.user_id,
  pf.id,
  coalesce(nullif(pr ->> 'name', ''), 'Untitled project'),
  coalesce(pr ->> 'description', ''),
  coalesce(to_timestamp(nullif(pr ->> 'createdAt', '')::double precision / 1000.0), now())
from public.workspaces w
     cross join lateral jsonb_array_elements(coalesce(w.data -> 'projects', '[]'::jsonb)) pr
     join public.portfolios pf
       on pf.id = (pr ->> 'portfolioId') || '_' || left(replace(w.user_id::text, '-', ''), 8)
where pr ->> 'id' is not null
on conflict (id) do nothing;

insert into public.stories (id, user_id, project_id, title, as_a, i_want, so_that, priority, created_at)
select
  (st ->> 'id') || '_' || left(replace(w.user_id::text, '-', ''), 8),
  w.user_id,
  pr.id,
  coalesce(nullif(st ->> 'title', ''), 'Untitled story'),
  coalesce(st ->> 'asA', ''),
  coalesce(st ->> 'iWant', ''),
  coalesce(st ->> 'soThat', ''),
  case when st ->> 'priority' in ('low', 'medium', 'high') then st ->> 'priority' else 'medium' end,
  coalesce(to_timestamp(nullif(st ->> 'createdAt', '')::double precision / 1000.0), now())
from public.workspaces w
     cross join lateral jsonb_array_elements(coalesce(w.data -> 'stories', '[]'::jsonb)) st
     join public.projects pr
       on pr.id = (st ->> 'projectId') || '_' || left(replace(w.user_id::text, '-', ''), 8)
where st ->> 'id' is not null
on conflict (id) do nothing;

insert into public.tasks (id, user_id, project_id, story_id, title, status, provider, created_at)
select
  (tk ->> 'id') || '_' || left(replace(w.user_id::text, '-', ''), 8),
  w.user_id,
  pr.id,
  -- scalar subquery yields NULL for missing/dangling story references
  (select s.id from public.stories s
    where s.id = (tk ->> 'storyId') || '_' || left(replace(w.user_id::text, '-', ''), 8)),
  coalesce(nullif(tk ->> 'title', ''), 'Untitled task'),
  case when tk ->> 'status' in ('todo', 'in_progress', 'done') then tk ->> 'status' else 'todo' end,
  case when tk ->> 'provider' in ('Human', 'Claude', 'ChatGPT', 'Copilot', 'Gemini')
       then tk ->> 'provider' else 'Human' end,
  coalesce(to_timestamp(nullif(tk ->> 'createdAt', '')::double precision / 1000.0), now())
from public.workspaces w
     cross join lateral jsonb_array_elements(coalesce(w.data -> 'tasks', '[]'::jsonb)) tk
     join public.projects pr
       on pr.id = (tk ->> 'projectId') || '_' || left(replace(w.user_id::text, '-', ''), 8)
where tk ->> 'id' is not null
on conflict (id) do nothing;

-- Legacy table kept read-only-in-practice for one release as a rollback net.
-- Nothing reads or writes it after this migration; drop it in a follow-up.
comment on table public.workspaces is
  'DEPRECATED (Phase 0): superseded by portfolios/projects/stories/tasks. Retained as a migration backup; safe to drop once the normalized schema has been in production for a release.';
