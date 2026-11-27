import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('demo accepts only the exact PR 6 host and explicit flag', () => {
  const source = read('src/core/demo/publicDemo.ts');
  const body = source.match(/export function isPublicDemoHost[^\n]*\{\n([^}]+)\}/)[1];
  const check = new Function('flag', 'hostname', body);
  assert.equal(check('true','deploy-preview-6--sagbapp.netlify.app'),true);
  for (const host of ['sagb.grupob.com.br','sagbapp.netlify.app','deploy-preview-9--sagbapp.netlify.app','localhost','deploy-preview-6--sagbapp.netlify.app.example.com']) assert.equal(check('true',host),false);
  assert.equal(check('false','deploy-preview-6--sagbapp.netlify.app'),false);
});
test('demo isolates before legacy import and blocks remote writes', () => {
  const entry=read('index.tsx'), demo=read('src/core/demo/publicDemo.ts'), db=read('services/supabase.ts');
  assert.ok(entry.indexOf('isolatePublicDemo();') < entry.indexOf("import('./App')"));
  assert.match(demo,/connect-src 'none'/);
  assert.match(demo,/form-action 'none'/);
  assert.match(demo,/window\.fetch = async/);
  assert.match(db,/if \(isPublicDemo\) \{\s*if \(\(options.method \|\| 'GET'\).toUpperCase\(\) === 'GET'\) return \[\];/);
  assert.match(read('vite.config.ts'),/envPrefix: 'SAGB_DEMO_UNUSED_'/);
});
