# Historico de Modulos do SagB

Documento de rastreabilidade macro por modulo.

## Formato padrao (usar em todos os modulos)

- Data
- Modulo
- Mudanca
- Tipo (`arquitetura`, `fluxo`, `dados`, `ui`, `infra`, `correcao`)
- Arquivos/tabelas afetados
- Status (`planejado`, `em andamento`, `concluido`)

---

### 2026-09-14 - Reativacao do SagB e launcher geral da Netlify

- Modulo: 02-home-dashboard-e-hub / Plataforma geral
- Mudanca:
  - reativacao operacional do SagB a partir do repositorio oficial `lozebr/sagb`;
  - inventario real da equipe Netlify consolidado em registry dedicado com 47 projetos;
  - `HubView` passa a abrir por padrao na visao `Aplicativos & Links`, mantendo o mapa de ecossistema anterior preservado como visao secundaria;
  - adicao de busca, filtros, cards, abertura em nova aba e copia de URL;
  - item `ecosystem` do menu renomeado visualmente para `Aplicativos & Links`, sem alterar seu ID de navegacao.
- Tipo: arquitetura / fluxo / ui / infra
- Arquivos/tabelas afetados:
  - `components/HubView.tsx`
  - `components/Sidebar.tsx`
  - `data/netlifyLauncherRegistry.ts`
  - `docs/modular-map/HISTORICO_MODULOS.md`
  - `.github/workflows/history-check.yml`
- Correcao de reativacao: workflow de conformidade atualizado de Node 18 para Node 20 porque as dependencias atuais do SagB exigem Node 20+.
- Correcao de Deploy Preview: configuracao Netlify `SECRETS_SCAN_OMIT_KEYS` ajustada apenas no contexto `deploy-preview` para ignorar as variaveis publicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; producao nao alterada.
- Acesso de homologacao: bypass de autenticacao ativado diretamente nesta branch de Deploy Preview para permitir navegacao sem Supabase; a `main` e a producao permanecem sem alteracao.
- Fonte do inventario: Netlify team `adm-mceezrw`, snapshot de 2026-09-14.
- Status: em andamento ate validacao do Deploy Preview.

## Entradas iniciais

### 2026-04-09 - Isolamento documental do Núcleo Conversacional

- Modulo: 03-nucleo-conversacional
- Mudanca: 
  - criação da pasta `src/modules/nucleo-conversacional/` para consolidar os dados da ficha do módulo para a interface.
  - criação de `manifest.ts` e `module-doc.ts` com dados estruturados e tipáveis a partir de `03-nucleo-conversacional.md`.
  - registro do manifesto em `src/core/modules/moduleRegistry.ts`.
- Tipo: arquitetura / fluxo
- Arquivos/tabelas afetados:
  - `src/modules/nucleo-conversacional/manifest.ts`
  - `src/modules/nucleo-conversacional/module-doc.ts`
  - `src/core/modules/moduleRegistry.ts`
  - `docs/governanca/DECISOES_E_PENDENCIAS.md`
- Status: concluido

### 2026-04-07 - Ajustes operacionais em Auth/Admin, CID e realtime (estabilidade e sincronizacao)

- Modulo: 05-cadastro-e-dna-de-agentes / Auth-Admin / CID Processor / Infra Supabase
- Mudanca:
  - ajustes no fluxo de cadastro/gestao em `AgentFactory` e refinamentos de navegacao/estado na `Sidebar`;
  - atualizacoes no client e no backend de administracao (`services/authAdmin.ts` e `netlify/functions/auth-admin.mjs`) para reforcar consistencia de chamadas e comportamento operacional;
  - atualizacoes em `netlify/functions/cid-processor.mjs` para melhorar robustez de processamento;
  - inclusao de migracao para habilitacao de realtime no Supabase (`20260408000001_enable_realtime.sql`);
  - sincronizacao de dependencias refletida em `package.json` e `package-lock.json`.
