import test from 'node:test';
import assert from 'node:assert/strict';
import { verifySagBAdmission } from '../dist-check/adapters/sagbAdmission.js';
const url = 'https://txyuwaffzgsjndqsralg.supabase.co';
function fixture({ users = ['user-a','user-a'], result = true, error = null, fail = false } = {}) {
  let count = 0;
  const calls = [];
  return { calls, client: {
    auth: { async getUser() { const id = users[Math.min(count++,users.length-1)]; return { data:{user:id?{id}:null},error:null }; } },
    schema(name) { calls.push(name); return { async rpc(fn,args) { calls.push([fn,args]); if(fail) throw Error('offline'); return {data:result,error}; } }; }
  }};
}
test('explicit product permission, schema and verified subject', async () => {
  const f=fixture(); assert.deepEqual(await verifySagBAdmission(f.client,url),{allowed:true,subject:'user-a'});
  assert.deepEqual(f.calls,['sagb',['iam_has_permission',{p_permission_code:'sagb.access.enter',p_scope_type:'product',p_scope_id:'sagb',p_required_aal:'aal1'}]]);
});
test('no RPC on wrong project or missing user', async () => {
  const f=fixture({users:[null]}); assert.equal((await verifySagBAdmission(f.client,'https://other.supabase.co')).allowed,false);
  assert.equal((await verifySagBAdmission(f.client,url)).allowed,false); assert.deepEqual(f.calls,[]);
});
test('denies missing permission, malformed response, RPC error, offline', async () => {
  for(const o of [{result:false},{result:'true'},{error:'bad'},{fail:true}]) assert.equal((await verifySagBAdmission(fixture(o).client,url)).allowed,false);
});
test('denies changed or revoked identity during verification', async () => {
  for(const users of [['a','b'],['a',null]]) assert.equal((await verifySagBAdmission(fixture({users}).client,url)).allowed,false);
});
test('malformed URL denies', async () => assert.equal((await verifySagBAdmission(fixture().client,'bad')).allowed,false));
