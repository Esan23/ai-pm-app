create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  price_monthly numeric(10,2),
  price_annual numeric(10,2),
  seat_limit int,
  project_limit int,
  capture_quota int,
  features jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  workspace_name text,
  plan_id uuid references public.subscription_plans(id),
  status text not null default 'trialing',          -- trialing|active|past_due|canceled
  billing_cycle text not null default 'monthly',    -- monthly|annual
  seats int not null default 1,
  mrr numeric(12,2) not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  metric text not null,                              -- seats|projects|captures|tokens
  provider text,                                     -- human|claude|chatgpt|copilot|gemini
  quantity numeric(14,2) not null default 0,
  cost numeric(12,4) not null default 0,
  period_start timestamptz,
  period_end timestamptz,
  recorded_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
alter table public.customer_subscriptions enable row level security;
alter table public.usage_records enable row level security;

create policy plans_read on public.subscription_plans for select using (public.admin_has('view:subscriptions'));
create policy plans_write on public.subscription_plans for all
  using (public.admin_has('manage:plans')) with check (public.admin_has('manage:plans'));

create policy subs_read on public.customer_subscriptions for select using (public.admin_has('view:subscriptions'));
create policy subs_write on public.customer_subscriptions for all
  using (public.admin_has('update:subscriptions')) with check (public.admin_has('update:subscriptions'));

create policy usage_read on public.usage_records for select using (public.admin_has('view:usage'));
