import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const structural = await readFile(new URL('../migrations/0001_identity_access_core.sql', import.meta.url), 'utf8');
const rls = await readFile(new URL('../migrations/0002_identity_access_rls.sql', import.meta.url), 'utf8');

test('migration does not store provider passwords or tokens', () => {
  assert(!/refresh_token|access_token|password\s+text|secret\s+text/i.test(structural));
});

test('all IAM tables enable RLS and browser grants are minimal', () => {
  for (const table of ['iam_installation_config','iam_principals','iam_memberships','iam_roles','iam_permissions','iam_role_permissions','iam_membership_roles']) {
    assert(rls.includes(`alter table __SCHEMA__.${table} enable row level security;`), table);
  }
  assert(!/grant\s+(insert|update|delete)/i.test(rls));
  assert(!/grant\s+.*\s+to\s+anon/i.test(rls));
});

test('security definer functions pin search_path and revoke public/anon', () => {
  const count = (rls.match(/security definer/g) ?? []).length;
  assert.equal(count, 3);
  assert.equal((rls.match(/set search_path = pg_catalog/g) ?? []).length, 3);
  assert(rls.includes('revoke all on function __SCHEMA__.iam_current_principal_id() from public, anon;'));
  assert(rls.includes('revoke all on function __SCHEMA__.iam_has_membership(text, text) from public, anon;'));
  assert(rls.includes('revoke all on function __SCHEMA__.iam_has_permission(text, text, text, text) from public, anon;'));
});

test('permission helper is deny-by-default, membership-scoped, time-bound and MFA-aware', () => {
  assert(rls.includes("m.status = 'active'"));
  assert(rls.includes('m.scope_type = p_scope_type'));
  assert(rls.includes('m.scope_id = p_scope_id'));
  assert(rls.includes('m.starts_at is null or m.starts_at <= now()'));
  assert(rls.includes('m.ends_at is null or m.ends_at > now()'));
  assert(rls.includes("coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'"));
  assert(rls.includes('perm.code = p_permission_code'));
});

test('never revoke consumer schema or unrelated tables', () => {
  assert(!/revoke\s+all\s+on\s+(schema|all tables in schema)/i.test(rls));
  const revocation = rls.match(/revoke all on table\s+([\s\S]*?)\s+from public, anon, authenticated;/i)?.[1] ?? '';
  for (const table of ['iam_installation_config','iam_principals','iam_memberships','iam_roles','iam_permissions','iam_role_permissions','iam_membership_roles']) assert(revocation.includes('__SCHEMA__.'+table));
  assert(rls.includes("auth.jwt()->>'is_anonymous'"));
});
