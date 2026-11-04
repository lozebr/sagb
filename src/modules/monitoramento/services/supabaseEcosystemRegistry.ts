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

export type SagbModuleCustody = 'interno' | 'coexistente' | 'legado_em_avaliacao' | 'a_classificar';

export interface SagbModuleBoundary {
  id: string;
  name: string;
  registered: boolean;
  custody: SagbModuleCustody;
  dataBoundary: string;
  note: string;
}

/** Snapshot documental de 30 entradas no moduleRegistry + 3 diretórios fora do registry.
 * A classificação não ordena exclusão nem prova ownership físico no Supabase. */
export const sagbModuleBoundaries: readonly SagbModuleBoundary[] = [
  {
    "id": "api_sagb",
    "name": "API SagB",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Funções/integrações SagB",
    "note": "Contratos API e auditoria existentes; não transferir ownership."
  },
  {
    "id": "hub-integracao",
    "name": "Hub de Integração",
    "registered": true,
    "custody": "coexistente",
    "dataBoundary": "Adaptadores SagB ↔ Hub externo",
    "note": "Não confundir módulo cliente com o serviço LOZE Hub; credenciais exigem proteção server-side."
  },
  {
    "id": "agentes_comerciais",
    "name": "Agentes Comerciais",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Domínio SagB não inventariado por schema",
    "note": "Conservar até mapear tabelas, permissões e integrações."
  },
  {
    "id": "cadastro-empresas",
    "name": "Cadastro de Empresas",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB",
    "note": "Validar autoria e RLS das tabelas de empresas."
  },
  {
    "id": "nucleo-conversacional",
    "name": "Núcleo Conversacional",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB",
    "note": "Preservar sessões, mensagens e memórias existentes."
  },
  {
    "id": "nucleo_de_agentes",
    "name": "Núcleo de Agentes",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB",
    "note": "Preservar agentes, configurações e DNA."
  },
  {
    "id": "central_padroes",
    "name": "Central de Padrões",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB",
    "note": "central_padroes_documents é fonte canônica declarada; preservar dados/migrations."
  },
  {
    "id": "monitoramento",
    "name": "Monitoramento",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Observa metadados; não possui schemas externos",
    "note": "Apenas consultas autorizadas, snapshots e governança."
  },
  {
    "id": "nagi",
    "name": "NAGI",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "LocalStorage parcial; destino a homologar",
    "note": "Não migrar dados nem criar schema sem gate específico."
  },
  {
    "id": "nic",
    "name": "NIC",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Persistência/fallback parcial; destino a homologar",
    "note": "Separação lógica apenas após contrato de dados."
  },
  {
    "id": "sala-dev",
    "name": "Sala Dev",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB",
    "note": "Verificar consumidores das tabelas dev antes de qualquer extração."
  },
  {
    "id": "mentorias",
    "name": "Mentorias",
    "registered": true,
    "custody": "legado_em_avaliacao",
    "dataBoundary": "Domínio em NIDE; legado preservado",
    "note": "Rotas originais e dados dependem de paridade com NIDE."
  },
  {
    "id": "simulador-mentorias",
    "name": "Simulador de Mentorias",
    "registered": true,
    "custody": "a_classificar",
    "dataBoundary": "Pendente de inventário",
    "note": "Não criar schema nem apagar domínio sem confirmar consumidores."
  },
  {
    "id": "metodologias",
    "name": "Metodologias",
    "registered": true,
    "custody": "legado_em_avaliacao",
    "dataBoundary": "Domínio em NIDE; legado preservado",
    "note": "Duplicidades de código comprovadas; dados não podem ser eliminados por isso."
  },
  {
    "id": "missoes",
    "name": "Missões",
    "registered": true,
    "custody": "legado_em_avaliacao",
    "dataBoundary": "Domínio em NIDE; legado preservado",
    "note": "NIDE incorpora Missões; preservar tabelas e contratos."
  },
  {
    "id": "rai",
    "name": "RAI",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB",
    "note": "Conservar capturas/configurações e auditar chamadas externas."
  },
  {
    "id": "karaoke",
    "name": "Karaokê",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Não inventariado por schema",
    "note": "Preservar módulo até identificação de dependências."
  },
  {
    "id": "studio",
    "name": "Studio",
    "registered": true,
    "custody": "coexistente",
    "dataBoundary": "Módulo SagB e possível produto externo",
    "note": "O schema studio das incubadoras é referência, não confirmação de migração."
  },
  {
    "id": "cid",
    "name": "CID",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB + Storage",
    "note": "Preservar assets, jobs, chunks e outputs."
  },
  {
    "id": "taskzei",
    "name": "TaskZei",
    "registered": true,
    "custody": "coexistente",
    "dataBoundary": "Módulo SagB e produto independente",
    "note": "Fontes de verdade e contratos precisam conciliação antes de separar."
  },
  {
    "id": "crm_ziplia",
    "name": "CRM Ziplia",
    "registered": true,
    "custody": "legado_em_avaliacao",
    "dataBoundary": "Módulo histórico; CRM LOZE com ownership próprio",
    "note": "O schema crm externo não autoriza replicar/remover tabelas legadas."
  },
  {
    "id": "configuracoes-ambiente",
    "name": "Configurações de Ambiente",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Configurações do SagB",
    "note": "Checar se algum valor sensível está exposto antes de separar."
  },
  {
    "id": "gestao_financeira",
    "name": "Gestão Financeira",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional SagB",
    "note": "Preservar transações, conciliações e integrações."
  },
  {
    "id": "telas_avancadas",
    "name": "Telas Avançadas",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Persistência SagB a verificar",
    "note": "Sem migração sem matriz de consumidores."
  },
  {
    "id": "videos-ia",
    "name": "Vídeos IA",
    "registered": true,
    "custody": "a_classificar",
    "dataBoundary": "POC/contrato a investigar",
    "note": "Preservar até prova de ausência de consumidores."
  },
  {
    "id": "foco_total",
    "name": "Foco Total",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Banco operacional/estado a verificar",
    "note": "Módulo do SagB, sem necessidade provada de projeto dedicado."
  },
  {
    "id": "sagb_bridge",
    "name": "SagB Bridge",
    "registered": true,
    "custody": "a_classificar",
    "dataBoundary": "Integração e tabelas compartilhadas a auditar",
    "note": "Não confundir compartilhamento de tabelas com ownership."
  },
  {
    "id": "mcp_sagb",
    "name": "MCP SagB",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "Integração SagB",
    "note": "Auditar autorização e acesso a dados antes de ampliar escopo."
  },
  {
    "id": "fluxob",
    "name": "FluxoB",
    "registered": true,
    "custody": "a_classificar",
    "dataBoundary": "Pré-alfa/contrato a investigar",
    "note": "Nenhuma limpeza sem inventário e paridade."
  },
  {
    "id": "nide",
    "name": "NIDE",
    "registered": true,
    "custody": "interno",
    "dataBoundary": "NIDE / Metodologias / Mentorias / Missões",
    "note": "Domínio agregador oficial no runtime; preserva fallbacks até homologação."
  },
  {
    "id": ".centro_de_estudos",
    "name": "Centro de Estudos (oculto)",
    "registered": false,
    "custody": "legado_em_avaliacao",
    "dataBoundary": "Fora do moduleRegistry",
    "note": "Candidato a arquivo após prova de não referência."
  },
  {
    "id": "_orquestracao-principal",
    "name": "Orquestração Principal (legado)",
    "registered": false,
    "custody": "a_classificar",
    "dataBoundary": "Fora do moduleRegistry",
    "note": "Investigar consumers antes de agir."
  },
  {
    "id": "quadro_de_elite",
    "name": "Quadro de Elite (legado)",
    "registered": false,
    "custody": "legado_em_avaliacao",
    "dataBoundary": "Fora do moduleRegistry",
    "note": "Duplicação com Núcleo de Agentes; somente arquivar após paridade."
  }
];
