import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('official hostname cannot mount legacy runtime without verified IAM',()=>{
 const entry=read('index.tsx'),home=read('src/modules/identity-access/pages/AuthenticatedHome.tsx'),iam=read('src/modules/identity-access/pages/AccessPilotPage.tsx');
 assert.match(entry,/officialHost \|\| shouldUseIdentityPilot/);
 assert.match(iam,/if \(view === 'admitted' && client\) return <AuthenticatedHome/);
 assert.doesNotMatch(home,/import\(['"][^'"]*App['"]\)/);
 assert.match(home,/sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"/);
 assert.doesNotMatch(home,/allow-same-origin/);
 assert.match(read('workspace.tsx'),/if\(!isIsolatedWorkspace\)/);
 assert.match(read('workspace.tsx'),/isolatePublicDemo\(\)/);
 assert.match(read('src/core/demo/publicDemo.ts'),/window\.origin === 'null'/);
 assert.match(home,/sem sincronização operacional/);
 assert.match(read('netlify.toml'),/connect-src 'none'/);
 assert.match(read('netlify.toml'),/verify-production-iam\.mjs && npm run check/);
 assert.doesNotMatch(read('.github/workflows/netlify-deploy.yml'),/production-deploy:\s*true/);
});

test('production declares only a browser-public IAM key in its own context; legacy values remain outside the bundle',()=>{
 const toml=read('netlify.toml');
 assert.match(toml,/\[context\.production\.environment\]\s+VITE_SAGB_IAM_URL = "https:\/\/txyuwaffzgsjndqsralg\.supabase\.co"\s+VITE_SAGB_IAM_PUBLIC_KEY = "sb_publishable_[A-Za-z0-9_-]+"\s+VITE_SAGB_IAM_PILOT = "true"/);
 assert.doesNotMatch(toml,/VITE_SAGB_IAM_PUBLIC_KEY\s*=\s*"sb_secret_/);
 assert.match(read('vite.config.ts'),/productionIAM \? \{ envPrefix: 'VITE_SAGB_IAM_' \}/);
});
