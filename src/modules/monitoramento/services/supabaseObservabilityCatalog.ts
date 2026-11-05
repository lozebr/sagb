export type SupabaseObservabilityStatus = 'real' | 'inferido' | 'pendente' | 'erro' | 'sem_permissao' | 'nao_encontrado';

export type SupabaseMovementStatus =
  | 'disponível'
  | 'parcialmente_disponível'
  | 'depende_de_updated_at'
  | 'depende_de_audit_log'
  | 'depende_de_trigger_futura'
  | 'depende_de_view_futura'
  | 'depende_de_contrato_observabilidade';

export type SupabaseObservedAsset = {
  moduleId: string;
  tableName: string;
  assetName: string;
  moduleName: string;
  kind: 'table' | 'storage' | 'bucket' | 'view' | 'job' | 'memory' | 'asset' | 'output' | 'unknown';
  recordCount: number | null;
  lastReadAt: string;
  status: SupabaseObservabilityStatus;
  origin: 'auditoria' | 'service' | 'module-doc' | 'migration' | 'supabase-query' | 'inferido' | 'manual';
  sourceEvidence: string;
  note: string;
  movementStatus: SupabaseMovementStatus;
};

const moduleIdByName: Record<string, string> = {
  'Central de Padrões': 'central_padroes',
  TaskZei: 'taskzei',
  'Sala Dev': 'sala-dev',
  CID: 'cid',
  'Cadastro de Empresas': 'cadastro-empresas',
  'Núcleo Conversacional': 'nucleo-conversacional',
  'Quadro de Elite / Núcleo de Identidades': 'quadro_de_elite',
  'Núcleo de Agentes': 'nucleo_de_agentes',
  Studio: 'studio',
  RAI: 'rai',
  'Gestão Financeira': 'gestao_financeira',
  'Hub de Integração': 'hub-integracao',
  Mentorias: 'mentorias',
  Metodologias: 'metodologias',
  'CRM Ziplia': 'crm_ziplia',
  Monitoramento: 'monitoramento',
  'SagB Bridge': 'sagb-bridge'
};

const table = (
  moduleName: string,
  tableName: string,
  origin: SupabaseObservedAsset['origin'] = 'auditoria',
  sourceEvidence = 'relatório de auditoria informado na tarefa',
  note = 'Tabela inferida por auditoria/código; contagem real depende de leitura segura autorizada.'
): SupabaseObservedAsset => ({
  moduleId: moduleIdByName[moduleName] || moduleName.toLowerCase().replace(/\s+/g, '-'),
  tableName,
  assetName: tableName,
  moduleName,
  kind: 'table',
  recordCount: null,
  lastReadAt: 'não executada',
  status: 'inferido',
  origin,
  sourceEvidence,
  note,
  movementStatus: 'depende_de_contrato_observabilidade'
});

export const supabaseObservedAssets: SupabaseObservedAsset[] = [
  table('Central de Padrões', 'governance_rules'),
  table('Central de Padrões', 'central_padroes_areas'),
  table('Central de Padrões', 'central_padroes_standards'),
  table('Central de Padrões', 'central_padroes_standard_dependencies'),
  table('Central de Padrões', 'central_padroes_documents'),
  table('Central de Padrões', 'central_padroes_decisions'),
  table('TaskZei', 'taskzei_tasks'),
  table('TaskZei', 'taskzei_projects'),
  table('TaskZei', 'taskzei_entity_links'),
  table('Sala Dev', 'dev_projects'),
  table('Sala Dev', 'dev_tasks'),
  table('Sala Dev', 'dev_developer_sessions'),
  table('Sala Dev', 'dev_task_runs'),
  table('Sala Dev', 'dev_task_launches'),
  table('CID', 'cid_assets'),
  table('CID', 'cid_asset_files'),
  table('CID', 'cid_processing_jobs'),
  { ...table('CID', 'cid-storage', 'inferido', 'auditoria informou storage relacionado ao CID', 'Bucket/storage relacionado ao CID; não validado por consulta nesta etapa.'), kind: 'bucket' },
  table('Cadastro de Empresas', 'empresas'),
  { ...table('Cadastro de Empresas', 'empresa_logos', 'inferido', 'auditoria informou storage relacionado a logos', 'Storage de logos inferido; precisa validação futura.'), kind: 'storage' },
  table('Núcleo Conversacional', 'chat_sessions'),
  table('Núcleo Conversacional', 'chat_messages'),
  table('Quadro de Elite / Núcleo de Identidades', 'agents'),
  table('Quadro de Elite / Núcleo de Identidades', 'agent_configs'),
  table('Quadro de Elite / Núcleo de Identidades', 'agent_dna_profiles'),
  table('Quadro de Elite / Núcleo de Identidades', 'agent_dna_effective'),
  table('Núcleo de Agentes', 'agents'),
  table('Studio', 'studio_sessions'),
  table('Studio', 'studio_chunks'),
  table('Studio', 'studio_session_cameras'),
  table('Studio', 'studio_camera_files'),
  table('Studio', 'studio_audio_tracks'),
  table('RAI', 'rai_events', 'inferido', 'nome genérico inferido; requer validação por código/consulta'),
  table('Gestão Financeira', 'finance_entries', 'inferido', 'nome genérico inferido; requer validação por código/consulta'),
  table('Hub de Integração', 'integration_events', 'inferido', 'nome genérico inferido; requer validação por código/consulta'),
  table('Mentorias', 'mentorias_sessions', 'inferido', 'nome genérico inferido; requer validação por código/consulta'),
  table('Metodologias', 'metodologias_records', 'inferido', 'nome genérico inferido; requer validação por código/consulta'),
  table('CRM Ziplia', 'crm_ziplia_contacts', 'inferido', 'nome genérico inferido; requer validação por código/consulta'),
  table('Monitoramento', 'system_metrics', 'module-doc', 'module-doc do Monitoramento'),
  table('Monitoramento', 'service_health', 'module-doc', 'module-doc do Monitoramento'),
  table('Monitoramento', 'cost_tracking', 'module-doc', 'module-doc do Monitoramento'),
  table('Monitoramento', 'alert_logs', 'module-doc', 'module-doc do Monitoramento'),
  table('Monitoramento', 'event_stream', 'module-doc', 'module-doc do Monitoramento'),
  table('SagB Bridge', 'dev_projects'),
  table('SagB Bridge', 'dev_tasks'),
  table('SagB Bridge', 'dev_task_runs'),
  table('SagB Bridge', 'dev_developer_sessions'),
  table('SagB Bridge', 'dev_task_launches')
];

