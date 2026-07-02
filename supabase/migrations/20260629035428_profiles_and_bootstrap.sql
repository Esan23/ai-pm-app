create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  workspace_id uuid,
  plan text default 'Free',
  status text not null default 'active',          -- active|suspended|pending
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_self on public.profiles for select using (id = auth.uid());
create policy profiles_admin_read on public.profiles for select using (public.admin_has('view:users'));

-- Bootstrap allowlist: emails auto-promoted to super_admin on first signup.
create table if not exists public.admin_bootstrap (email text primary key);
alter table public.admin_bootstrap enable row level security;  -- deny-all to clients; trigger is definer

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;

  if exists (select 1 from public.admin_bootstrap b where lower(b.email) = lower(new.email)) then
    insert into public.admin_users (user_id, role_key) values (new.id, 'super_admin')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
