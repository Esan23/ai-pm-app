-- Roles / permissions / role_permissions / admin_users + RBAC helpers + RLS

create table if not exists public.roles (
  key text primary key,
  display_name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  key text primary key,            -- format: action:resource
  category text not null,
  description text
);

create table if not exists public.role_permissions (
  role_key text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_key text not null references public.roles(key),
  created_at timestamptz not null default now()
);

-- Helper functions (security definer; run as owner so they bypass RLS, no recursion)
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.admin_role()
returns text language sql stable security definer set search_path = public as $$
  select role_key from public.admin_users where user_id = auth.uid();
$$;

create or replace function public.admin_has(perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when (select role_key from public.admin_users where user_id = auth.uid()) = 'super_admin' then true
    else exists (
      select 1
      from public.admin_users au
      join public.role_permissions rp on rp.role_key = au.role_key
      where au.user_id = auth.uid() and rp.permission_key = perm
    )
  end;
$$;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.admin_users enable row level security;

create policy roles_read on public.roles for select using (public.is_platform_admin());
create policy perms_read on public.permissions for select using (public.is_platform_admin());
create policy rp_read on public.role_permissions for select using (public.is_platform_admin());
create policy admins_read on public.admin_users for select using (public.is_platform_admin());

create policy rp_write on public.role_permissions for all
  using (public.admin_has('manage:roles')) with check (public.admin_has('manage:roles'));

create policy admins_write on public.admin_users for all
  using (public.admin_role() = 'super_admin') with check (public.admin_role() = 'super_admin');
