do $$ begin
  if exists(select 1 from pg_catalog.pg_namespace where nspname in ('sagb','sagb_private')) then
    raise exception 'sagb already exists: stop and reconcile ownership';
  end if;
end $$;

-- Identity & Access Core v0.1 — structural migration
-- Replace sagb through adapters/renderIdentityMigration before applying.
create schema sagb;
create schema sagb_private;
revoke all on schema sagb_private from public, anon;
grant usage on schema sagb_private to authenticated;

-- Fresh install only: do not adopt/overwrite existing consumer objects by name.
do $$ begin
  if to_regclass('sagb.iam_installation_config') is not null
    or to_regclass('sagb.iam_principals') is not null
    or to_regclass('sagb.iam_memberships') is not null
    or to_regclass('sagb.iam_roles') is not null
    or to_regclass('sagb.iam_permissions') is not null
    or to_regclass('sagb.iam_role_permissions') is not null
    or to_regclass('sagb.iam_membership_roles') is not null
    or to_regprocedure('sagb_private.iam_current_principal_id()') is not null
    or to_regprocedure('sagb_private.iam_has_membership(text,text)') is not null
    or to_regprocedure('sagb_private.iam_has_permission(text,text,text,text)') is not null then
    raise exception 'Module object collision: use explicit reviewed upgrade or consumer mapping';
  end if;
end $$;


