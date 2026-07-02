create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  actor_name text,
  action text not null,
  resource text,
  changes jsonb,
  ip text,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
-- read only for admins with view:audit_logs; NO write policy → append-only via definer/service role
create policy audit_read on public.audit_logs for select using (public.admin_has('view:audit_logs'));

-- atomic audit append, callable by authenticated admins
create or replace function public.log_action(p_action text, p_resource text, p_changes jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, actor_name, action, resource, changes)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    p_action, p_resource, p_changes
  );
end;
$$;

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  status text not null default 'available',   -- connected|available|error
  config jsonb not null default '{}'
);
alter table public.integrations enable row level security;
create policy integ_read on public.integrations for select using (public.admin_has('view:integrations'));
create policy integ_write on public.integrations for all
  using (public.admin_has('manage:integrations')) with check (public.admin_has('manage:integrations'));

create table if not exists public.platform_settings (
  id boolean primary key default true,
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);
alter table public.platform_settings enable row level security;
create policy settings_read on public.platform_settings for select using (public.is_platform_admin());
create policy settings_write on public.platform_settings for all
  using (public.admin_has('manage:settings')) with check (public.admin_has('manage:settings'));
