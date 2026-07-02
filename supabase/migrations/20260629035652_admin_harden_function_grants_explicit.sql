-- Supabase grants EXECUTE directly to anon/authenticated; revoke explicitly.

-- Audit append: server (service_role) only. Blocks client audit-log spoofing.
revoke execute on function public.log_action(text, text, jsonb) from anon, authenticated;

-- Signup trigger function: never a client RPC (fires as table owner regardless).
revoke execute on function public.handle_new_user() from anon, authenticated;

-- RBAC helpers: not needed by anon; authenticated keeps EXECUTE (required for RLS).
revoke execute on function public.is_platform_admin() from anon;
revoke execute on function public.admin_role() from anon;
revoke execute on function public.admin_has(text) from anon;