export const supabaseMovementReadiness = [
  { label: 'Últimas inserções', status: 'depende_de_created_at' },
  { label: 'Últimas atualizações', status: 'depende_de_updated_at' },
  { label: 'Últimas exclusões', status: 'depende_de_audit_log' },
  { label: 'Tabelas mais movimentadas', status: 'depende_de_view_futura' },
  { label: 'Crescimento por tabela', status: 'depende_de_contrato_observabilidade' },
  { label: 'Erros de leitura/escrita', status: 'depende_de_contrato_observabilidade' },
  { label: 'Tabelas sem rastreabilidade', status: 'parcialmente_disponível' }
];

type CountResult = Pick<SupabaseObservedAsset, 'tableName' | 'recordCount' | 'status' | 'lastReadAt' | 'note' | 'origin' | 'sourceEvidence'>;

const readSupabaseSessionToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem('sagb_supabase_session_v1');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.access_token || '';
  } catch {
    return '';
  }
};

const classifyCountError = (status: number, message: string): SupabaseObservabilityStatus => {
  const normalized = message.toLowerCase();
  if (status === 401 || status === 403 || normalized.includes('permission') || normalized.includes('rls')) return 'sem_permissao';
  // REST 404 pode significar schema não exposto ou falta de permissão: não atesta exclusão física.
  if (status === 404 || normalized.includes('not find') || normalized.includes('does not exist')) return 'pendente';
  return 'erro';
};

export const countSupabaseTableRowsSafely = async (asset: SupabaseObservedAsset): Promise<CountResult> => {
  const checkedAt = new Date().toISOString();

  if (asset.kind !== 'table') {
    return {
      tableName: asset.tableName,
      recordCount: null,
      status: 'pendente',
      lastReadAt: checkedAt,
      note: 'Contagem real aplicável apenas a tabelas nesta etapa.',
      origin: asset.origin,
      sourceEvidence: asset.sourceEvidence
    };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      tableName: asset.tableName,
      recordCount: null,
      status: 'erro',
      lastReadAt: checkedAt,
      note: 'Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes no client.',
      origin: asset.origin,
      sourceEvidence: asset.sourceEvidence
    };
  }

  const token = readSupabaseSessionToken();
  if (!token) {
    return {
      tableName: asset.tableName,
      recordCount: null,
      status: 'sem_permissao',
      lastReadAt: checkedAt,
      note: 'Sessão autenticada SagB obrigatória. Sem consulta anônima ou a projetos externos.',
      origin: asset.origin,
      sourceEvidence: asset.sourceEvidence
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${asset.tableName}?select=*`, {
      method: 'HEAD',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        Prefer: 'count=exact'
      }
    });

    if (!response.ok) {
      const message = response.statusText || `HTTP ${response.status}`;
      return {
        tableName: asset.tableName,
        recordCount: null,
        status: classifyCountError(response.status, message),
        lastReadAt: checkedAt,
        note: `Falha na contagem HEAD segura: ${message}.`,
        origin: 'supabase-query',
        sourceEvidence: 'HEAD /rest/v1 com Prefer: count=exact'
      };
    }

    const contentRange = response.headers.get('content-range') || '';
    const count = Number(contentRange.split('/')[1]);

    return {
      tableName: asset.tableName,
      recordCount: Number.isFinite(count) ? count : null,
      status: Number.isFinite(count) ? 'real' : 'erro',
      lastReadAt: checkedAt,
      note: Number.isFinite(count) ? 'Contagem real obtida por HEAD seguro, sem ler linhas.' : 'Resposta sem Content-Range de contagem.',
      origin: 'supabase-query',
      sourceEvidence: 'HEAD /rest/v1 com Prefer: count=exact'
    };
  } catch (error) {
    return {
      tableName: asset.tableName,
      recordCount: null,
      status: 'erro',
      lastReadAt: checkedAt,
      note: `Erro técnico na contagem segura: ${String((error as Error)?.message || error)}.`,
      origin: 'supabase-query',
      sourceEvidence: 'HEAD /rest/v1 com Prefer: count=exact'
    };
  }
};
