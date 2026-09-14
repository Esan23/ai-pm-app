-- Give reading feedback its own permission, so the Feedback section of the
-- admin console is gated by the same matrix as every other section.
--
-- The feedback table shipped with one rule: any platform admin may read. That
-- made the permission matrix a half-truth for this one table - a billing admin
-- and an auditor had exactly the same access to free-text feedback as the
-- person acting on it, and no cell in the matrix could change that.

insert into public.permissions (key, category) values
  ('view:feedback', 'Product Feedback')
on conflict (key) do nothing;

-- Granted to the roles that act on product feedback. Billing and audit roles
-- are left out on purpose: feedback is user-written prose that often carries an
-- email address, and neither role needs it to do their job. Super admin gets it
-- the same way it gets everything - admin_has() short-circuits for that role.
insert into public.role_permissions (role_key, permission_key) values
  ('super_admin', 'view:feedback'),
  ('platform_admin', 'view:feedback'),
  ('support_admin', 'view:feedback')
on conflict do nothing;

-- Read is now the permission, not merely "is an admin". Insert stays open to
-- anon and authenticated: the whole point is that a guest can speak.
drop policy if exists "Platform admins read feedback" on public.feedback;
drop policy if exists "Admins with view:feedback read feedback" on public.feedback;
create policy "Admins with view:feedback read feedback" on public.feedback
  for select to authenticated
  using (public.admin_has('view:feedback'));

comment on table public.feedback is
  'In-app feedback. Append-only: no update or delete policy exists at any role. Read requires view:feedback.';
