-- Drop the pre-Phase-0 workspace blob.
--
-- public.workspaces held one JSONB row per user and was superseded four
-- migrations ago by portfolios/projects/stories/tasks. It was kept as a
-- rollback net for a release, which has long since passed: nothing in the
-- client, the Netlify functions, or the admin console has referenced it since
-- Phase 0, and leaving it there only invites the question of which schema is
-- the real one.
--
-- Checked against the live database before this ran: one row remained, holding
-- the old demo seed (1 portfolio, 2 projects, 2 stories, 5 tasks), and every
-- one of those items was matched by id in the normalized tables. Nothing is
-- lost that is not already stored somewhere better.
--
-- Its policy and RLS go with the table; `drop table` removes both.

drop table if exists public.workspaces;
