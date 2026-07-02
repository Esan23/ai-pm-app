-- Automatic, unforgeable audit for direct (RLS-gated) admin config writes.
-- SECURITY DEFINER so the insert bypasses audit_logs' no-write policy; runs in
-- the same transaction as the change, so audit + change commit atomically.
-- NOTE: the function body here was superseded by 20260702042020 (jsonb field
-- access) — kept verbatim for history parity with the live project.
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_name text;
  v_action text;
  v_resource text;
begin
  select email into v_name from auth.users where id = v_actor;

  v_action := case TG_TABLE_NAME
    when 'role_permissions' then 'manage:roles'
    when 'integrations' then 'manage:integrations'
    when 'platform_settings' then 'manage:settings'
    when 'subscription_plans' then 'manage:plans'
    when 'customer_subscriptions' then 'update:subscriptions'
    else lower(TG_OP) || ':' || TG_TABLE_NAME
  end;

  v_resource := case TG_TABLE_NAME
    when 'role_permissions' then
      coalesce(new.role_key, old.role_key) || ': ' ||
      case TG_OP when 'INSERT' then 'granted ' when 'DELETE' then 'revoked ' else 'changed ' end ||
      coalesce(new.permission_key, old.permission_key)
    when 'integrations' then coalesce(new.name, old.name) || ' → ' || coalesce(new.status, old.status)
    when 'platform_settings' then 'platform settings updated'
    when 'subscription_plans' then coalesce(new.name, old.name) || ' plan ' || lower(TG_OP) || 'd'
    when 'customer_subscriptions' then coalesce(new.workspace_name, old.workspace_name, 'subscription') || ' ' || lower(TG_OP) || 'd'
    else TG_TABLE_NAME
  end;

  insert into public.audit_logs (actor_id, actor_name, action, resource, changes)
  values (
    v_actor,
    coalesce(v_name, 'service'),
    v_action,
    v_resource,
    case when TG_OP = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)) else null end
  );
  return coalesce(new, old);
end;
$$;

revoke execute on function public.audit_row_change() from anon, authenticated;

drop trigger if exists audit_role_permissions on public.role_permissions;
create trigger audit_role_permissions after insert or update or delete on public.role_permissions
  for each row execute function public.audit_row_change();

drop trigger if exists audit_integrations on public.integrations;
create trigger audit_integrations after insert or update or delete on public.integrations
  for each row execute function public.audit_row_change();

drop trigger if exists audit_platform_settings on public.platform_settings;
create trigger audit_platform_settings after insert or update or delete on public.platform_settings
  for each row execute function public.audit_row_change();

drop trigger if exists audit_subscription_plans on public.subscription_plans;
create trigger audit_subscription_plans after insert or update or delete on public.subscription_plans
  for each row execute function public.audit_row_change();

drop trigger if exists audit_customer_subscriptions on public.customer_subscriptions;
create trigger audit_customer_subscriptions after insert or update or delete on public.customer_subscriptions
  for each row execute function public.audit_row_change();
