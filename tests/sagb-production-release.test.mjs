import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('official hostname cannot mount legacy runtime without verified IAM',()=>{
 const entry=read('index.tsx'),home=read('src/modules/identity-access/pages/AuthenticatedHome.tsx'),iam=read('src/modules/identity-access/pages/AccessPilotPage.tsx');
 assert.match(entry,/officialHost \|\| shouldUseIdentityPilot/);
 assert.match(iam,/if \(view === 'admitted' && client\) return <AuthenticatedHome/);
 assert.doesNotMatch(home,/import\(['"][^'"]*App['"]\)/);
 assert.match(home,/useSagbTabHistory/);
 assert.match(home,/availableSections=\{\['links'\]\}/);
 assert.match(home,/Integração pendente/);
 assert.match(read('netlify.toml'),/verify-production-iam\.mjs && npm run check/);
 assert.doesNotMatch(read('.github/workflows/netlify-deploy.yml'),/production-deploy:\s*true/);
});
