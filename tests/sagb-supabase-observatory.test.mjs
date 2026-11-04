import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const registry = read('src/modules/monitoramento/services/supabaseEcosystemRegistry.ts');
const page = read('src/modules/monitoramento/pages/MonitoramentoSupabasePage.tsx');
const legacyCatalog = read('src/modules/monitoramento/services/supabaseObservabilityCatalog.ts');
const tableService = read('src/modules/monitoramento/services/supabaseTablesService.ts');

test('SagB operacional é separado das duas incubadoras do padrão oficial', () => {
  assert.match(registry, /id: 'sagb-operational'/);
  assert.match(registry, /projectRef: null/);
  assert.match(registry, /name: 'loze-products-incubator'/);
  assert.match(registry, /name: 'loze-client-apps-incubator'/);
  assert.match(registry, /projectRef: 'txyuwaffzgsjndqsralg'/);
  assert.match(registry, /projectRef: 'rzouauxrsfyzvpmqqwso'/);
  assert.match(registry, /role: 'monitored'/);
});

test('Snapshot factual: CRM e Noivalía têm tabelas verificadas sem presumir schemas de exemplo', () => {
  const capture = (name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = registry.match(new RegExp("schema\\('" + escaped + "', '[^']+', (\\[[^\\]]+\\]), (\\d+)\\)"));
    assert.ok(match, 'Snapshot do schema ' + name + ' não encontrado');
    return { names: JSON.parse(match[1]), rls: Number(match[2]) };
  };
  const crm = capture('crm');
  const noivalia = capture('noivalia');
  assert.equal(crm.names.length, 33);
  assert.equal(crm.rls, 33);
  assert.equal(noivalia.names.length, 51);
  assert.equal(noivalia.rls, 51);
  assert.match(registry, /example\('nexi', 'NEXI'\)/);
  assert.match(registry, /example\('radscan', 'RadScan'\)/);
  assert.match(registry, /example\('studio', 'Studio'\)/);
});

test('Sem manifesto ou permissão, comparação não declara paridade nem divergência', () => {
  assert.match(registry, /if \(item\.status !== 'real' \|\| item\.observedTables === null\)/);
  assert.match(registry, /if \(item\.expectedTables === null\)/);
  assert.match(registry, /status: 'sem_manifesto'/);
  assert.match(registry, /status: 'nao_verificado'/);
  assert.match(page, /compareSchemaInventory\(schema\)/);
  assert.match(page, /snapshot de leitura/i);
});

test('Nunca consulta as incubadoras com chave de serviço ou credencial no browser', () => {
  assert.doesNotMatch(registry + page, /SUPABASE_SERVICE_ROLE_KEY|service_role|management_api_token/i);
  assert.doesNotMatch(registry, /\bfetch\s*\(/);
  assert.match(legacyCatalog, /if \(!token\)/);
  assert.match(legacyCatalog, /status: 'sem_permissao'/);
  assert.match(legacyCatalog, /Authorization: `Bearer \$\{token\}`/);
  assert.doesNotMatch(legacyCatalog, /Bearer \$\{token \|\| supabaseAnonKey\}/);
});

test('O mapa modular usa catálogo declarado em vez de simular import de todos os documentos', () => {
  assert.match(tableService, /for \(const asset of supabaseObservedAssets\)/);
  assert.doesNotMatch(tableService, /await import\('\.\.\/module-doc'\)/);
  assert.match(registry, /NIDE \/ Metodologias \/ Mentorias \/ Missões/);
});

test('Inventário cobre os 30 módulos do registry e os três legados sem apagar nada', () => {
  const modulesFile = read('src/core/modules/moduleRegistry.ts');
  const registryCount = (modulesFile.match(/manifest: [a-zA-Z_]+/g) || []).length;
  const match = registry.match(/sagbModuleBoundaries: readonly SagbModuleBoundary\[\] = (\[[\s\S]*\]);/);
  assert.ok(match, 'Matriz modular não encontrada');
  const modules = JSON.parse(match[1]);
  assert.equal(registryCount, 30);
  assert.equal(modules.filter((mod) => mod.registered).length, registryCount);
  assert.equal(modules.filter((mod) => !mod.registered).length, 3);
  assert.equal(new Set(modules.map((mod) => mod.id)).size, modules.length);
  assert.match(page, /mod\.registered \? 'Sim' : 'Não'/);
});
