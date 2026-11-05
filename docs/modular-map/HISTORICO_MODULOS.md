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

### 2026-11-03 — Correção de diagnóstico Supabase Auth no Deploy Preview NAGI
- Módulo: SagB Auth / Infra Netlify / NAGI (rota protegida).
- Mudança:
  - diferencia configuração ausente, chave API inválida e erro de rede no login;
  - apresenta mensagem compreensível sem remover autenticação ou publicar sessão no console;
  - remove URL e chave Supabase fixas em `[build.environment]` do Netlify TOML, respeitando configuração de contexto do site;
  - adiciona regressão automatizada e registra o diagnóstico no Registro Vivo;
  - bloqueio restante: configuração autorizada de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para `deploy-preview`, depois validar login real com usuário do SagB.
- Tipo: infra / correção / segurança.
- Arquivos afetados:
  - `services/supabase.ts`
  - `components/Auth.tsx`
  - `netlify.toml`
  - `tests/sagb-auth-preview.test.mjs`
  - `docs/story/3fb006-registro-vivo-sagb-v0.1-18-09-2026.md`
- Status: correção de código concluída em `develop`; autenticação end-to-end pendente de configuração do ambiente.

### 2026-11-04 — P0 Reconciliação Observatory × Padrão Supabase LOZE
- Módulo: Monitoramento / Database Observatory; fronteiras do banco operacional SagB e incubadoras.
- Mudança: registro observacional datado de dois projetos Supabase LOZE e schemas reais; classificação explícita de exemplos normativos, owner/manifesto pendentes; inventário de módulos internos/coexistentes/legados; separação entre HEAD no banco SagB e snapshots externos somente leitura; correção de serviço que simulava leitura integral de module-docs.
- Tipo: arquitetura / infra / dados (metadados somente leitura) / UI / segurança.
- Arquivos: `src/modules/monitoramento/services/supabaseEcosystemRegistry.ts`, `src/modules/monitoramento/services/supabaseTablesService.ts`, `src/modules/monitoramento/services/supabaseObservabilityCatalog.ts`, `src/modules/monitoramento/services/index.ts`, `src/modules/monitoramento/pages/MonitoramentoSupabasePage.tsx`, `tests/sagb-supabase-observatory.test.mjs`, `supabase/manifest-sagb-operacional.md`, `src/modules/monitoramento/changelog.md`, Registro Vivo SagB.
- Status: implementação segura em develop, sem alterações de Supabase remoto ou main. Homologação de Auth e live cross-project pendentes.

### 2026-11-04 — Complemento de cobertura modular Supabase
- Módulo: Monitoramento / 30 entradas do registry + 3 legados fora dele.
- Mudança: matriz de dados estendida para cobrir cada módulo registrado, mostrando posição no registry e situação `interno`, `coexistente`, `legado_em_avaliacao` ou `a_classificar` sem inferir schema físico. Teste de paridade do catálogo incluído.
- Tipo: arquitetura / UI / governança.
- Arquivos: `supabaseEcosystemRegistry.ts`, `MonitoramentoSupabasePage.tsx`, `tests/sagb-supabase-observatory.test.mjs`.
- Status: implementado em develop; nenhuma migração/exclusão.

### 2026-11-04 — QG LOZE P0 / Etapa 1A + 1B: acesso e NAGI
- Escopo **apenas** login/senha/sessão/recuperação e módulo NAGI. Adequação ampla Supabase **suspensa**. Sem modificação de outros módulos ou projeto remoto.
- Auth: recuperação por link do ambiente (`/auth/reset-password`), alteração via Supabase Auth, erros genéricos para conta desconhecida, estado de recuperação separado do sistema, refresh token, logout, limpeza de subscrições e fallback sem privilégio tático.
- NAGI: catálogo histórico deduplicado preservado, proveniência de links e Preview exposta, vínculo ao Supabase dos produtos explicitamente não verificado, aviso de persistência local; nenhum schema criado.
- Arquivos: `services/supabase.ts`, `components/Auth.tsx`, `App.tsx`, `src/modules/nagi/data/demoProducts.ts`, `src/modules/nagi/components/PublishedLinksSection.tsx`, `src/modules/nagi/components/NAGIView.tsx`, `src/modules/nagi/module-doc.ts`, `src/modules/nagi/changelog.md`, `tests/sagb-access-nagi-etapa1.test.mjs`, Registro Vivo.
- Status: implementado na `develop`; testes automatizados do adaptador com rede simulada e CI de Preview; **login real bloqueado** por configuração de ambiente Netlify `deploy-preview` sem URL/chave publishable Supabase e ausência de projeto operacional SagB nos conectores atuais. Nenhum bypass, migração, merge ou deploy de produção.

### 2026-11-04 — Etapa 1A/1B — endurecimento pontual do acesso e demonstrações NAGI
- Módulos: Auth SagB e NAGI apenas; adequação ampla Supabase suspensa pela nova orientação QG.
- Auth: autodeclaração de cargo no cadastro não concede privilégios nem tier elevado; verificação inicial de sessão não sobrescreve evento de login/logout posterior.
- NAGI: URL de demonstração sozinha não habilita abertura; status validado + fonte oficial necessária.
- Arquivos: `components/Auth.tsx`, `services/supabase.ts`, `src/modules/nagi/components/PublishedLinksSection.tsx`, `tests/sagb-access-nagi-etapa1.test.mjs`, documentação.
- Banco/Auth remoto e outros módulos inalterados. `develop` somente, PR #6 Draft.
