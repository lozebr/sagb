import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AccessDeniedError,
  assignRole,
  checkAccess,
  createMembership,
  listEffectivePermissionCodes,
  requireAccess,
  revokeRole,
  suspendMembership
} from '../dist/core/index.js';

const base = () => ({
  principals: [{ id: 'p1', type: 'human', status: 'active', provider: 'supabase', providerSubject: 'u1' }],
  memberships: [{ id: 'm1', principalId: 'p1', scopeType: 'tenant', scopeId: 't1', status: 'active' }],
  roles: [
    { id: 'r1', slug: 'viewer', name: 'Viewer', status: 'active' },
    { id: 'r2', slug: 'admin', name: 'Admin', status: 'active' }
  ],
  permissions: [
    { id: 'read', code: 'crm.contact.read' },
    { id: 'write', code: 'crm.contact.write' }
  ],
  membershipRoles: [{ membershipId: 'm1', roleId: 'r1' }],
  rolePermissions: [
    { roleId: 'r1', permissionId: 'read' },
    { roleId: 'r2', permissionId: 'read' },
    { roleId: 'r2', permissionId: 'write' }
  ]
});

const request = (permission, extra = {}) => ({
  session: { authenticated: true, provider: 'supabase', providerSubject: 'u1', assuranceLevel: 'aal1' },
  context: { scopeType: 'tenant', scopeId: 't1' },
  permission,
  now: '2026-11-25T12:00:00.000Z',
  ...extra
});

test('deny by default and allow only assigned permission', () => {
  assert.deepEqual(checkAccess(request('crm.contact.read'), base()).allowed, true);
  const denied = checkAccess(request('crm.contact.write'), base());
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'permission_missing');
});

test('anonymous, missing principal and inactive principal are denied distinctly', () => {
  assert.equal(checkAccess({ ...request('crm.contact.read'), session: { authenticated: false, provider: 'supabase' } }, base()).reason, 'anonymous');
  assert.equal(checkAccess({ ...request('crm.contact.read'), session: { authenticated: true, provider: 'supabase', providerSubject: 'other' } }, base()).reason, 'principal_missing');
  const snapshot = base();
  snapshot.principals[0].status = 'suspended';
  assert.equal(checkAccess(request('crm.contact.read'), snapshot).reason, 'principal_inactive');
});

test('context mismatch and suspended membership are denied', () => {
  assert.equal(checkAccess({ ...request('crm.contact.read'), context: { scopeType: 'tenant', scopeId: 't2' } }, base()).reason, 'membership_missing');
  const snapshot = suspendMembership(base(), 'm1');
  assert.equal(checkAccess(request('crm.contact.read'), snapshot).reason, 'membership_inactive');
});

test('membership time window is enforced', () => {
  const future = base();
  future.memberships[0].startsAt = '2026-12-01T00:00:00.000Z';
  assert.equal(checkAccess(request('crm.contact.read'), future).reason, 'membership_inactive');
  const expired = base();
  expired.memberships[0].endsAt = '2026-11-01T00:00:00.000Z';
  assert.equal(checkAccess(request('crm.contact.read'), expired).reason, 'membership_inactive');
});

test('aal2 is enforced only when requested', () => {
  assert.equal(checkAccess(request('crm.contact.read', { requiredAssuranceLevel: 'aal2' }), base()).reason, 'mfa_required');
  const elevated = request('crm.contact.read', { requiredAssuranceLevel: 'aal2' });
  elevated.session.assuranceLevel = 'aal2';
  assert.equal(checkAccess(elevated, base()).allowed, true);
});

test('role assignment and revocation take effect immediately', () => {
  let snapshot = assignRole(base(), 'm1', 'r2');
  assert.equal(checkAccess(request('crm.contact.write'), snapshot).allowed, true);
  assert.deepEqual(listEffectivePermissionCodes(snapshot, 'm1'), ['crm.contact.read', 'crm.contact.write']);
  snapshot = revokeRole(snapshot, 'm1', 'r2');
  assert.equal(checkAccess(request('crm.contact.write'), snapshot).allowed, false);
});

test('createMembership prevents duplicate active scope membership', () => {
  assert.throws(() => createMembership(base(), { principalId: 'p1', scopeType: 'tenant', scopeId: 't1' }), /active_membership_exists/);
  const snapshot = createMembership(base(), { principalId: 'p1', scopeType: 'workspace', scopeId: 'w1' });
  assert.equal(snapshot.memberships.length, 2);
});

test('requireAccess throws structured AccessDeniedError', () => {
  assert.throws(() => requireAccess(request('crm.contact.write'), base()), (error) => {
    assert(error instanceof AccessDeniedError);
    assert.equal(error.decision.reason, 'permission_missing');
    return true;
  });
});

test('event sink receives allow and deny decisions without becoming required dependency', () => {
  const events = [];
  const sink = { publish(event) { events.push(event); } };
  checkAccess(request('crm.contact.read'), base(), sink);
  checkAccess(request('crm.contact.write'), base(), sink);
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'identity.access.allowed');
  assert.equal(events[1].type, 'identity.access.denied');
});

test('invalid windows, stale memberships and sink failure cannot change access decisions', async () => {
  let snapshot=base(); snapshot.memberships[0].endsAt='invalid';
  assert.equal(checkAccess(request('crm.contact.read'),snapshot).allowed,false);
  snapshot=base(); snapshot.memberships.unshift({...snapshot.memberships[0],id:'old',status:'revoked'});
  assert.equal(checkAccess(request('crm.contact.read'),snapshot).allowed,true);
  assert.equal(checkAccess(request('crm.contact.read'),snapshot,{publish(){throw new Error('offline');}}).allowed,true);
  assert.equal(checkAccess(request('crm.contact.write'),snapshot,{async publish(){throw new Error('offline');}}).allowed,false);
});