create table if not exists sagb.iam_installation_config (
  id boolean primary key default true check (id),
  module_version text not null default '0.1.1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into sagb.iam_installation_config (id, module_version)
values (true, '0.1.1')
on conflict (id) do update set module_version = excluded.module_version, updated_at = now();

create table if not exists sagb.iam_principals (
  id uuid primary key default gen_random_uuid(),
  principal_type text not null check (principal_type in ('human','agent','service')),
  provider text not null,
  provider_subject text not null,
  status text not null default 'active' check (status in ('active','suspended','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_subject)
);
create index if not exists iam_principals_status_idx on sagb.iam_principals(status);

create table if not exists sagb.iam_memberships (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid not null references sagb.iam_principals(id) on delete cascade,
  scope_type text not null,
  scope_id text not null,
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scope_type <> ''),
  check (scope_id <> ''),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create unique index if not exists iam_memberships_active_unique
  on sagb.iam_memberships(principal_id, scope_type, scope_id)
  where status = 'active';
create index if not exists iam_memberships_scope_idx on sagb.iam_memberships(scope_type, scope_id, status);

create table if not exists sagb.iam_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(slug),
  check (slug ~ '^[a-z0-9][a-z0-9._:-]*$')
);

create table if not exists sagb.iam_permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now(),
  check (code ~ '^[a-z0-9][a-z0-9._:-]*$')
);

create table if not exists sagb.iam_role_permissions (
  role_id uuid not null references sagb.iam_roles(id) on delete cascade,
  permission_id uuid not null references sagb.iam_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(role_id, permission_id)
);
create index if not exists iam_role_permissions_permission_idx on sagb.iam_role_permissions(permission_id);

create table if not exists sagb.iam_membership_roles (
  membership_id uuid not null references sagb.iam_memberships(id) on delete cascade,
  role_id uuid not null references sagb.iam_roles(id) on delete restrict,
  created_by_principal_id uuid references sagb.iam_principals(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key(membership_id, role_id)
);
create index if not exists iam_membership_roles_role_idx on sagb.iam_membership_roles(role_id);

-- Identity & Access Core v0.1 — RLS / authorization helpers.
-- Deny-by-default. Administrative mutations are backend-mediated.
-- Consumer owns schema ACL; never revoke schema-wide or unrelated table grants.
grant usage on schema sagb to authenticated;
revoke all on table
  sagb.iam_installation_config,
  sagb.iam_principals,
  sagb.iam_memberships,
  sagb.iam_roles,
  sagb.iam_permissions,
  sagb.iam_role_permissions,
  sagb.iam_membership_roles
  from public, anon, authenticated;

alter table sagb.iam_installation_config enable row level security;
alter table sagb.iam_principals enable row level security;
alter table sagb.iam_memberships enable row level security;
alter table sagb.iam_roles enable row level security;
alter table sagb.iam_permissions enable row level security;
alter table sagb.iam_role_permissions enable row level security;
alter table sagb.iam_membership_roles enable row level security;

create or replace function sagb_private.iam_current_principal_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p.id
  from sagb.iam_principals p
  where p.provider = 'supabase'
    and p.provider_subject = auth.uid()::text
    and p.status = 'active'
    and auth.uid() is not null
    and not coalesce((auth.jwt()->>'is_anonymous') = 'true', false)
  limit 1;
$$;
revoke all on function sagb_private.iam_current_principal_id() from public, anon;
grant execute on function sagb_private.iam_current_principal_id() to authenticated;

create or replace function sagb_private.iam_has_membership(p_scope_type text, p_scope_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from sagb.iam_memberships m
    join sagb.iam_principals p on p.id = m.principal_id
    where p.id = sagb_private.iam_current_principal_id()
      and p.status = 'active'
      and m.scope_type = p_scope_type
      and m.scope_id = p_scope_id
      and m.status = 'active'
      and (m.starts_at is null or m.starts_at <= now())
      and (m.ends_at is null or m.ends_at > now())
  );
$$;
revoke all on function sagb_private.iam_has_membership(text, text) from public, anon;
grant execute on function sagb_private.iam_has_membership(text, text) to authenticated;

create or replace function sagb_private.iam_has_permission(
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
      from sagb.iam_memberships m
      join sagb.iam_principals p on p.id = m.principal_id
      join sagb.iam_membership_roles mr on mr.membership_id = m.id
      join sagb.iam_roles r on r.id = mr.role_id and r.status = 'active'
      join sagb.iam_role_permissions rp on rp.role_id = r.id
      join sagb.iam_permissions perm on perm.id = rp.permission_id
      where p.id = sagb_private.iam_current_principal_id()
        and p.status = 'active'
        and m.scope_type = p_scope_type
        and m.scope_id = p_scope_id
        and m.status = 'active'
        and (m.starts_at is null or m.starts_at <= now())
        and (m.ends_at is null or m.ends_at > now())
        and perm.code = p_permission_code
    );
$$;
revoke all on function sagb_private.iam_has_permission(text, text, text, text) from public, anon;
grant execute on function sagb_private.iam_has_permission(text, text, text, text) to authenticated;

create policy iam_principals_self_read on sagb.iam_principals
for select to authenticated
using (id = sagb_private.iam_current_principal_id());
grant select on sagb.iam_principals to authenticated;

create policy iam_memberships_self_read on sagb.iam_memberships
for select to authenticated
using (principal_id = sagb_private.iam_current_principal_id());
grant select on sagb.iam_memberships to authenticated;

-- Role/permission catalogs and assignment tables remain backend-mediated in v0.1.
-- Consumers protect their own domain tables with iam_has_permission(...).


-- Proposed consumer catalog: entry permission only; no account or membership.
insert into sagb.iam_permissions(code,description) values
 ('sagb.access.enter','Admissão no ambiente candidato SagB');
insert into sagb.iam_roles(slug,name,description,system) values
 ('sagb-entry','Acesso SagB','Entrada somente, sem administração ou acesso a domínio',true);
insert into sagb.iam_role_permissions(role_id,permission_id)
 select r.id,p.id from sagb.iam_roles r cross join sagb.iam_permissions p
 where r.slug='sagb-entry' and p.code='sagb.access.enter';

-- New consumer schema only: no public/anon usage or browser CREATE.
revoke all on schema sagb from public, anon;
revoke create on schema sagb from authenticated;

-- Assertions: abort if any unexpected privilege or table appears.
do $$ begin
  if (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='sagb' and c.relkind in ('r','p') and c.relrowsecurity) <> 7
     or (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='sagb' and c.relkind in ('r','p')) <> 7 then
    raise exception 'unexpected IAM table inventory or missing RLS';
  end if;
  if has_schema_privilege('anon','sagb','USAGE') or has_schema_privilege('authenticated','sagb','CREATE')
     or has_function_privilege('anon','sagb_private.iam_has_permission(text,text,text,text)','EXECUTE') then
    raise exception 'unexpected anon or create privilege';
  end if;
  if exists(select 1 from pg_catalog.pg_tables t where schemaname='sagb' and
       (has_table_privilege('authenticated',format('%I.%I',schemaname,tablename),'INSERT')
        or has_table_privilege('authenticated',format('%I.%I',schemaname,tablename),'UPDATE')
        or has_table_privilege('authenticated',format('%I.%I',schemaname,tablename),'DELETE'))) then
    raise exception 'authenticated IAM mutation privilege';
  end if;
  if exists(select 1 from sagb.iam_principals) or exists(select 1 from sagb.iam_memberships)
      or exists(select 1 from sagb.iam_membership_roles) then
    raise exception 'unexpected identity provisioning';
  end if;
end $$;

-- Only the narrow entry RPC is exposed in sagb, all definer helpers remain private.
create function sagb.iam_has_permission(p_permission_code text,p_scope_type text,p_scope_id text,p_required_aal text default 'aal1') returns boolean language sql stable security invoker set search_path=pg_catalog as $$
 select coalesce(p_permission_code='sagb.access.enter' and p_scope_type='product' and p_scope_id='sagb' and sagb_private.iam_has_permission(p_permission_code,p_scope_type,p_scope_id,p_required_aal),false);
$$;
revoke all on function sagb.iam_has_permission(text,text,text,text) from public,anon;
grant execute on function sagb.iam_has_permission(text,text,text,text) to authenticated;
revoke select on sagb.iam_principals,sagb.iam_memberships from authenticated;
do $$ begin if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='sagb' and p.prosecdef) then raise exception 'exposed definer'; end if; end $$;