- Tipo: fluxo / infra / correcao
- Arquivos/tabelas afetados:
  - `components/AgentFactory.tsx`
  - `components/Sidebar.tsx`
  - `services/authAdmin.ts`
  - `netlify/functions/auth-admin.mjs`
  - `netlify/functions/cid-processor.mjs`
  - `supabase/migrations/20260408000001_enable_realtime.sql`
  - `package.json`
  - `package-lock.json`
- Status: concluido

### 2026-04-06 - Expansao modular: Mentorias, Metodologias e Monitoramento (estrutura, rotas e dados)

- Modulo: 06-mentorias / 10-metodologias / 11-monitoramento / Core de modulos / Infra Supabase
- Mudanca:
  - consolidacao do modulo de mentorias com hooks, servicos, tipos e paginas de detalhe/biblioteca;
  - introducao do modulo metodologias com catalogo, edicao de ativo/canonico, comparacao, promocao assistida, relacoes visuais e lifecycle de snapshots;
  - introducao do modulo monitoramento com manifest, rotas, paginas, componentes e servicos de catalogo;
  - atualizacao do registro central de modulos e contratos de tipos compartilhados para acomodar os novos contextos;
  - inclusao/ajuste de migracoes Supabase para mentorias e trilha canonica de metodologias (estruturacao, blocos, promocao, versionamento, snapshots e relacoes).
- Tipo: arquitetura / fluxo / dados / infra
- Arquivos/tabelas afetados:
  - `src/core/modules/moduleRegistry.ts`
  - `src/modules/mentorias/**`
  - `src/modules/metodologias/**`
  - `src/modules/monitoramento/**`
  - `services/supabase.ts`
  - `types.ts`
  - `supabase/config.toml`
  - `supabase/migrations/20260403000001_create_mentorias_tables.sql`
  - `supabase/migrations/20260405000001_metodologias_fluxo_estruturacao.sql`
  - `supabase/migrations/20260405000002_metodologias_blocos_estruturacao.sql`
  - `supabase/migrations/20260405000003_metodologias_promocao_canonica.sql`
  - `supabase/migrations/20260405000004_metodologias_blocos_canonicos.sql`
  - `supabase/migrations/20260405000005_metodologias_versionamento_canonico_inicial.sql`
  - `supabase/migrations/20260405000006_metodologias_snapshot_versao_canonica.sql`
  - `supabase/migrations/20260406000007_metodologias_snapshot_canonico_lifecycle.sql`
  - `supabase/migrations/20260406000008_metodologias_relacoes_canonicas.sql`
- Status: concluido

### 2026-04-05 - Hotfix deploy: auth-admin resiliente a variaveis Supabase ausentes

- Modulo: Infra / Netlify Functions / Integracao Supabase
- Mudanca:
  - eliminacao do crash em cold-start da funcao `auth-admin` quando variaveis Supabase estao ausentes;
  - criacao de validacao explicita de ambiente com retorno controlado `500` + lista de variaveis faltantes, substituindo erro opaco `502`;
  - adicao de aliases seguros de leitura para runtime (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) mantendo nomes preferenciais;
  - documentacao padronizada das variaveis obrigatorias de producao no padrao de stack/infra.
- Tipo: infra / correcao
- Arquivos/tabelas afetados:
  - `netlify/functions/auth-admin.mjs`
  - `docs/standards/stack-e-infra.md`
  - `docs/modular-map/HISTORICO_MODULOS.md`
- Status: concluido

### 2026-03-21 - Personalizacao baseada no usuario logado (Humano autenticado)

- Modulo: 01-plataforma-base-e-shell / 03-nucleo-conversacional / 02-home-dashboard-e-hub
- Mudanca:
  - topbar do DashboardHome refatorada para saudar explicitamente o usuario autenticado ("Bem-vindo, Nome").
  - Sidebar agora reflete o nome, cargo (tier) e avatar real persistido no banco de dados (`users` table).
  - chat multiagente (`SystemicVision.tsx`) e Componente de mensagem (`ChatMessage.tsx`) exibem corretamente a foto de avatar real do humano que esta logado, substituindo o fallback fixo.
  - prompt principal (`SystemicVision.tsx` e `App.tsx` no canal direto) foi ajustado. Os agentes agora recebem o contexto dinamico `[Contexto Sistemico]: O usuario interagindo nesta conversa e [NOME] ([CARGO]). Responda diretamente a ele.`
