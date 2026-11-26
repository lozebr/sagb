import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInMemoryIdentityRepository,
  createStaticAuthProviderAdapter,
  createSupabaseEntityRegistryBridge,
  renderIdentityMigration,
  validateSchemaName, createSupabaseAuthorizationAdapter
} from '../dist/adapters/index.js';

test('static provider returns normalized session', async () => {
  const adapter = createStaticAuthProviderAdapter('supabase', { authenticated: true, subject: 'u1', assuranceLevel: 'aal2' });
  assert.deepEqual(await adapter.getSession(), {
    authenticated: true,
    provider: 'supabase',
    providerSubject: 'u1',
    assuranceLevel: 'aal2'
  });
});

test('in-memory repository returns clone, not mutable source', async () => {
  const source = { principals: [], memberships: [], roles: [], permissions: [], membershipRoles: [], rolePermissions: [] };
  const repository = createInMemoryIdentityRepository(source);
  const loaded = await repository.loadAuthorizationSnapshot();
  loaded.roles.push({ id: 'r', slug: 'x', name: 'X', status: 'active' });
  assert.equal(source.roles.length, 0);
});

test('entity registry bridge uses only supabase human provider subject', async () => {
  const calls = [];
  const bridge = createSupabaseEntityRegistryBridge({ async findEntityIdsByAuthUserId(id) { calls.push(id); return ['e1']; } });
  assert.deepEqual(await bridge.findEntityIdsByPrincipal({ id: 'p', type: 'human', status: 'active', provider: 'supabase', providerSubject: 'u1' }), ['e1']);
  assert.deepEqual(await bridge.findEntityIdsByPrincipal({ id: 'a', type: 'agent', status: 'active', provider: 'api', providerSubject: 'agent-1' }), []);
  assert.deepEqual(calls, ['u1']);
});

test('migration renderer rejects unsafe schema names', () => {
  assert.equal(validateSchemaName('crm'), 'crm');
  assert.throws(() => validateSchemaName('crm; drop schema public'), /Invalid schema name/);
  assert.equal(renderIdentityMigration('select * from __SCHEMA__.iam_roles;', { schema: 'crm' }), 'select * from crm.iam_roles;');
});

test('RPC authorization uses bound consumer and denies errors/non-boolean results', async () => {
  const calls=[]; let response={data:true,error:null};
  const client={schema(name){return {async rpc(fn,args){calls.push({name,fn,args}); return response;}};}};
  const adapter=createSupabaseAuthorizationAdapter(client,'crm');
  assert.equal(await adapter.hasPermission('crm.read','tenant','a'),true);
  assert.equal(calls[0].name,'crm'); assert.equal(calls[0].fn,'iam_has_permission');
  response={data:true,error:'denied'}; assert.equal(await adapter.hasPermission('crm.read','tenant','a'),false);
  response={data:'true',error:null}; assert.equal(await adapter.hasPermission('crm.read','tenant','a'),false);
  for(const schema of ['public','auth','storage','private','pg_catalog','supabase_migrations']) assert.throws(()=>validateSchemaName(schema));
});
