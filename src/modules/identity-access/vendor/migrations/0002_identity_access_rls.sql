-- Identity & Access Core v0.1 — RLS / authorization helpers.
-- Deny-by-default. Administrative mutations are backend-mediated.
-- Consumer owns schema ACL; never revoke schema-wide or unrelated table grants.
grant usage on schema __SCHEMA__ to authenticated;
revoke all on table
  __SCHEMA__.iam_installation_config,
  __SCHEMA__.iam_principals,
  __SCHEMA__.iam_memberships,
  __SCHEMA__.iam_roles,
  __SCHEMA__.iam_permissions,
  __SCHEMA__.iam_role_permissions,
  __SCHEMA__.iam_membership_roles
  from public, anon, authenticated;

alter table __SCHEMA__.iam_installation_config enable row level security;
alter table __SCHEMA__.iam_principals enable row level security;
alter table __SCHEMA__.iam_memberships enable row level security;
alter table __SCHEMA__.iam_roles enable row level security;
alter table __SCHEMA__.iam_permissions enable row level security;
alter table __SCHEMA__.iam_role_permissions enable row level security;
alter table __SCHEMA__.iam_membership_roles enable row level security;

create or replace function __SCHEMA__.iam_current_principal_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p.id
  from __SCHEMA__.iam_principals p
  where p.provider = 'supabase'
    and p.provider_subject = auth.uid()::text
    and p.status = 'active'
    and auth.uid() is not null
    and not coalesce((auth.jwt()->>'is_anonymous') = 'true', false)
  limit 1;
$$;
revoke all on function __SCHEMA__.iam_current_principal_id() from public, anon;
grant execute on function __SCHEMA__.iam_current_principal_id() to authenticated;

create or replace function __SCHEMA__.iam_has_membership(p_scope_type text, p_scope_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from __SCHEMA__.iam_memberships m
    join __SCHEMA__.iam_principals p on p.id = m.principal_id
    where p.id = __SCHEMA__.iam_current_principal_id()
      and p.status = 'active'
      and m.scope_type = p_scope_type
      and m.scope_id = p_scope_id
      and m.status = 'active'
      and (m.starts_at is null or m.starts_at <= now())
      and (m.ends_at is null or m.ends_at > now())
  );
$$;
revoke all on function __SCHEMA__.iam_has_membership(text, text) from public, anon;
grant execute on function __SCHEMA__.iam_has_membership(text, text) to authenticated;

create or replace function __SCHEMA__.iam_has_permission(
  p_permission_code text,
  p_scope_type text,
  p_scope_id text,
  p_required_aal text default 'aal1'
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    p_required_aal in ('aal1','aal2')
    and (p_required_aal = 'aal1' or coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2')
    and exists (
      select 1
      from __SCHEMA__.iam_memberships m
      join __SCHEMA__.iam_principals p on p.id = m.principal_id
      join __SCHEMA__.iam_membership_roles mr on mr.membership_id = m.id
      join __SCHEMA__.iam_roles r on r.id = mr.role_id and r.status = 'active'
      join __SCHEMA__.iam_role_permissions rp on rp.role_id = r.id
      join __SCHEMA__.iam_permissions perm on perm.id = rp.permission_id
      where p.id = __SCHEMA__.iam_current_principal_id()
        and p.status = 'active'
        and m.scope_type = p_scope_type
        and m.scope_id = p_scope_id
        and m.status = 'active'
        and (m.starts_at is null or m.starts_at <= now())
        and (m.ends_at is null or m.ends_at > now())
        and perm.code = p_permission_code
    );
$$;
revoke all on function __SCHEMA__.iam_has_permission(text, text, text, text) from public, anon;
grant execute on function __SCHEMA__.iam_has_permission(text, text, text, text) to authenticated;

create policy iam_principals_self_read on __SCHEMA__.iam_principals
for select to authenticated
using (id = __SCHEMA__.iam_current_principal_id());
grant select on __SCHEMA__.iam_principals to authenticated;

create policy iam_memberships_self_read on __SCHEMA__.iam_memberships
for select to authenticated
using (principal_id = __SCHEMA__.iam_current_principal_id());
grant select on __SCHEMA__.iam_memberships to authenticated;

-- Role/permission catalogs and assignment tables remain backend-mediated in v0.1.
-- Consumers protect their own domain tables with iam_has_permission(...).
