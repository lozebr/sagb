# Changelog do Módulo nagi

Registro de mudanças técnicas, decisões de arquitetura e evolução do módulo **nagi**.

---

## [v3.1.0-central-aplicativos] - 2026-09-18

### Adicionado
- Registro canônico de demonstração em `data/demoProducts.ts`, com identidade por `productId` e histórico dos links antigos preservado.
- Status de demonstração separado do status histórico de publicação: validado, revisar, bloqueado e não verificado.
- Deploy Preview oficial do TaskZei como alvo demonstrável validado.

### Alterado
- `Links publicados` passou a ser **Central de Aplicativos**, em grade única, sem blocos por empresa.
- Regra visual alterada de `1 URL = 1 card` para `1 produto = 1 card`.
- Busca passa a considerar nome, venture, descrição e aliases; filtros permanecem discretos.
- Cards foram compactados para uso em 1366×768, com ação principal `ABRIR` e sem URL/GitHub/Netlify expostos na superfície principal.
- Alvos sem preview/homologação comprovados ficam `⚪ NÃO VERIFICADO` e com ação principal bloqueada.

### Auditoria do dataset
- 32 registros históricos analisados.
- 26 produtos canônicos após consolidação.
- 6 cards duplicados removidos da interface sem apagar histórico.
- Grupos consolidados: EDA 360, QG 3forB, Site 3forB, TaskZei e CRM LOZE/CRM Ziplia.
- NEXO classificado como referência legada do produto oficial LIVZE.

---

## [v1.0.0-formalizacao-inicial] - 2026-04-11

### Adicionado
- Estrutura mínima oficial do módulo em `src/modules/nagi`.
- `manifest.ts`, `routes.tsx`, `pages/NAGIPage.tsx` e `pages/index.ts`.
- `module-doc.ts` com papel, integrações, fluxos e pendências.
- `agent/owner.md` e `agent/persona.md` para responsabilidade e continuidade.
- `changelog.md` para rastreabilidade local.

### Consolidado
- NAGI formalizado como camada de governança estratégica e portfólio de iniciativas.
- Registro explícito de que o módulo não é storage primário nem engine documental.
- Papel do NAGI fixado como etapa de governança na cadeia `CID > NIC > NAGI`.

### Pendências
- Definir owner principal e backup com nome e sobrenome.
- Evoluir de portfólio estático para persistência viva.
- Conectar saídas do NIC à priorização do NAGI.

---

## [v1.0.1-auditoria-higienizacao] - 2026-04-11

### Auditado
- Revisão estrutural da pasta `src/modules/nagi` após formalização inicial.
- Verificação de resíduos óbvios como duplicidades, placeholders técnicos e scaffolds mortos.

### Resultado
- Nenhum resíduo claro removível foi encontrado dentro da estrutura recém-criada do módulo.
- A estrutura foi mantida íntegra por estar aderente ao padrão formal mínimo.

### Observação
- Lacunas como definição de owner e evolução para persistência viva permanecem como pendências formais do módulo, não como lixo estrutural.

---

## [v1.1.0-internalizacao-view] - 2026-04-11

### Alterado
- `pages/NAGIPage.tsx` passou a usar a view internalizada do próprio módulo.
- `components/NAGIView.tsx` foi internalizado em `src/modules/nagi/components/` e ajustado para importar `types.ts` e `components/Icon.tsx` pelos caminhos corretos.

### Adicionado
- `docs/inputs/` como pasta oficial de ingestão documental bruta do módulo.

### Decisão
- O arquivo global legado `components/NAGIView.tsx` permanece temporariamente até revisão final de resíduos e remoção controlada.

---

## [v1.1.1-fechamento-internalizacao] - 2026-04-11

### Ajustado
- `src/modules/nagi/components/NAGIView.tsx` corrigido para usar imports válidos do contexto modularizado.

### Removido
- Componente legado global `components/NAGIView.tsx`, após validação de ausência de referências ativas.

### Resultado
- O NAGI passa a depender apenas da view interna do próprio módulo.

---

## [v2.0.0-mega-refatoracao] - 2026-05-31

### Adicionado
- `repository/nagi.repository.ts` — Interface `INagiRepository` + implementação `LocalStorageNagiRepository` preparada para swap futuro para Supabase.
- `services/nagiPromotionService.ts` — Regras formais de promoção triagem → catálogo (governanceStatus 'aprovada', score >= 50, tipo ≠ 'ideia').
- `services/nagiNicBridge.ts` — Ponte NIC → NAGI: recepção de saídas do NIC com payload tipado e criação automática na triagem.
- `services/nagiHandoffService.ts` — Handoff tracking com status (encaminhado → recebido → processado → finalizado), timestamps e notas do especialista.
- Campos `promotionStatus`, `promotedAt`, `promotedBy`, `handoffRecord` no `NagiItem` (domain/types.ts V2).
- Nova action `'promover' | 'receber_handoff' | 'processar_handoff' | 'finalizar_handoff'` no `NagiDecisionAction`.
- Funções utilitárias: `calculateFinalScore()`, `isEligibleForPromotion()`, `GOVERNANCE_SUBTEXT`, `MATURITY_DESCRIPTIONS`, `PROMOTION_STATUS_LABELS`, `HANDOFF_STATUS_LABELS`.

