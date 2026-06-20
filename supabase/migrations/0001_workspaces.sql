-- Cairn: per-user workspace persistence.
-- One row per user holds the entire workspace (portfolios → projects → stories
-- → tasks) as JSONB. Row-Level Security ensures a user can only read/write
-- their own row.

create table if not exists public.workspaces (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

drop policy if exists "Users manage their own workspace" on public.workspaces;
create policy "Users manage their own workspace"
  on public.workspaces
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
