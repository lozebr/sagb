export const moduleDoc = {
  nomeOficial: 'NAGI — Núcleo Avançado de Gestão de Ideias',
  objetivo:
    'Governar o pipeline completo de recepção, classificação, qualificação, priorização, decisão e encaminhamento de ideias e itens estratégicos do ecossistema SagB, atuando como hub central entre as camadas de preparação (CID, RAI, NIC) e os módulos especialistas.',
  responsavelTecnico: 'Cássio Mendes',
  status: 'V3 — Ativo (ingestão governada + lote + classificação heurística)',
  tipo: 'Módulo Oficial — Núcleo de Governança',

  divisoesInternas: {
    catalogoGovernado:
      'Itens oficiais e reconhecidos do ecossistema: empresas, ventures, metodologias, programas, frameworks, planos, iniciativas consolidadas e estruturas oficiais. Cada item possui score, responsável, handoffRecord com status de recebimento, vínculo com especialista e trilha de governança.',
    triagemIdeias:
      'Itens em qualificação: ideias avulsas, saídas do NIC, hipóteses, propostas e frentes em análise. Cada item percorre estágios de maturidade (entrada → classificação → qualificação → priorização → decisão → encaminhada/catalogada) com score, evidências, promotionStatus e histórico de decisão.',
    ingestaoGovernada:
      'Frente de entrada de documentos relevantes. O documento não vira depósito bruto: ele é lido, classificado por heurísticas, revisado por pessoa e salvo como item em Catálogo ou Triagem, mantendo snapshot e evidência vinculada.',
  },

  tipoCentral: {
    nome: 'NagiItem',
    camposAgrupados: [
      'Identidade (id, title, summary, createdAt, updatedAt)',
      'Origem (avulsa, nic, catalogo) com originRefId e originSnapshot',
      'Classificação (itemType, category, tags)',
      'Maturidade (maturityStage com 7 estágios)',
      'Prioridade (alta, media, baixa)',
      'Score (impacto, esforço, risco, alinhamento, final 0-100)',
      'Status operacional (não iniciado → concluído)',
      'Status de governança (em triagem → arquivada)',
      'Status de promoção (nao_elegivel, elegivel, promovida, rejeitada_catalogo)',
      'Handoff record (target, status encaminhado/recebido/processado/finalizado, timestamps)',
      'Destino especialista (legado: tab + label + motivo)',
      'Responsável (ownerUserId, ownerName)',
      'Evidências (lista com tipo, label, uri, excerpt)',
      'Histórico de decisão (trilha auditável completa)',
    ],
  },

  fluxoArquitetural: 'CID + RAI → NIC → NAGI → Módulos Especialistas',
  fluxoArquiteturalAtualizado: 'CID + RAI → NICO → NAGI → NIDE → SADEV',

  descricaoFluxo: [
    '1. CID prepara material documental interno.',
    '2. RAI observa e capta sinais externos.',
    '3. NICO cruza, interpreta e amadurece leituras estratégicas.',
    '4. NAGI recebe ideias maduras, documentos relevantes e entradas avulsas; classifica, organiza, governa e decide.',
    '5. NIDE e SADEV formalizam, desenvolvem e operacionalizam as iniciativas encaminhadas.',
  ],

  tabelasSupabase: [
    'Nenhuma migração ativa. Itens usam LocalStorageNagiRepository e documentos de ingestão usam LocalStorageNagiIngestionRepository, ambos preparados para swap futuro para Supabase.',
  ],

  bucketsStorage: [
    'Não é storage primário; gerencia evidências referenciadas por uri.',
  ],

  integracoes: [
    'CID (fonte documental estratégica)',
    'RAI (radar de inteligência externa)',
    'NIC (camada interpretativa — NicBridge para entrada de saídas estratégicas)',
    'Memória Contínua (fonte operacional)',
    'Hub de Ventures (gestão de ventures)',
    'Governança (políticas e decisões)',
    'Módulos especialistas (destino de encaminhamento com handoff tracking)',
    'Ingestão manual/lote (documentos relevantes transformados em candidatos governáveis)',
  ],

  estruturasExclusivas: [
    'src/modules/nagi/domain/types.ts (NagiItem + NagiIngestionDocument + enums V3)',
    'src/modules/nagi/repository/nagi.repository.ts (INagiRepository + LocalStorageNagiRepository)',
    'src/modules/nagi/repository/nagiIngestion.repository.ts (INagiIngestionRepository + LocalStorageNagiIngestionRepository)',
    'src/modules/nagi/services/nagiService.ts (CRUD + governança V2 com repo pattern)',
    'src/modules/nagi/services/nagiIngestionClassifier.ts (heurísticas de classificação inicial, vínculo e duplicidade)',
    'src/modules/nagi/services/nagiIngestionService.ts (entrada manual/lote, revisão, criação de item, vínculo e evidência)',
    'src/modules/nagi/services/nagiPromotionService.ts (regra de promoção triagem → catálogo)',
    'src/modules/nagi/services/nagiNicBridge.ts (recepção de saídas do NIC)',
    'src/modules/nagi/services/nagiHandoffService.ts (tracking de handoff para especialistas)',
    'src/modules/nagi/components/NAGIView.tsx (hub orquestrador com abas: Documentos, Triagem, Catálogo e Central de Aplicativos)',
    'src/modules/nagi/components/PublishedLinksSection.tsx (launcher compacto: busca, filtros e um card por produto)',
    'src/modules/nagi/data/demoProducts.ts (registro canônico de demonstração, deduplicado por productId e com histórico preservado)',
    'src/modules/nagi/components/IngestionSection.tsx (entrada, lote, revisão, vínculo, salvamento e histórico)',
    'src/modules/nagi/components/CatalogSection.tsx (catálogo governado — Alice UI)',
    'src/modules/nagi/components/TriageSection.tsx (triagem com pipeline visual — Alice UI)',
    'src/modules/nagi/components/NagiItemDetail.tsx (detalhe + ações de governança, promoção, handoff)',
    'src/modules/nagi/data/nagiBlueprint.ts (dados seed V2 com promotionStatus e handoffRecord)',
    'src/modules/nagi/pages/NAGIPage.tsx',
    'src/modules/nagi/agent/',
    'src/modules/nagi/changelog.md',
  ],

  fluxosPrincipais: [
    '1. Inserir documento por texto colado ou arquivos em lote (txt/md/csv/json na V1).',
    '2. Classificar automaticamente por heurísticas: tipo, categoria, tags, sinais, destino e vínculo com catálogo.',
    '3. Revisar o documento antes de salvar, ajustando título, resumo, tipo, categoria, tags, destino e vínculo.',
    '4. Vincular documento a item existente do catálogo quando houver forte aderência.',
    '5. Criar item novo no Catálogo quando for estrutura oficial consolidada.',
    '6. Criar item novo em Triagem quando for ideia, oportunidade ou item ainda não consolidado.',
    '7. Manter snapshot do conteúdo e evidência `nagi-ingestion://docId` no item criado/vinculado.',
    '8. Executar ações em lote: selecionar documentos e mandar rapidamente para Catálogo ou Triagem.',
    '9. Visualizar histórico da ingestão: recebido, revisado, salvo ou descartado.',
    '10. Continuar usando Catálogo, Triagem, score, governança, promoção e handoff existentes.',
    '11. Abrir a Central de Aplicativos para localizar um produto único e usar apenas preview/homologação explicitamente validado como ação principal.',
  ],

  pendenciasPrincipais: [
    'Persistência real (SupabaseNagiRepository) em vez de localStorage.',
    'SupabaseNagiIngestionRepository para persistência real dos documentos recebidos.',
    'Leitura robusta de PDF/DOCX via backend ou serviço de extração dedicado.',
    'Integração viva com NIC para recebimento automático de saídas (webhook/RxJS).',
    'Integração viva com RAI para captura de sinais externos.',
    'Automação de recomendação de score via IA.',
    'Métricas de funil (entradas, aprovadas, descartadas, encaminhadas, retornos).',
    'Notificações e SLA de governança.',
    'Vinculação bidirecional com módulos especialistas.',
    'Modo escuro Alice UI.',
    'Testes unitários para regras de promoção e handoff.',
  ],
};
