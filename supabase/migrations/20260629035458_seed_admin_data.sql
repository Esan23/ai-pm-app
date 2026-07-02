-- Roles
insert into public.roles (key, display_name, description) values
  ('super_admin','Super Administrator','Unrestricted access, including role management and hard deletion.'),
  ('platform_admin','Platform Administrator','Full user, subscription, integration, and settings management.'),
  ('billing_admin','Billing Administrator','Manage plans, billing, promotions, and usage; read-only elsewhere.'),
  ('support_admin','Support Administrator','Assist customers: lookup, resend invites, unlock, adjust seats within policy.'),
  ('auditor','Auditor (Read-only)','View-only access to users, subscriptions, and audit logs for compliance.')
on conflict (key) do nothing;

-- Permissions
insert into public.permissions (key, category) values
  ('view:users','User Management'),('create:users','User Management'),('update:users','User Management'),('suspend:users','User Management'),('delete:users','User Management'),
  ('view:subscriptions','Subscription Management'),('manage:plans','Subscription Management'),('update:subscriptions','Subscription Management'),('view:billing','Subscription Management'),('manage:promotions','Subscription Management'),
  ('view:usage','Usage & Analytics'),('export:usage','Usage & Analytics'),
  ('view:roles','Security & Compliance'),('manage:roles','Security & Compliance'),('view:audit_logs','Security & Compliance'),('export:audit_logs','Security & Compliance'),('manage:security','Security & Compliance'),
  ('view:integrations','System Configuration'),('manage:integrations','System Configuration'),('manage:settings','System Configuration')
on conflict (key) do nothing;

-- Grants: super_admin = everything
insert into public.role_permissions (role_key, permission_key)
  select 'super_admin', key from public.permissions on conflict do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('platform_admin','view:users'),('platform_admin','create:users'),('platform_admin','update:users'),('platform_admin','suspend:users'),
  ('platform_admin','view:subscriptions'),('platform_admin','manage:plans'),('platform_admin','update:subscriptions'),('platform_admin','view:billing'),('platform_admin','manage:promotions'),
  ('platform_admin','view:usage'),('platform_admin','export:usage'),
  ('platform_admin','view:integrations'),('platform_admin','manage:integrations'),('platform_admin','manage:settings'),
  ('platform_admin','view:roles'),('platform_admin','view:audit_logs'),
  ('billing_admin','view:users'),
  ('billing_admin','view:subscriptions'),('billing_admin','manage:plans'),('billing_admin','update:subscriptions'),('billing_admin','view:billing'),('billing_admin','manage:promotions'),('billing_admin','view:usage'),('billing_admin','export:usage'),
  ('billing_admin','view:audit_logs'),
  ('support_admin','view:users'),('support_admin','update:users'),('support_admin','view:subscriptions'),('support_admin','view:usage'),
  ('auditor','view:users'),('auditor','view:subscriptions'),('auditor','view:usage'),('auditor','view:roles'),('auditor','view:audit_logs'),('auditor','export:audit_logs')
on conflict do nothing;

-- Plans
insert into public.subscription_plans (name, slug, price_monthly, price_annual, seat_limit, project_limit, capture_quota, features) values
  ('Free','free',0,0,1,3,50,'{"drift_detection":false,"ado_sync":false,"sso":false}'),
  ('Pro','pro',25,20,null,null,2000,'{"drift_detection":true,"ado_sync":true,"sso":false}'),
  ('Enterprise','enterprise',null,null,null,null,null,'{"drift_detection":true,"ado_sync":true,"sso":true}')
on conflict (slug) do nothing;

-- Settings singleton
insert into public.platform_settings (id, settings) values
  (true, '{"transactionalEmail":true,"trialReminders":true,"overageAlerts":true,"enterpriseWhiteLabel":false,"locale":"English (US)","currency":"USD ($)"}')
on conflict (id) do nothing;

-- Bootstrap: first super admin (auto-promoted on first magic-link sign-in).
-- NOTE: the live project's allowlist row was inserted directly (email redacted
-- here — this repo is public). New environments: insert your own admin email.
-- insert into public.admin_bootstrap (email) values ('you@example.com') on conflict (email) do nothing;
