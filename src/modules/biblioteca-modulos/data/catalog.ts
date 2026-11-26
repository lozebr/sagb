// Snapshot pinado da fonte oficial.
export const sourceSha = 'f8ed7a678a8424e130c1e6845d916ece992602a4';
export const sourceRoot = 'https://github.com/lozebr/loze-adm/blob/' + sourceSha + '/';
export const catalogUrl = sourceRoot + 'docs/standards/3fb006-catalogo-mestre-modulos-reutilizaveis-loze-v1-17-09-2026.md';
export const reportUrl = sourceRoot + 'docs/reports/3fb006-p0-consolidacao-qualidade-fabrica-cloud-first-v0.1-26-11-2026.md';
export const modules = [
  {
    "number": 1,
    "id": "entity-registry-core",
    "title": "Cadastro de Entidades",
    "description": "cadastro mestre de humanos, organizações, agentes IA, híbridos e sistemas/serviços; papéis, blocos, presets e regras",
    "state": "implemented",
    "version": "0.1.1",
    "automated": true,
    "sql": true,
    "pilotSagB": false,
    "homologated": false,
    "historical": "v0.1.0 — Noivalía / Fornecedor, Preview"
  },
  {
    "number": 2,
    "id": "identity-access-core",
    "title": "Usuários e Autorizações",
    "description": "identidade de acesso, vínculo com entidade, memberships, roles, permissions, sessões, MFA e autorização",
    "state": "implemented",
    "version": "0.1.1",
    "automated": true,
    "sql": true,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 3,
    "id": "audit-timeline-core",
    "title": "Auditoria e Timeline",
    "description": "trilha de auditoria, histórico antes/depois, autoria, eventos e timeline transversal",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 4,
    "id": "files-attachments-core",
    "title": "Arquivos e Anexos",
    "description": "arquivos, anexos, metadados, storage, vínculo com entidades e políticas de acesso",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 5,
    "id": "notification-center-core",
    "title": "Central de Notificações",
    "description": "notificações in-app e orquestração de canais por adapters",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 6,
    "id": "settings-preferences-core",
    "title": "Configurações e Preferências",
    "description": "configurações por usuário, organização, produto e ambiente",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 7,
    "id": "approval-workflow-core",
    "title": "Fluxos de Aprovação",
    "description": "etapas, aprovações, rejeições, responsáveis, gates, SLA e transições",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 8,
    "id": "comments-collaboration-core",
    "title": "Comentários e Colaboração",
    "description": "comentários, respostas, menções e colaboração contextual",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 9,
    "id": "tags-classification-core",
    "title": "Tags e Classificação",
    "description": "tags, categorias, labels e taxonomias configuráveis",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 10,
    "id": "search-filter-views-core",
    "title": "Busca, Filtros e Visualizações",
    "description": "busca, filtros, ordenação, views salvas e preferências de consulta",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 11,
    "id": "import-export-core",
    "title": "Importação e Exportação",
    "description": "importação/exportação CSV/XLSX/JSON, mapeamento, validação e relatórios de erro",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 12,
    "id": "events-webhooks-core",
    "title": "Eventos e Webhooks",
    "description": "eventos internos, subscriptions, webhooks, retries e idempotência",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 13,
    "id": "connector-core",
    "title": "Conectores",
    "description": "contrato comum para providers e integrações externas sem acoplar produtos diretamente",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 14,
    "id": "scheduling-core",
    "title": "Agendamentos",
    "description": "agenda, recorrência, disponibilidade, lembretes e integração com calendários",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 15,
    "id": "documents-templates-core",
    "title": "Documentos e Templates",
    "description": "documentos, templates, versões, renderização e geração padronizada",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 16,
    "id": "rules-engine-core",
    "title": "Motor de Regras",
    "description": "regras declarativas reutilizáveis para condições, ações e transições fora de lógica hardcoded",
    "state": "documented",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 17,
    "id": "billing-subscription-core",
    "title": "Planos e Assinaturas",
    "description": "planos, assinaturas, entitlement, consumo e abstração de cobrança",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 18,
    "id": "metrics-usage-core",
    "title": "Métricas e Consumo",
    "description": "métricas funcionais, quotas, uso, contadores e telemetria de produto",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 19,
    "id": "feature-flags-core",
    "title": "Feature Flags",
    "description": "ativação/desativação de capacidades por ambiente, produto, conta ou usuário",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  },
  {
    "number": 20,
    "id": "ai-runtime-adapter-core",
    "title": "Runtime de IA",
    "description": "contrato comum de execução de IA para Gemini, OpenAI e outros providers, sem expor secrets ao produto",
    "state": "cataloged",
    "version": null,
    "automated": false,
    "sql": false,
    "pilotSagB": false,
    "homologated": false,
    "historical": null
  }
] as const;
export const candidates = [
  {
    "id": "scenario-business-simulation-core",
    "title": "Simulação de cenários de negócio"
  },
  {
    "id": "forms-intake-core",
    "title": "Formulários e intake"
  },
  {
    "id": "reporting-dashboards-core",
    "title": "Relatórios e dashboards"
  },
  {
    "id": "onboarding-guided-setup-core",
    "title": "Onboarding guiado"
  },
  {
    "id": "data-quality-dedup-core",
    "title": "Qualidade e deduplicação de dados"
  },
  {
    "id": "consent-privacy-core",
    "title": "Consentimento e privacidade"
  }
] as const;
export const statusLabels = { implemented:'Implementado', documented:'Somente documentado', cataloged:'Somente catalogado' } as const;
export function filterModules(query:string,status:string) { const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); return modules.filter(m=>(status==='all'||m.state===status)&&norm(m.title+' '+m.id+' '+m.description).includes(norm(query.trim()))); }
