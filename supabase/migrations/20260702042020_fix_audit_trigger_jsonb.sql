-- Fix: access row fields via jsonb so branches for other tables don't error
-- (plpgsql validates record field refs across all CASE branches).
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_name text;
  v_action text;
  v_resource text;
  j_new jsonb := case when TG_OP = 'DELETE' then null else to_jsonb(new) end;
  j_old jsonb := case when TG_OP = 'INSERT' then null else to_jsonb(old) end;
  j jsonb := coalesce(
    case when TG_OP = 'DELETE' then to_jsonb(old) else to_jsonb(new) end,
    '{}'::jsonb
  );
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
      (j->>'role_key') || ': ' ||
      case TG_OP when 'INSERT' then 'granted ' when 'DELETE' then 'revoked ' else 'changed ' end ||
      (j->>'permission_key')
    when 'integrations' then (j->>'name') || ' → ' || (j->>'status')
    when 'platform_settings' then 'platform settings updated'
    when 'subscription_plans' then (j->>'name') || ' plan ' || lower(TG_OP) || 'd'
    when 'customer_subscriptions' then coalesce(j->>'workspace_name', 'subscription') || ' ' || lower(TG_OP) || 'd'
    else TG_TABLE_NAME
  end;

  insert into public.audit_logs (actor_id, actor_name, action, resource, changes)
  values (
    v_actor,
    coalesce(v_name, 'service'),
    v_action,
    v_resource,
    case when TG_OP = 'UPDATE' then jsonb_build_object('old', j_old, 'new', j_new) else null end
  );
  return coalesce(new, old);
end;
$$;

revoke execute on function public.audit_row_change() from anon, authenticated;
