-- Cairn Phase 2: teams, membership, roles, invites.
--
-- Phases 0 and 1 made the workspace trustworthy and trackable, but it was still
-- single-player: every row was owned by one user and RLS read
-- `auth.uid() = user_id`, so a project could not be shared with the team that
-- is actually doing the work.
--
-- Ownership now flows through a team. `user_id` is kept on every content table
-- and demoted to "created by" — it stops being the access-control predicate.
--
-- Membership checks live in SECURITY DEFINER helpers so a policy on
-- team_members can consult team_members without recursing through its own RLS.

-- ------------------------------------------------------------------ teams --

create table if not exists public.teams (
  id         text primary key check (char_length(id) between 1 and 64),
  name       text not null check (char_length(name) between 1 and 120),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id   text not null references public.teams (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.team_invites (
  id          text primary key check (char_length(id) between 1 and 64),
  team_id     text not null references public.teams (id) on delete cascade,
  email       text not null check (position('@' in email) > 1),
  role        text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  token       uuid not null default gen_random_uuid(),
  invited_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null
);

create unique index if not exists team_invites_token_idx on public.team_invites (token);
create unique index if not exists team_invites_pending_idx
  on public.team_invites (team_id, lower(email)) where accepted_at is null;
create index if not exists team_members_user_idx on public.team_members (user_id);

drop trigger if exists teams_touch on public.teams;
create trigger teams_touch before update on public.teams
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------- helpers --
-- SECURITY DEFINER: these are called from inside RLS policies, including the
-- policies on team_members itself. Reading the table through its own policy
-- would recurse.

create or replace function public.is_team_member(p_team text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = p_team and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.team_role(p_team text)
returns text language sql stable security definer set search_path = ''
as $$
  select m.role from public.team_members m
  where m.team_id = p_team and m.user_id = (select auth.uid());
$$;

create or replace function public.team_can_write(p_team text)
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.team_role(p_team) in ('owner', 'admin', 'member'), false); $$;

create or replace function public.team_can_admin(p_team text)
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.team_role(p_team) in ('owner', 'admin'), false); $$;

revoke all on function public.is_team_member(text)  from public, anon;
revoke all on function public.team_role(text)       from public, anon;
revoke all on function public.team_can_write(text)  from public, anon;
revoke all on function public.team_can_admin(text)  from public, anon;
grant execute on function public.is_team_member(text)  to authenticated, service_role;
grant execute on function public.team_role(text)       to authenticated, service_role;
grant execute on function public.team_can_write(text)  to authenticated, service_role;
grant execute on function public.team_can_admin(text)  to authenticated, service_role;

-- A team with no members would be invisible to everyone, including whoever
-- just made it. Creator becomes owner in the same transaction.
create or replace function public.add_team_creator_as_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (team_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists teams_add_creator on public.teams;
create trigger teams_add_creator after insert on public.teams
  for each row execute function public.add_team_creator_as_owner();

-- Losing the last owner would strand the team: no one could manage members or
-- delete it.
create or replace function public.protect_last_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  owners int;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    select count(*) into owners
      from public.team_members where team_id = old.team_id and role = 'owner';
    if owners <= 1 then
      raise exception 'A team must keep at least one owner';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists team_members_protect_owner on public.team_members;
create trigger team_members_protect_owner before update or delete on public.team_members
  for each row execute function public.protect_last_owner();

-- --------------------------------------------------- backfill: one team per --
-- Every existing owner gets a personal team holding everything they already
-- have. Derived from all five content tables, not just portfolios, so a user
-- with orphaned rows still lands somewhere.

insert into public.teams (id, name, created_by)
select
  'tm_' || left(replace(owner.user_id::text, '-', ''), 16),
  'My Workspace',
  owner.user_id
from (
  select user_id from public.portfolios
  union select user_id from public.projects
  union select user_id from public.stories
  union select user_id from public.tasks
  union select user_id from public.activity_events
) owner
on conflict (id) do nothing;

-- ------------------------------------------------- team_id on content rows --

alter table public.portfolios      add column if not exists team_id text references public.teams (id) on delete cascade;
alter table public.projects        add column if not exists team_id text references public.teams (id) on delete cascade;
alter table public.stories         add column if not exists team_id text references public.teams (id) on delete cascade;
alter table public.tasks           add column if not exists team_id text references public.teams (id) on delete cascade;
alter table public.activity_events add column if not exists team_id text references public.teams (id) on delete cascade;

update public.portfolios      set team_id = 'tm_' || left(replace(user_id::text, '-', ''), 16) where team_id is null;
update public.projects        set team_id = 'tm_' || left(replace(user_id::text, '-', ''), 16) where team_id is null;
update public.stories         set team_id = 'tm_' || left(replace(user_id::text, '-', ''), 16) where team_id is null;
update public.tasks           set team_id = 'tm_' || left(replace(user_id::text, '-', ''), 16) where team_id is null;
update public.activity_events set team_id = 'tm_' || left(replace(user_id::text, '-', ''), 16) where team_id is null;

alter table public.portfolios      alter column team_id set not null;
alter table public.projects        alter column team_id set not null;
alter table public.stories         alter column team_id set not null;
alter table public.tasks           alter column team_id set not null;
alter table public.activity_events alter column team_id set not null;

-- Backward compatibility with the client that is live right now: it predates
-- teams and sends no team_id, which NOT NULL would reject. A BEFORE INSERT
-- trigger fills in the author's first team, so the deployed build keeps working
-- between this migration and the deploy that follows it. (BEFORE triggers run
-- ahead of constraint checks, so NOT NULL still holds afterwards.)
create or replace function public.default_team_id()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.team_id is null then
    select m.team_id into new.team_id
      from public.team_members m
     where m.user_id = new.user_id
     order by m.joined_at
     limit 1;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['portfolios', 'projects', 'stories', 'tasks', 'activity_events'] loop
    execute format('drop trigger if exists %I_default_team on public.%I', t, t);
    execute format(
      'create trigger %I_default_team before insert on public.%I
         for each row execute function public.default_team_id()', t, t);
  end loop;
end;
$$;

create index if not exists portfolios_team_idx on public.portfolios (team_id);
create index if not exists projects_team_idx   on public.projects (team_id);
create index if not exists stories_team_idx    on public.stories (team_id);
create index if not exists tasks_team_idx      on public.tasks (team_id);
create index if not exists activity_team_idx   on public.activity_events (team_id, created_at desc);

comment on column public.portfolios.user_id is 'Created by. Access is decided by team_id (Phase 2).';
comment on column public.projects.user_id   is 'Created by. Access is decided by team_id (Phase 2).';
comment on column public.stories.user_id    is 'Created by. Access is decided by team_id (Phase 2).';
comment on column public.tasks.user_id      is 'Created by. Access is decided by team_id (Phase 2).';

-- ---------------------------------------------------------- RLS: team core --

alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.team_invites  enable row level security;

drop policy if exists "Members read their teams" on public.teams;
create policy "Members read their teams" on public.teams
  for select to authenticated using (public.is_team_member(id));

drop policy if exists "Signed-in users create teams" on public.teams;
create policy "Signed-in users create teams" on public.teams
  for insert to authenticated with check (created_by = (select auth.uid()));

drop policy if exists "Admins rename their team" on public.teams;
create policy "Admins rename their team" on public.teams
  for update to authenticated
  using (public.team_can_admin(id)) with check (public.team_can_admin(id));

drop policy if exists "Owners delete their team" on public.teams;
create policy "Owners delete their team" on public.teams
  for delete to authenticated using (public.team_role(id) = 'owner');

drop policy if exists "Members see the roster" on public.team_members;
create policy "Members see the roster" on public.team_members
  for select to authenticated using (public.is_team_member(team_id));

drop policy if exists "Admins manage the roster" on public.team_members;
create policy "Admins manage the roster" on public.team_members
  for all to authenticated
  using (public.team_can_admin(team_id)) with check (public.team_can_admin(team_id));

-- Anyone can show themselves the door (the last-owner trigger still applies).
drop policy if exists "Members can leave" on public.team_members;
create policy "Members can leave" on public.team_members
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Members read invites" on public.team_invites;
create policy "Members read invites" on public.team_invites
  for select to authenticated using (public.is_team_member(team_id));

drop policy if exists "Admins manage invites" on public.team_invites;
create policy "Admins manage invites" on public.team_invites
  for all to authenticated
  using (public.team_can_admin(team_id)) with check (public.team_can_admin(team_id));

-- ------------------------------------------------------- RLS: content rows --
-- The Phase 0 predicate (auth.uid() = user_id) is replaced everywhere: read if
-- you are in the team, write if your role allows it.

drop policy if exists "Users manage their own portfolios" on public.portfolios;
drop policy if exists "Users manage their own projects"   on public.projects;
drop policy if exists "Users manage their own stories"    on public.stories;
drop policy if exists "Users manage their own tasks"      on public.tasks;
drop policy if exists "Users read their own activity"     on public.activity_events;
drop policy if exists "Users append their own activity"   on public.activity_events;

drop policy if exists "Team reads portfolios" on public.portfolios;
create policy "Team reads portfolios" on public.portfolios
  for select to authenticated using (public.is_team_member(team_id));
drop policy if exists "Team writes portfolios" on public.portfolios;
create policy "Team writes portfolios" on public.portfolios
  for all to authenticated
  using (public.team_can_write(team_id)) with check (public.team_can_write(team_id));

drop policy if exists "Team reads projects" on public.projects;
create policy "Team reads projects" on public.projects
  for select to authenticated using (public.is_team_member(team_id));
drop policy if exists "Team writes projects" on public.projects;
create policy "Team writes projects" on public.projects
  for all to authenticated
  using (public.team_can_write(team_id)) with check (public.team_can_write(team_id));

drop policy if exists "Team reads stories" on public.stories;
create policy "Team reads stories" on public.stories
  for select to authenticated using (public.is_team_member(team_id));
drop policy if exists "Team writes stories" on public.stories;
create policy "Team writes stories" on public.stories
  for all to authenticated
  using (public.team_can_write(team_id)) with check (public.team_can_write(team_id));

drop policy if exists "Team reads tasks" on public.tasks;
create policy "Team reads tasks" on public.tasks
  for select to authenticated using (public.is_team_member(team_id));
drop policy if exists "Team writes tasks" on public.tasks;
create policy "Team writes tasks" on public.tasks
  for all to authenticated
  using (public.team_can_write(team_id)) with check (public.team_can_write(team_id));

-- Activity stays append-and-read-only: no update or delete policy exists, so
-- history cannot be rewritten by anyone, at any role.
drop policy if exists "Team reads activity" on public.activity_events;
create policy "Team reads activity" on public.activity_events
  for select to authenticated using (public.is_team_member(team_id));
drop policy if exists "Team appends activity" on public.activity_events;
create policy "Team appends activity" on public.activity_events
  for insert to authenticated with check (public.team_can_write(team_id));

-- ---------------------------------------------------------------- invites --
-- Accepting is a function, not a policy: the caller must not be able to see or
-- touch an invite row until they have proven the token AND that it was issued
-- to their own email address, which stops a forwarded link from working.

create or replace function public.accept_team_invite(p_token uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  invite public.team_invites;
  caller_email text;
begin
  select lower(coalesce(auth.jwt() ->> 'email', '')) into caller_email;
  if caller_email = '' then
    raise exception 'Sign in to accept an invite';
  end if;

  select * into invite from public.team_invites
   where token = p_token and accepted_at is null and expires_at > now();

  if invite.id is null then
    raise exception 'That invite is invalid or has expired';
  end if;
  if lower(invite.email) <> caller_email then
    raise exception 'That invite was sent to a different email address';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (invite.team_id, (select auth.uid()), invite.role)
  on conflict (team_id, user_id) do nothing;

  update public.team_invites
     set accepted_at = now(), accepted_by = (select auth.uid())
   where id = invite.id;

  return invite.team_id;
end;
$$;

revoke all on function public.accept_team_invite(uuid) from public, anon;
grant execute on function public.accept_team_invite(uuid) to authenticated;

-- ---------------------------------------------------- teammate identities --
-- The roster needs names and emails, which live in public.profiles (created
-- for every signup by the existing handle_new_user trigger). This ADDS a
-- policy; the existing self-read and platform-admin policies are untouched,
-- and visibility extends no further than people you already share a team with.

create or replace function public.shares_team_with(p_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
      from public.team_members me
      join public.team_members them on them.team_id = me.team_id
     where me.user_id = (select auth.uid()) and them.user_id = p_user
  );
$$;

revoke all on function public.shares_team_with(uuid) from public, anon;
grant execute on function public.shares_team_with(uuid) to authenticated, service_role;

drop policy if exists "Teammates read each other's profile" on public.profiles;
create policy "Teammates read each other's profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_team_with(id));

-- --------------------------------------------------------------- realtime --

alter table public.teams        replica identity full;
alter table public.team_members replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['teams', 'team_members'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
