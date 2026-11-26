import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseIdentityPilot, isTargetUrl, isPublicKey, isPilotRequestAllowed, TARGET_ORIGIN, SESSION_KEY } from '../dist-check/services/pilotConfig.js';
import { AdmissionRevision, getRecoveryCode } from '../dist-check/services/admissionLifecycle.js';
test('new project always uses isolated entry; legacy unchanged otherwise', () => {
  assert.equal(shouldUseIdentityPilot(undefined,TARGET_ORIGIN),true);
  assert.equal(shouldUseIdentityPilot('true',''),true);
  assert.equal(shouldUseIdentityPilot(undefined,'https://old.supabase.co'),false);
  assert.equal(isTargetUrl(TARGET_ORIGIN),true);
  assert.equal(isTargetUrl(TARGET_ORIGIN+'/evil'),false);
  assert.match(SESSION_KEY,/txyuwaffzgsjndqsralg/);
});
test('only public key type and exact legacy ref allowed',()=>{
  const jwt=(p)=>'a.'+Buffer.from(JSON.stringify(p)).toString('base64url')+'.b';
  assert.equal(isPublicKey('sb_publishable_example'),true);
  assert.equal(isPublicKey('sb_secret_example'),false);
  assert.equal(isPublicKey(jwt({role:'service_role',ref:'txyuwaffzgsjndqsralg'})),false);
  assert.equal(isPublicKey(jwt({role:'anon',ref:'other'})),false);
  assert.equal(isPublicKey(jwt({role:'anon',ref:'txyuwaffzgsjndqsralg'})),true);
});
test('network allowlist excludes legacy data, storage, functions and other products',()=>{
  for(const path of ['/rest/v1/users','/rest/v1/tasks','/storage/v1/object','/functions/v1/auth-admin','/rest/v1/rpc/other','/auth/v1/signup','/auth/v1/admin/users']) assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+path,'POST'),false,path);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/rest/v1/rpc/iam_has_permission','POST'),true);
  assert.equal(isPilotRequestAllowed('https://old.supabase.co/auth/v1/token','POST'),false);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/auth/v1/token','POST'),true);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/auth/v1/user','GET'),true);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/auth/v1/recover','POST'),true);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/auth/v1/otp','POST'),true);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/auth/v1/verify','POST'),true);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/rest/v1/rpc/iam_claim_first_access','POST'),true);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/rest/v1/rpc/iam_claim_first_access','GET'),false);
  assert.equal(isPilotRequestAllowed(TARGET_ORIGIN+'/auth/v1/logout','POST'),true);
});
test('late admission cannot reopen after invalidation',()=>{
  const rev=new AdmissionRevision(); const a=rev.begin(); const b=rev.begin();
  assert.equal(rev.isCurrent(a),false); assert.equal(rev.isCurrent(b),true);
  rev.invalidate(); assert.equal(rev.isCurrent(b),false);
});
test('recovery requires correct route, prior request and code',()=>{
  assert.equal(getRecoveryCode('/auth/reset-password','?code=valid',true),'valid');
  assert.equal(getRecoveryCode('/','?code=valid',true),null);
  assert.equal(getRecoveryCode('/auth/reset-password','?code=valid',false),null);
  assert.equal(getRecoveryCode('/auth/reset-password','?code=valid&error=denied',true),null);
  assert.equal(getRecoveryCode('/auth/reset-password','',true),null);
});
