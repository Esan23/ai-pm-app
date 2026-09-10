-- Link imported rows back to their Azure DevOps work item, so a second import
-- of the same project refreshes what is already here instead of duplicating it.
--
-- Slice A shipped without this and said so in the UI: re-importing created a
-- second copy of everything. That made the import a one-shot demo rather than
-- something anyone would run twice.
--
-- ADO work item ids are unique within an organization, so (team_id, ado_id) is
-- the natural key: one row per work item per team. The index is partial because
-- almost every row in a normal workspace was never imported and carries NULL.

alter table public.projects add column if not exists ado_id bigint;
alter table public.stories  add column if not exists ado_id bigint;
alter table public.tasks    add column if not exists ado_id bigint;

-- The portfolio records the source rather than a work item: an ADO *project*
-- imports as one Cairn portfolio, so this is what a re-import matches on.
alter table public.portfolios add column if not exists ado_org     text;
alter table public.portfolios add column if not exists ado_project text;

create unique index if not exists projects_ado_idx
  on public.projects (team_id, ado_id) where ado_id is not null;
create unique index if not exists stories_ado_idx
  on public.stories (team_id, ado_id) where ado_id is not null;
create unique index if not exists tasks_ado_idx
  on public.tasks (team_id, ado_id) where ado_id is not null;
create unique index if not exists portfolios_ado_idx
  on public.portfolios (team_id, lower(ado_org), lower(ado_project))
  where ado_org is not null and ado_project is not null;

comment on column public.tasks.ado_id is
  'Azure DevOps work item id. Unique per team; NULL for anything created in Cairn.';
comment on column public.portfolios.ado_org is
  'Azure DevOps organization this portfolio was imported from, if any.';
