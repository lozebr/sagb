-- Identity & Access Core v0.1 — structural migration
-- Replace __SCHEMA__ through adapters/renderIdentityMigration before applying.
create schema if not exists __SCHEMA__;

-- Fresh install only: do not adopt/overwrite existing consumer objects by name.
do $$ begin
  if to_regclass('__SCHEMA__.iam_installation_config') is not null
    or to_regclass('__SCHEMA__.iam_principals') is not null
    or to_regclass('__SCHEMA__.iam_memberships') is not null
    or to_regclass('__SCHEMA__.iam_roles') is not null
    or to_regclass('__SCHEMA__.iam_permissions') is not null
    or to_regclass('__SCHEMA__.iam_role_permissions') is not null
    or to_regclass('__SCHEMA__.iam_membership_roles') is not null
    or to_regprocedure('__SCHEMA__.iam_current_principal_id()') is not null
    or to_regprocedure('__SCHEMA__.iam_has_membership(text,text)') is not null
    or to_regprocedure('__SCHEMA__.iam_has_permission(text,text,text,text)') is not null then
    raise exception 'Module object collision: use explicit reviewed upgrade or consumer mapping';
  end if;
end $$;


create table if not exists __SCHEMA__.iam_installation_config (
  id boolean primary key default true check (id),
  module_version text not null default '0.1.1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into __SCHEMA__.iam_installation_config (id, module_version)
values (true, '0.1.1')
on conflict (id) do update set module_version = excluded.module_version, updated_at = now();

create table if not exists __SCHEMA__.iam_principals (
  id uuid primary key default gen_random_uuid(),
  principal_type text not null check (principal_type in ('human','agent','service')),
  provider text not null,
  provider_subject text not null,
  status text not null default 'active' check (status in ('active','suspended','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_subject)
);
create index if not exists iam_principals_status_idx on __SCHEMA__.iam_principals(status);

create table if not exists __SCHEMA__.iam_memberships (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid not null references __SCHEMA__.iam_principals(id) on delete cascade,
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
  on __SCHEMA__.iam_memberships(principal_id, scope_type, scope_id)
  where status = 'active';
create index if not exists iam_memberships_scope_idx on __SCHEMA__.iam_memberships(scope_type, scope_id, status);

create table if not exists __SCHEMA__.iam_roles (
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

create table if not exists __SCHEMA__.iam_permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now(),
  check (code ~ '^[a-z0-9][a-z0-9._:-]*$')
);

create table if not exists __SCHEMA__.iam_role_permissions (
  role_id uuid not null references __SCHEMA__.iam_roles(id) on delete cascade,
  permission_id uuid not null references __SCHEMA__.iam_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(role_id, permission_id)
);
create index if not exists iam_role_permissions_permission_idx on __SCHEMA__.iam_role_permissions(permission_id);

create table if not exists __SCHEMA__.iam_membership_roles (
  membership_id uuid not null references __SCHEMA__.iam_memberships(id) on delete cascade,
  role_id uuid not null references __SCHEMA__.iam_roles(id) on delete restrict,
  created_by_principal_id uuid references __SCHEMA__.iam_principals(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key(membership_id, role_id)
);
create index if not exists iam_membership_roles_role_idx on __SCHEMA__.iam_membership_roles(role_id);
