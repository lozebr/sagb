# Decisões e Pendências — Governança SagB

## Objetivo

Registrar decisões e pendências de governança em formato auditável, conectando a trilha executiva com a trilha técnica do projeto.

## Regras de rastreabilidade

1. Toda decisão relevante deve apontar para item de governança (`governance_id`).
2. Toda pendência deve ter responsável e prioridade.
3. Decisões e pendências devem referenciar, quando aplicável:
   - `DEV_LOG.md`
   - `docs/modular-map/HISTORICO_MODULOS.md`

---

## Decisões (registro inicial)

| decision_id | data | governance_id | decisao | status | responsavel | evidencias | impacto |
|---|---|---|---|---|---|---|---|
| DEC-001 | 2026-04-08 | GOV-FRT-001 | Backup e Segurança não segue como módulo oficial neste ciclo; permanece como frente interna dentro de Governança | FECHADA | Pierre Zanulli | `docs/governanca_sagb/catalogo_unico_governanca.md` + `docs/modular-map/modules/04-governanca-black-vault-e-metodologia.md` | Evita inflação de módulos e mantém coerência estrutural |
| DEC-002 | 2026-04-08 | GOV-CAM-001 | A consolidação deve ocorrer por referência documental, sem duplicação de conteúdo já existente | FECHADA | Pierre Zanulli | `docs/governanca_sagb/_readme.md` | Reduz ruído e divergência entre fontes |
| DEC-003 | 2026-04-08 | GOV-MOD-002 | Tratar NIC como nomenclatura ativa no runtime e manter RIC como alias histórico até normalização final | ABERTA | Pierre Zanulli + QG | `docs/governanca_sagb/mapa_equivalencia_runtime_docs.md` + `docs/modular-map/modules/12-ric.md` | Elimina ambiguidade sem apagar histórico |
| DEC-004 | 2026-04-09 | GOV-MOD-010 | Criar `manifest.ts` e `module-doc.ts` em `src/modules/nucleo-conversacional` como base da ficha do módulo para a UI, antes de mover os componentes legados. | FECHADA | Pierre Zanulli / Cássio Mendes | `src/modules/nucleo-conversacional/manifest.ts` e `module-doc.ts` | Resolve falta de base estrutural para ficha do módulo sem quebrar a UI legada. |
| DEC-005 | 2026-04-09 | GOV-CAM-001 | Instituir o `changelog.md` local dentro da pasta de cada módulo plugável (`src/modules/[modulo]`) como registro histórico do próprio módulo. | FECHADA | Pierre Zanulli | `src/modules/cid/changelog.md` | Permite extrair o módulo com todo o seu histórico preservado. |
| DEC-006 | 2026-04-09 | GOV-MOD-011 | Iniciar a governança do C.I.D na estrutura de módulos via Isolamento Documental (`manifest.ts`, `module-doc.ts`, `changelog.md`). | FECHADA | Pierre Zanulli / Cássio Mendes | `src/modules/cid/*` | Traz o CID para a governança visual de módulos do SagB de forma segura. |
| DEC-007 | 2026-05-02 | GOV-DRIFT-001 | Instituir regra anti-drift documental com 3 controles mínimos: (1) fonte da verdade por tema sem sobreposição; (2) sincronização obrigatória de owner no mesmo PR/ciclo; (3) validação estrutural cruzada entre registry, manifest, pasta agent e tríade documental. | FECHADA | Pierre Zanulli / Matheu Rizzili | `docs/governanca_sagb/padrao_modulos_plugaveis.md` + `docs/governanca_sagb/padrao_agentes_responsaveis.md` + `docs/governanca_sagb/padrao_unificado_governanca.md` | Reduz desvio entre documentação e runtime, melhora handoff e aumenta auditabilidade de ownership. |
| DEC-008 | 2026-05-02 | GOV-VIS-001 | Formalizar o Padrão Visual Canônico do SagB para módulos plugáveis: fonte Inter via padrão global e uso obrigatório de tokens semânticos `--sagb-*`, com vedação de hardcode de cor em UI estrutural. | FECHADA | Pierre Zanulli / Matheu Rizzili | `index.html` + `src/modules/configuracoes-ambiente/services/themeTokens.ts` + `docs/governanca_sagb/padrao_modulos_plugaveis.md` | Consolida previsibilidade visual, reduz drift entre runtime e documentação e fortalece fiscalização de conformidade. |
| DEC-009 | 2026-05-02 | GOV-VIS-002 | Expandir o Padrão Visual Canônico com tipografia interna padronizada (font-inter, text-[12px], hierarquia de pesos, tabela canônica de tamanhos) e header canônico de módulo (badge "Módulo Oficial", nome do módulo, responsável, botão Docs). | FECHADA | Pierre Zanulli / Matheu Rizzili | `docs/governanca_sagb/padrao_modulos_plugaveis.md` (item 7) + `src/modules/nucleo_de_agentes/components/BaseDosAgentesView.tsx` + `src/modules/central_padroes/pages/CentralPadroesPage.tsx` | Torna tipografia e header auditáveis por regex, elimina inconsistência entre módulos e garante owner visível em runtime. |

