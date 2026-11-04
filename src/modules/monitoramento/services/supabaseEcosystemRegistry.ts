/**
 * 3FB006 / P0 — Inventário de observabilidade, NÃO um cliente de banco.
 *
 * Snapshot factual obtido por consultas SQL somente leitura em 2026-11-04.
 * Não faz requests, não embute chaves e não substitui manifestos dos produtos.
 * Nunca confundir dados observados nesta data com monitoramento live.
 */
export type ProjectClass = 'sagb_operational' | 'loze_products' | 'client_apps';
export type InventoryStatus = 'real' | 'referencia' | 'nao_verificado';

export interface SchemaInventory {
  name: string;
  product: string;
  owner: string | null;
  status: InventoryStatus;
  /** Tabelas verificadas por consulta de catálogo; nulo = não verificadas. */
  observedTables: readonly string[] | null;
  /** Quantidade de tabelas com RLS ligado; não atesta políticas/grants. */
  rlsEnabledCount: number | null;
  /** Somente preencher após consumir manifesto canônico do owner. */
  expectedTables: readonly string[] | null;
  manifest: string | null;
  note: string;
}

export interface BucketInventory {
  name: string;
  isPublic: boolean;
  ownerVerified: boolean;
}

export interface SupabaseProjectInventory {
  id: string;
  name: string;
  projectClass: ProjectClass;
  projectRef: string | null;
  status: InventoryStatus;
  role: 'operational' | 'monitored';
  checkedAt: string | null;
  evidence: string;
  migrationsApplied: number | null;
  schemaInventories: readonly SchemaInventory[];
  unassignedSchemas: readonly { name: string; tables: number; rlsEnabled: number }[];
  buckets: readonly BucketInventory[];
  authContext: string;
  note: string;
}

const schema = (
  name: string,
  product: string,
  observedTables: readonly string[],
  rlsEnabledCount: number,
  note = ''
): SchemaInventory => ({
  name,
  product,
  owner: null,
  status: 'real',
  observedTables,
  rlsEnabledCount,
  expectedTables: null,
  manifest: null,
  note: note || 'Existência verificada; manifesto, ownership e políticas RLS por usuário ainda precisam de reconciliação.'
});

const example = (name: string, product: string): SchemaInventory => ({
  name, product, owner: null, status: 'referencia',
  observedTables: null, rlsEnabledCount: null, expectedTables: null, manifest: null,
  note: 'Nome usado como EXEMPLO no padrão aprovado; schema não encontrado no inventário da incubadora em 04-11-2026. Não é automaticamente divergência.'
});

export const supabaseProjectsInventory: readonly SupabaseProjectInventory[] = [
  {
    id: 'sagb-operational',
    name: 'SagB — banco operacional',
    projectClass: 'sagb_operational',
    projectRef: null,
    status: 'nao_verificado',
    role: 'operational',
    checkedAt: null,
    evidence: 'services/supabase.ts + supabase/migrations; project ref do ambiente ativo não confirmado por esta auditoria',
    migrationsApplied: null,
    schemaInventories: [],
    unassignedSchemas: [],
    buckets: [],
    authContext: 'Auth próprio do ambiente SagB; projeto remoto e memberships a validar, SEM reapontamento.',
    note: 'O SagB mantém sua persistência operacional e a Central de Padrões. Não faz parte automaticamente das duas incubadoras. Nenhuma migration ou usuário foi movido.'
  },
  {
    id: 'loze-products-incubator',
    name: 'loze-products-incubator',
    projectClass: 'loze_products',
    projectRef: 'txyuwaffzgsjndqsralg',
    status: 'real',
    role: 'monitored',
    checkedAt: '2026-11-04',
    evidence: 'Supabase / SQL somente leitura: pg_namespace, pg_class, pg_class.relrowsecurity, storage.buckets, supabase_migrations.schema_migrations',
    migrationsApplied: 30,
    schemaInventories: [
      schema('crm', 'CRM LOZE', ["accounts","activities","audit_access_log","audit_logs","automation_rules","automation_runs","backend_service_keys","channel_messages","channel_threads","consent_log","contact_channel_identities","event_errors","event_processing_logs","event_retries","inbound_delivery_receipts","integration_assets","integrations","interactions","leads","memberships","module_catalog","opportunities","opportunity_ledger","people","performance_events","person_company_roles","role_catalog","stages","table_preferences","tenant_module_entitlements","tenant_permissions","tenant_plans","tenants"], 33),
      example('nexi', 'NEXI'),
      example('radscan', 'RadScan'),
      example('studio', 'Studio')
    ],
    unassignedSchemas: [
      { name: 'public', tables: 8, rlsEnabled: 8 },
      { name: 'private', tables: 6, rlsEnabled: 6 },
      { name: 'loze_platform', tables: 0, rlsEnabled: 0 }
    ],
    buckets: [{ name: 'authorial-audio', isPublic: false, ownerVerified: false }],
    authContext: 'auth.users é compartilhado no projeto; membership, grants e RLS por produto não foram validados por teste negativo A × B.',
    note: 'O SagB OBSERVA; schemas e migrations pertencem aos produtos/Loze Platform. Contagem de migrations é do projeto, não do CRM isoladamente.'
  },
  {
    id: 'loze-client-apps-incubator',
    name: 'loze-client-apps-incubator',
    projectClass: 'client_apps',
    projectRef: 'rzouauxrsfyzvpmqqwso',
    status: 'real',
    role: 'monitored',
    checkedAt: '2026-11-04',
    evidence: 'Supabase / SQL somente leitura: pg_namespace, pg_class, pg_class.relrowsecurity, storage.buckets, supabase_migrations.schema_migrations',
    migrationsApplied: 22,
    schemaInventories: [schema('noivalia', 'Noivalía', ["agent_chats","agent_messages","agent_profiles","block_definitions","budgets","dream_folders","dream_items","entities","entity_addresses","entity_auth_links","entity_consents","entity_contacts","entity_contracts","entity_custom_values","entity_documents","entity_external_ids","entity_files","entity_notes","entity_relationships","entity_roles","entity_tags","enxoval_categories","enxoval_items","expenses","field_definitions","home_palette_preferences","journal_entries","media_files","notification_deliveries","notification_jobs","plans","preset_definitions","preset_field_config","product_field_overrides","profiles","push_subscriptions","registry_installation_config","special_women","special_women_messages","supplier_profiles","user_settings","user_subscriptions","wedding_budget_settings","wedding_decision_criteria","wedding_module_state","wedding_module_state_history","wedding_planning_profile","wedding_simulation_categories","wedding_simulation_groups","wedding_simulation_options","wedding_tasks"], 51)],
    unassignedSchemas: [{ name: 'public', tables: 0, rlsEnabled: 0 }],
    buckets: [
      { name: 'email-assets', isPublic: true, ownerVerified: false },
      { name: 'noivalia-media', isPublic: false, ownerVerified: false }
    ],
    authContext: 'auth.users é compartilhado no projeto; membership, grants e RLS por produto não foram validados por teste negativo A × B.',
    note: 'Noivalía é o único schema de produto observado nesta incubadora. Nomes de clientes/white-labels no padrão são exemplos, não implantações verificadas.'
  }
];