### Alterado
- `domain/types.ts` — Versão V2 com todos os novos campos e constantes.
- `services/nagiService.ts` — Reesctrito com `Repository Pattern`: usa `nagiRepository` internamente, adiciona `createAvulso()`, `createFromCatalogo()`, `resetToBlueprint()`, e reavalia `promotionStatus` após cada `qualifyItem()` e `decideItem()`.
- `data/nagiBlueprint.ts` — Seed data V2: todos os itens agora incluem `promotionStatus`, `handoffRecord` e dados de handoff realistas.
- `components/NAGIView.tsx` — Reesctrito com Alice UI Standard: abas "Ideias em análise" / "Catálogo", métricas compactas, botão "+ Do NIC" para importação, botão "+ Nova ideia" para criação avulsa, indicador de elegíveis para catálogo com contagem.
- `components/CatalogSection.tsx` — Reesctrito com Alice UI: cards com radius 22px, padding 15px, chips clean, tipografia refinada, indicador de handoff no rodapé do card.
- `components/TriageSection.tsx` — Reesctrito com Alice UI: pipeline visual em 7 colunas, cards compactos com radius 18px, badge de governança, indicador ★ Elegível, descrições de estágio.
- `components/NagiItemDetail.tsx` — Reesctrito com Alice UI: métricas compactas, score bars, handoff tracking com botões de atualização de status, ação de promoção ao catálogo, formulários modais de classificação/qualificação/decisão/encaminhamento com Alice UI inputs.
- `module-doc.ts` — Atualizado para V2 refletindo nova arquitetura, novos serviços e novos campos.
- `services/index.ts` — Exporta todos os 4 serviços.

### Filosofia aplicada
- Alice UI Standard v1.0 (Nível 2 — Aplicação Recomendada)
- Operação Leveza para cards internos
- Lighter language: menos jargão técnico, termos mais diretos
- Repository Pattern para isolamento de persistência
- Regras de promoção explícitas e auditáveis
- Handoff tracking rastreável com timestamps
- Separação clara entre Catálogo (oficial) e Triagem (em análise)

### Pendências para V3
- SupabaseNagiRepository (swap real de persistência)
- Integração viva NIC → NAGI via webhook/RxJS
- Automação de score via IA
- Métricas de funil com gráficos
- Notificações e SLA de governança
- Modo escuro Alice UI
- Testes unitários (Vitest)

---

## [v3.0.0-mega-etapa-03-ingestao-governada] - 2026-06-02

### Adicionado
- `domain/types.ts` recebeu `NagiIngestionDocument`, status de classificação, status de revisão, destinos de ingestão, interpretação sugerida, candidatos de catálogo e histórico de ingestão.
- `NagiItemType` expandido com `treinamento`, `mentoria`, `produto`, `sistema` e `outro` para atender documentos reais do ecossistema.
- `repository/nagiIngestion.repository.ts` com `INagiIngestionRepository` e `LocalStorageNagiIngestionRepository`.
- `services/nagiIngestionClassifier.ts` com classificação heurística inicial: título, resumo, tags, sinais, tipo, categoria, destino, possível duplicata e vínculo com catálogo.
- `services/nagiIngestionService.ts` com entrada manual, lote, revisão, descarte, criação de item, vínculo com catálogo e evidência preservada.
- `components/IngestionSection.tsx` com interface Alice UI para Entrada, Em revisão, Prontos para salvar e Histórico.

### Alterado
- `components/NAGIView.tsx` agora abre em `Documentos`, com abas `Documentos`, `Ideias em análise` e `Catálogo`.
- Header do NAGI passou a destacar documentos, catálogo, triagem e revisão.
- Fluxo visual atualizado para `CID + RAI → NICO → NAGI → NIDE → SADEV`.
- `module-doc.ts` atualizado para V3 com a capacidade de ingestão governada.
- `services/index.ts` e `repository/index.ts` exportam a nova camada de ingestão.

### Regras implementadas
- Documento com forte aderência ao catálogo sugere vínculo ou possível duplicata.
- Documento curto ou pouco claro exige revisão manual.
- Documento com sinais de ideia/oportunidade sugere Triagem.
- Documento com sinais oficiais/consolidados sugere Catálogo.
- Documento salvo como item mantém snapshot, evidência e histórico.
- Documento vinculado ao catálogo vira evidência do item existente.

### Limites da V1
- Leitura direta de arquivos funciona melhor com `.txt`, `.md`, `.csv` e `.json`.
- PDF/DOCX ainda exigem extração externa futura.
- Classificação usa heurísticas locais, sem IA avançada obrigatória.
- Persistência ainda é localStorage, com interface pronta para Supabase.
