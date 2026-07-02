-- Enable pg_cron (scheduler lives in the cron schema)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Lightweight log so each scheduled "ping" leaves a verifiable record
CREATE TABLE IF NOT EXISTS public.keepalive_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ran_at      timestamptz NOT NULL DEFAULT now(),
  table_count integer     NOT NULL,
  tables      text[]      NOT NULL
);

-- Lock it down: no anon/authenticated access, this is internal bookkeeping
ALTER TABLE public.keepalive_log ENABLE ROW LEVEL SECURITY;