/** Nunca declarar paridade quando manifesto esperado ou leitura real não existem. */
export const compareSchemaInventory = (item: SchemaInventory): {
  status: 'conforme' | 'divergente' | 'sem_manifesto' | 'nao_verificado';
  missing: string[];
  unexpected: string[];
} => {
  if (item.status !== 'real' || item.observedTables === null) {
    return { status: 'nao_verificado', missing: [], unexpected: [] };
  }
  if (item.expectedTables === null) {
    return { status: 'sem_manifesto', missing: [], unexpected: [] };
  }
  const actual = new Set(item.observedTables);
  const expected = new Set(item.expectedTables);
  const missing = [...expected].filter((name) => !actual.has(name));
  const unexpected = [...actual].filter((name) => !expected.has(name));
  return { status: missing.length || unexpected.length ? 'divergente' : 'conforme', missing, unexpected };
};

export type SagbModuleCustody = 'interno' | 'coexistente' | 'legado_em_avaliacao';
export interface SagbModuleBoundary {
  name: string;
  custody: SagbModuleCustody;
  dataBoundary: string;
  note: string;
}

/** Status de domínio baseado na documentação SagB; NÃO é instrução de migração/exclusão. */
export const sagbModuleBoundaries: readonly SagbModuleBoundary[] = [
  { name: 'Central de Padrões', custody: 'interno', dataBoundary: 'Banco operacional SagB', note: 'central_padroes_documents é fonte canônica declarada; preservar seus dados e migrations.' },
  { name: 'NAGI', custody: 'interno', dataBoundary: 'Persistência local parcial; destino futuro a decidir', note: 'Não criar novo schema ou migrar localStorage sem contrato e validação.' },
  { name: 'NIDE / Metodologias / Mentorias / Missões', custody: 'interno', dataBoundary: 'Domínios do SagB com legados preservados', note: 'A consolidação é de navegação/código; tabelas legadas não podem ser excluídas sem paridade.' },
  { name: 'CID / Núcleo de Agentes / Núcleo Conversacional', custody: 'interno', dataBoundary: 'Banco operacional SagB', note: 'Domínios internos devem ter ownership e RLS auditados antes de futura separação lógica.' },
  { name: 'TaskZei', custody: 'coexistente', dataBoundary: 'Módulo SagB + produto separado', note: 'Confirmar contratos e fonte de verdade; não replicar dados entre projetos por suposição.' },
  { name: 'Studio', custody: 'coexistente', dataBoundary: 'Módulo SagB + possível produto separado', note: 'O schema studio da incubadora é apenas referência; ownership e migração exigem evidência do produto.' },
  { name: 'CRM Ziplia', custody: 'legado_em_avaliacao', dataBoundary: 'Migração legada documentada; CRM LOZE tem owner próprio', note: 'Não confundir o antigo módulo SagB com schema crm da incubadora; não eliminar sem prova.' },
  { name: 'Quadro de Elite', custody: 'legado_em_avaliacao', dataBoundary: 'Núcleo de Agentes e cópias históricas', note: 'Candidato ao arquivamento somente após teste de paridade e homologação.' },
  { name: 'Monitoramento', custody: 'interno', dataBoundary: 'Leitura de metadados, sem ownership dos bancos monitorados', note: 'Nenhuma conexão administrativa ou chave externa no browser.' }
];
