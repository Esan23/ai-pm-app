-- Trigger functions need no EXECUTE grant: a trigger fires in the table
-- owner's context, not the caller's. Leaving them callable exposed
-- SECURITY DEFINER functions at /rest/v1/rpc/... for no reason.

revoke all on function public.add_team_creator_as_owner() from public, anon, authenticated;
revoke all on function public.protect_last_owner()        from public, anon, authenticated;
revoke all on function public.default_team_id()           from public, anon, authenticated;
revoke all on function public.touch_updated_at()          from public, anon, authenticated;
revoke all on function public.sync_task_completed_at()    from public, anon, authenticated;
