import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publishedSource = readFileSync(
  new URL('../src/modules/nagi/data/publishedLinks.ts', import.meta.url),
  'utf8',
);
const registrySource = readFileSync(
  new URL('../src/modules/nagi/data/demoProducts.ts', import.meta.url),
  'utf8',
);
const componentSource = readFileSync(
  new URL('../src/modules/nagi/components/PublishedLinksSection.tsx', import.meta.url),
  'utf8',
);
const shellSource = readFileSync(
  new URL('../src/modules/nagi/components/NagiShell.tsx', import.meta.url),
  'utf8',
);

const legacyIds = [...publishedSource.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((match) => match[1]);

const mappingBlock = registrySource.match(
  /const PRODUCT_ID_BY_LINK_ID:[\s\S]*?=\s*\{([\s\S]*?)\n\};/,
)?.[1] ?? '';

const mapping = Object.fromEntries(
  [...mappingBlock.matchAll(/^\s*(?:'([^']+)'|([A-Za-z0-9_]+)):\s*'([^']+)',/gm)]
    .map((match) => [match[1] || match[2], match[3]]),
);

const canonicalIds = legacyIds.map((id) => mapping[id] || id);

test('NAGI demo registry consolidates historical URLs by canonical productId', () => {
  assert.ok(legacyIds.length > 0, 'legacy dataset must remain available');
  assert.ok(
    new Set(canonicalIds).size < legacyIds.length,
    'canonical registry must reduce URL-level duplicates',
  );

  const expectedGroups = {
    'site-3forb': ['3forb', 'site-3forb-testes'],
    'eda-360': ['eda-360', 'eda360'],
    'qg-3forb': ['qg-3forb-novo', 'qg-3forb'],
    taskzei: ['loze-taskzei-web', 'taskzei-loze-web', 'taskzei'],
    'crm-loze': ['crm-loze', 'zipliacrm'],
  };

  for (const [productId, sourceIds] of Object.entries(expectedGroups)) {
    for (const sourceId of sourceIds) {
      assert.equal(mapping[sourceId], productId, `${sourceId} must resolve to ${productId}`);
    }
  }
});

test('NAGI launcher renders canonical products instead of raw published links', () => {
  assert.match(componentSource, /DEMO_PRODUCTS\.filter/);
  assert.match(componentSource, /products\.map\(\(product\) => <ProductCard key=\{product\.productId\}/);
  assert.doesNotMatch(componentSource, /groupedLinks/);
  assert.doesNotMatch(componentSource, /getPublishedLinksByCompany/);
  assert.match(shellSource, /links:\s*DEMO_PRODUCTS\.length/);
  assert.doesNotMatch(shellSource, /PUBLISHED_APP_LINKS\.length/);
});

test('Demo links are explicit and unverified products do not silently use production', () => {
  assert.match(registrySource, /status:\s*'validated'/);
  assert.match(registrySource, /deploy-preview-3--loze-taskzei-web\.netlify\.app/);
  assert.match(registrySource, /status:\s*override\.status \|\| 'not_verified'/);
  assert.match(componentSource, /disabled/);
  assert.match(componentSource, /Deploy Preview\/homologação ainda não verificado/);
});