- Tipo: ui / fluxo
- Arquivos/tabelas afetados:
  - `App.tsx`
  - `components/Sidebar.tsx`
  - `components/DashboardHome.tsx`
  - `components/SystemicVision.tsx`
  - `components/ChatMessage.tsx`
- Status: concluido

### 2026-03-21 - Quadro de Elite: Sincronização Automática do Status DNA (ET-02)

- Modulo: 05-cadastro-e-dna-de-agentes
- Mudanca:
  - Adicionado `dnaStatus: 'DNA_COMPLETO'` no update de agente do fluxo de salvar DNA (`handleUpdateAgentData`).
  - Agentes nascem "SEM_DNA" e passam a "DNA_COMPLETO" assim que a Governança atualiza as instruções (`agent_dna_profiles` / `agent_dna_effective`).
  - O conteúdo do DNA continua não trafegando no cadastro e protegido no RLS de `agent_configs/effective`. Apenas o ponteiro refletiu na tabela de listagem do Quadro.
- Tipo: fluxo / dados
- Arquivos/tabelas afetados:
  - `App.tsx`
  - tabela `agents`
- Status: concluido

### 2026-03-21 - Quadro de Elite (cadastro estrutural) com melhoria de clareza e qualidade

- Modulo: 05-cadastro-e-dna-de-agentes
- Mudanca:
  - adicao de alternancia entre colunas essenciais e avancadas na listagem de agentes do Quadro de Elite;
  - reforco de validacoes de cadastro (funcao principal obrigatoria, stack permitida obrigatoria e coerencia do modelo preferencial);
  - ajuste semantico de persistencia para evitar fallback silencioso entre funcao principal e cargo-base;
  - melhoria de microcopy no formulario para reduzir ambiguidade de conceitos;
  - adicao de mensagem de impacto por status estrutural para orientar decisao operacional.
- Tipo: fluxo
- Arquivos/tabelas afetados:
  - `components/AgentFactory.tsx`
  - tabela `agents`
- Status: concluido

### 2026-03-13 - Mapeamento modular consolidado

- Modulo: Plataforma geral (todos)
- Mudanca: consolidacao do mapa modular com 13 modulos, blueprint final e prompts por modulo.
- Tipo: arquitetura
- Arquivos/tabelas afetados:
  - `docs/modular-map/README.md`
  - `docs/modular-map/blueprint-final.md`
  - `docs/modular-map/chat-prompts.md`
  - `docs/modular-map/modules/*.md`
- Status: concluido

### 2026-03-20 - Organizacao documental padrao do SagB

- Modulo: Documentacao transversal
- Mudanca: criacao de base de padroes globais para replicacao em novos sistemas do GrupoB.
- Tipo: infra
- Arquivos/tabelas afetados:
  - `docs/README.md`
  - `src/modules/central-padroes/docs/_readme.md`
  - `src/modules/central-padroes/docs/design-system.md`
  - `src/modules/central-padroes/docs/stack-e-infra.md`
  - `docs/modular-map/HISTORICO_MODULOS.md`
- Status: concluido

### 2026-03-20 - Ajustes tecnicos no chat multiagente (memoria, sessao e governanca)

- Modulo: 03-nucleo-conversacional / 08-memoria-continua / 04-governanca-black-vault-e-metodologia
- Mudanca:
  - abertura de historico por `sessionId` exato no fluxo `ConversationsView -> App -> SystemicVision`;
  - consolidacao de aprendizado com fan-out para todos os agentes participantes da conversa;
  - padronizacao da heranca de contexto global/compliance em providers via `governanceContext`, com merge central no backend (`netlify/functions/ai.mjs`).
- Tipo: fluxo
- Arquivos/tabelas afetados:
  - `App.tsx`
  - `components/SystemicVision.tsx`
  - `services/deepseek.ts`
  - `services/llamaLocal.ts`
  - `services/providerProxy.ts`
  - `netlify/functions/ai.mjs`
  - tabela `agent_memories`
- Status: concluido
