-- log_action must not be callable by clients (prevents audit-log spoofing).
-- Only service-role (server functions) may append; the signup trigger calls it as definer.
revoke execute on function public.log_action(text, text, jsonb) from public;
grant execute on function public.log_action(text, text, jsonb) to service_role;

-- Trigger function should never be a public RPC.
revoke execute on function public.handle_new_user() from public;

-- RBAC helpers are only needed by signed-in users (for RLS) and the server.
revoke execute on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated, service_role;
revoke execute on function public.admin_role() from public;
grant execute on function public.admin_role() to authenticated, service_role;
revoke execute on function public.admin_has(text) from public;
grant execute on function public.admin_has(text) to authenticated, service_role;

-- Document intent: bootstrap allowlist is read only by the definer trigger.
comment on table public.admin_bootstrap is 'Emails auto-promoted to super_admin on signup. RLS deny-all to clients by design; only handle_new_user() (security definer) reads it.';