---

## Pendências (registro inicial)

| pending_id | data | governance_id | pendencia | prioridade | owner | prazo_alvo | status | dependencias | evidencias |
|---|---|---|---|---|---|---|---|---|---|
| PEND-001 | 2026-04-08 | GOV-MOD-001..009 | Definir owner principal e owner backup para todos os módulos oficiais | ALTA | Pierre Zanulli + Efron Torres (QG) | 2026-04-15 | ABERTA | validação executiva de nomes e alçadas | `docs/governanca_sagb/owners_e_accountability.md` |
| PEND-002 | 2026-04-08 | GOV-MOD-002 / GOV-MOD-003 | Fechar nomenclatura e fronteira oficial entre NIC, RAI e RIC | ALTA | Pierre Zanulli + QG | 2026-04-15 | ABERTA | decisão executiva + ajuste de mapeamento documental | `docs/governanca_sagb/mapa_equivalencia_runtime_docs.md` |
| PEND-003 | 2026-04-08 | GOV-MOD-005 / GOV-MOD-006 | Decidir classificação final de Configurações do Ambiente e Telas Avançadas (módulo oficial vs frente/camada) | MÉDIA | Pierre Zanulli + QG | 2026-04-22 | ABERTA | critérios de classificação oficial | `docs/governanca_sagb/catalogo_unico_governanca.md` |
| PEND-004 | 2026-04-08 | GOV-MOD-009 | Consolidar posicionamento macro dedicado de Missões no modular-map | MÉDIA | Cássio Mendes (execução) + QG | 2026-04-22 | ABERTA | validação de taxonomia macro | `docs/ESTRATEGIA_MISSOES_MOTOR_OFICIAL.md` + `docs/governanca_sagb/mapa_equivalencia_runtime_docs.md` |
| PEND-005 | 2026-04-08 | GOV-CAM-001 / GOV-CAM-002 | Definir backup de execução técnica para continuidade operacional | MÉDIA | Pierre Zanulli | 2026-04-22 | ABERTA | definição organizacional | `docs/governanca_sagb/owners_e_accountability.md` |
| PEND-006 | 2026-04-09 | GOV-MOD-010 | Consolidar componentes e serviços legados (ex: `SystemicVision`, `ChatMessage`) dentro de `src/modules/nucleo-conversacional` | MÉDIA | Cássio Mendes | A DEFINIR | ABERTA | Planejamento de refatoração do chat | `src/modules/nucleo-conversacional/module-doc.ts` |
| PEND-007 | 2026-04-09 | GOV-MOD-011 | Extrair e fatiar o componente legado `CIDView.tsx` para a pasta `src/modules/cid/components` | MÉDIA | Cássio Mendes | A DEFINIR | ABERTA | Planejamento de refatoração do CID | `src/modules/cid/changelog.md` |
| PEND-008 | 2026-09-14 | GOV-DEV-EXT-001 | Avaliar evolução do SagB Bridge já documentado para uma extensão oficial de VS Code da Loze/SagB, evitando criar uma segunda ponte concorrente | ALTA | Arquitetura Loze + SagB | A DEFINIR | AGUARDANDO APROVAÇÃO | Definir naming público, escopo e fronteira entre MCP, extensão e SagB Bridge | `docs/Estrutura_SagB/SagB_Bridge_Extensao_VSCode` + `docs/modular-map/modules/13-sagb-bridge.md` |
| PEND-009 | 2026-09-14 | GOV-MON-LOZE-001 | Integrar a Loze à Central de Monitoramento do SagB: atalho já preparado em preview e, depois, status vivo de health/readiness/MCP/conexões | ALTA | Monitoramento SagB + Loze | A DEFINIR | AGUARDANDO APROVAÇÃO | Validar forma de consumo da API e contrato de observabilidade | `src/modules/monitoramento/*` + `https://api.loze.com.br` |
| PEND-010 | 2026-09-14 | GOV-FLX-LOZE-001 | Avaliar convergência do FluxoB com a orquestração da Loze, incluindo hipótese de naming “Loze Fluxos”; objetivo é evitar dois motores de workflow concorrentes | ALTA | Arquitetura Loze + SagB | A DEFINIR | AGUARDANDO APROVAÇÃO | Definir qual camada executa workflows e qual camada atua como UI/control plane | `src/modules/fluxob/plano_modulo.md` + domínio Orchestration da Loze |


---

## Critério de fechamento

- Decisão só pode ficar `FECHADA` com responsável explícito e evidência registrada.
- Pendência só pode ficar `CONCLUÍDA` com atualização no catálogo e no histórico correspondente.
