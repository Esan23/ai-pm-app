CREATE EXTENSION IF NOT EXISTS pg_net;
ALTER TABLE public.keepalive_log ADD COLUMN IF NOT EXISTS http_request_id bigint;
