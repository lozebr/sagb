# 3FB006 — SDVU — Relatório de Auditoria Arquitetural Profunda do SAG B — v0.1 — 03-11-2026

**Produto:** SAG B  
**Repositório:** `lozebr/sagb`  
**Branch auditada:** `develop`  
**Baseline auditada:** `ecc876aefe9187dc0e918f8d64ed38d9ecddb8d0`  
**Escopo:** auditoria arquitetural read-only do código funcional; apenas este relatório e o Registro Vivo podem ser alterados.  
**Status da recomendação:** 🟡 AGUARDANDO APROVAÇÃO  
**Produção/main:** não alteradas.

---

# 1. Resumo executivo

## Conclusão técnica

A evidência **não sustenta reconstrução do zero**.

A estratégia tecnicamente recomendada é:

> **🟣 STRANGLER / REMODELAÇÃO GRADUAL**, preservando dados, contratos e módulos maduros, enquanto shell, persistência legada, duplicidades e superfícies inseguras são substituídos por ondas controladas.

A remodelação profunda é necessária, mas deve ser executada **dentro de uma estratégia strangler**, e não como uma refatoração “big bang”.

### Por quê

O SAG B já possui patrimônio técnico materializado:

- **1.759 arquivos** no baseline auditado;
- **1.424 arquivos em `src/`**;
- **33 diretórios de módulo** em `src/modules/`;
- **30 módulos registrados** no registry central;
- **72 migrations Supabase**;
- **13 Netlify Functions**;
- **162 arquivos de serviços** identificados;
- Supabase com Auth, RLS, Storage, Realtime/estruturas de persistência e múltiplos domínios reais;
- API SAG B, CID, TaskZei, Central de Padrões, Gestão Financeira, Núcleo Conversacional, NAGI, NIDE, Hub de Integrações e outros módulos com implementação materializada;
- baseline atual com **Build, History Compliance, NAGI UI Smoke e Deploy Preview verdes** no SHA auditado;
- `develop` está **35 commits à frente de `main` e 0 atrás** no momento da auditoria.

Ao mesmo tempo, existe dívida arquitetural relevante:

- `App.tsx`: **2.131 linhas**, 38 `useState`, 17 `useEffect`, 122 condicionais `if`, 203 usos de ternário e operações diretas de persistência;
- `services/supabase.ts`: **2.986 linhas**, funcionando como shim/compatibilidade de persistência;
- `components/SystemicVision.tsx`: ~180 KB;
- coexistência entre componentes globais antigos e módulos novos;
- persistência em `localStorage` em áreas que deveriam ser server-side;
- mocks/fallbacks ativos em módulos ainda não maduros;
- duplicação quase integral de domínios;
- segurança serverless heterogênea;
- cobertura automatizada insuficiente para uma reescrita segura.

A combinação “muito patrimônio reutilizável + dívida concentrada em camadas específicas + baixa cobertura global” é o cenário clássico em que **strangler reduz risco e preserva valor**.

---

# 2. Mapa atual do SAG B

```text
Browser / React / Vite
│
├── App.tsx (shell legado + composição + auth gate + estado global + rotas/tab dispatch)
│   ├── components/* (legado/global)
│   ├── src/core/modules/moduleRegistry.ts
│   ├── src/core/modules/moduleActivation.ts
│   └── src/core/navigation/sagbNavigate.ts
│
├── src/modules/* (33 diretórios)
│   ├── 30 registrados no moduleRegistry
│   ├── manifests + routes + module-doc na maioria
│   ├── serviços/stores/hooks próprios em vários módulos
│   └── coexistência de módulos globais + domínios internos NIDE
│
├── services/*
│   ├── supabase.ts (shim grande)
│   ├── providers IA
│   ├── memória/contexto
│   └── storage
│
├── Supabase
│   ├── 72 migrations
│   ├── Auth
│   ├── tabelas por domínio
│   ├── RLS heterogênea
│   ├── Storage
│   └── dados/contratos já materializados
│
├── Netlify Functions (13)
│   ├── AI
│   ├── API SAG B
│   ├── CID
│   ├── WhatsApp / e-mail
│   ├── RAI
│   └── governança
│
└── CI / Deploy
    ├── GitHub Actions
    ├── Netlify Deploy Preview
    └── produção via main
```

## Baseline executável

No SHA `ecc876a...`:

- 🟢 Build (Supabase stack): success;
- 🟢 Enforce History Compliance: success;
- 🟢 NAGI UI Smoke / Chromium: success;
- 🟢 Deploy to Netlify: success;
- 🟢 Netlify Deploy Preview: success;
- 🟢 PR #6 permanece draft e não mergeado;
- 🟢 produção não foi promovida.

**Evidência arquitetural:** existe uma baseline funcional com esteira de preview e capacidade de rollback por Git. Isso reduz fortemente a justificativa para reescrita total.

---

# 3. Auditoria por camada

| Camada | Classificação | Evidência |
|---|---|---|
| Shell / `App.tsx` | 🟣 EXTRAIR / MODULARIZAR | 2.131 linhas; 38 estados React; 17 effects; 122 `if`; 203 ternários; auth, roteamento, BU hardcoded, persistência e composição no mesmo arquivo. |
| Registry central | 🟢 PRESERVAR | 30 módulos plugáveis registrados; manifests + routes já funcionam como fronteira de modularização. |
| Ativação/ordem de módulos | 🟡 SUBSTITUIR GRADUALMENTE | Contrato é útil, mas toggles/ordem/lock vivem em `localStorage` e não são governança central multiusuário. |
| Navegação | 🟠 REFATORAR | Existe `sagbNavigate` por CustomEvent, mas App ainda resolve tabs, paths e exceções manualmente. |
| Componentes raiz `components/*` | 🟡 SUBSTITUIR GRADUALMENTE | Há implementações legadas ainda consumidas e versões novas dentro de módulos; remover em big bang causaria regressão. |
| `services/supabase.ts` | 🟣 EXTRAIR / MODULARIZAR | 2.986 linhas; concentra auth, compatibilidade Firestore-like, normalização e acesso a dados de múltiplos domínios. |
| Supabase / schema | 🟢 PRESERVAR | 72 migrations, múltiplos domínios e políticas RLS; perda/recriação teria alto risco de dados e contratos. |
| Migrations | 🟢 PRESERVAR | Histórico incremental e contratos de tabelas são ativos essenciais de migração/rollback. |
| Auth frontend | 🟠 REFATORAR | Gate global funciona via Supabase Auth, mas autorização granular não é uniforme entre módulos/endpoints. |
| Netlify Functions | 🟡 SUBSTITUIR GRADUALMENTE | Funções reais existem, porém autenticação, assinatura, rate limiting e exposição de service-role são inconsistentes. |
| API SAG B | 🟢 PRESERVAR | Router próprio, assinatura Meta, audit/API keys, testes e contratos versionados; deve ser endurecido, não refeito. |
| Integrações | 🟡 SUBSTITUIR GRADUALMENTE | Hub tem conectores reais, mas credenciais ainda podem ficar no browser e há drivers incompletos/fallbacks. |
| IA / providers | 🟣 EXTRAIR / MODULARIZAR | Multi-provider já existe e é valioso, mas `ai.mjs` é grande e endpoint não mostra autenticação de consumidor antes de chamar providers. |
| localStorage | 🟡 SUBSTITUIR GRADUALMENTE | Útil para preferências/cache, inadequado como fonte canônica para credenciais e domínios governados. |
| Mocks / fallbacks | 🟠 REFATORAR | Existem como compatibilidade/dev em NAGI, NIC, Sala Dev, Central de Padrões e outros. Devem ser explicitamente isolados por ambiente. |
| Dependências | 🟠 REFATORAR | React/Vite/Supabase atuais, porém `package.json` possui Vite em dependencies e devDependencies com majors diferentes; ausência de lint/typecheck oficial. |
| Segurança | 🔴 REMOVER / ARQUIVAR | Não a camada inteira: remover padrões inseguros específicos — segredo no browser, “criptografia” mock, defaults inseguros e handlers service-role sem auth explícito. |
| Testes | 🟠 REFATORAR | Há testes valiosos, mas `npm test` executa apenas `tests/*.test.mjs`; testes TS em módulos ficam fora da suíte padrão. |
| Build | 🟢 PRESERVAR | Baseline Vite atual compila e CI está verde. |
| Deploy Preview | 🟢 PRESERVAR | Preview Netlify por PR oferece homologação e rollback seguros. |
| Responsividade | 🟠 REFATORAR | NAGI possui smoke desktop/tablet/mobile, mas não há suíte equivalente sistêmica para todo o SAG B. |
| Documentação modular | 🟢 PRESERVAR | Maioria dos módulos possui manifest/module-doc/changelog/decisions; é um ativo de migração. |
| Documentação histórica | 🟠 REFATORAR | README e docs contêm nomenclaturas/arquiteturas de fases diferentes; precisam reconciliação, não exclusão automática. |
| Branches | 🟠 REFATORAR | 9 branches visíveis; há nomes históricos/duplicados de migração e main/develop sem ruleset GitHub visível. |
| Código morto | ⚪ INVESTIGAR | Existem candidatos fortes, mas remoção só após grafo de referências + telemetria/paridade. |
| Duplicidades | 🟡 SUBSTITUIR GRADUALMENTE | Duplicações exatas e quase exatas comprovadas; consolidar por domínio, preservando fallback até caracterização. |

---

# 4. Auditoria por módulo

## Matriz principal

| Módulo | Classificação | Evidência objetiva |
|---|---|---|
| `.centro_de_estudos` | 🔴 REMOVER / ARQUIVAR | Não registrado; 11 arquivos/~10 KB; manifest/doc genéricos; sem pages/components/services. Arquivar após confirmar ausência de import/referência. |
| `_orquestracao-principal` | ⚪ INVESTIGAR | Não registrado; declara responsabilidade por App/Sidebar/rotas, mas essa função hoje está materializada no core/App. Pode ser documentação/POC concorrente. |
| `agentes_comerciais` | 🟢 PRESERVAR | Módulo registrado; pages/components/services/store próprios. |
| `api_sagb` | 🟢 PRESERVAR | 63 arquivos; 5 testes; docs de contrato; router serverless robusto com API key/signature/audit. Hardening pontual necessário. |
| `cadastro-empresas` | 🟢 PRESERVAR | Módulo registrado com 3 pages, serviços de lookup/persistência/logo e runtime bridge. |
| `central_padroes` | 🟢 PRESERVAR | 373 arquivos; 26 serviços; 6 testes; Supabase declarado fonte canônica; RLS granular em migrations; alto valor de governança. |
| `cid` | 🟠 REFATORAR | Pipeline real + tabelas + storage + processor/search, porém funções usam service-role e `cid-search` não apresenta auth explícita no handler; UI/processor grandes e sem testes. |
| `configuracoes-ambiente` | 🟢 PRESERVAR | Registry ativo e contratos de tokens/configuração próprios; deve absorver hardcodes do shell. |
| `crm_ziplia` | 🟡 SUBSTITUIR GRADUALMENTE | Documentação declara migração em andamento para runtime nativo; não deve ser apagado nem tratado como concluído. |
| `fluxob` | ⚪ INVESTIGAR | Manifest registrado como inactive; docs dizem pre-alpha e “nenhum asset de código existe ainda”. Manter como planejamento, não como runtime crítico. |
| `foco_total` | 🟢 PRESERVAR | MVP funcional e fronteira clara; persistência local explicitamente assumida no estágio atual. |
| `gestao_financeira` | 🟢 PRESERVAR | Core v2, schema `finance`, services bancários e testes de webhook; revisar autorização/RLS, mas domínio deve permanecer. |
| `hub-integracao` | 🟡 SUBSTITUIR GRADUALMENTE | Integrações reais, porém CredentialManager usa `localStorage`; “encryption” atual é reversível; tokens `VITE_*` podem ser lidos no cliente. |
| `karaoke` | 🟢 PRESERVAR | Pequeno e isolado; baixo acoplamento e custo de manutenção baixo. |
| `mcp_sagb` | 🟠 REFATORAR | Contratos e docs úteis, mas parte do escopo é mock/real e precisa separar conhecimento, automação local e runtime de produção. |
| `mentorias` | 🟡 SUBSTITUIR GRADUALMENTE | NIDE já contém domínio interno de Mentorias e docs NIDE declaram migração concluída, mas módulo original continua como fallback. |
| `metodologias` | 🟡 SUBSTITUIR GRADUALMENTE | 37 arquivos comuns com `nide/domains/metodologias`; **34 são blobs exatamente iguais**. Consolidar somente após paridade/rotas/testes. |
| `missoes` | 🟡 SUBSTITUIR GRADUALMENTE | NIDE declara Missões incorporado como core funcional, enquanto módulo global permanece registrado como fallback. |
| `monitoramento` | 🟠 REFATORAR | Contrato de observabilidade é valioso, porém docs listam várias fontes externas sem evidência equivalente de cobertura automatizada/integração completa. |
| `nagi` | 🟡 SUBSTITUIR GRADUALMENTE | Central de Aplicativos e pipeline de governança são reais; persistência principal de itens/ingestão ainda é LocalStorage Repository. |
| `nic` | 🟡 SUBSTITUIR GRADUALMENTE | UI/serviço existem, mas module-doc confirma dados mockados e varredura simulada; migrar para fonte real sem perder UX/contratos. |
| `nide` | 🟢 PRESERVAR | Arquitetura de domínio interno, redirects e fallback explícitos; é o destino de consolidação de Missões/Metodologias/Mentorias. Precisa testes antes de remover originais. |
| `nucleo-conversacional` | 🟣 EXTRAIR / MODULARIZAR | Fluxo real, Supabase, multi-provider, memória e instrumentação; porém depende de `SystemicVision.tsx` global ~180 KB e serviços raiz. |
| `nucleo_de_agentes` | 🟢 PRESERVAR | Docs registram fusão concluída com Quadro de Elite; `agents` é fonte canônica e ativos de CRUD foram incorporados. |
| `quadro_de_elite` | 🔴 REMOVER / ARQUIVAR | Não registrado; docs do Núcleo de Agentes dizem que foi fundido; AgentFactory e subárvore têm duplicações exatas/quase exatas. Arquivar após teste de paridade. |
| `rai` | 🟠 REFATORAR | Persistência/config/captura reais; função usa service-role e faz fetch de URLs configuráveis sem autenticação explícita no handler — exigir auth + controles SSRF/allowlist. |
| `sagb_bridge` | ⚪ INVESTIGAR | Migrations/blueprint/contratos existem, mas docs dizem etapas essenciais da extensão/backend ainda pendentes. Preservar artefatos, não presumir maturidade. |
| `sala-dev` | 🟣 EXTRAIR / MODULARIZAR | 128 arquivos/~2,1 MB; serviços próprios, mas também possui mocks e duplicatas com `components/dev-room` raiz. |
| `simulador-mentorias` | ⚪ INVESTIGAR | v0.1; modelo e tabelas planejadas, persistência ainda não comprovada no módulo. |
| `studio` | 🟠 REFATORAR | Pipeline real e tabelas/storage documentados; `StudioPage.tsx` ~94 KB, forte candidato a decomposição sem reescrita do domínio. |
| `taskzei` | 🟢 PRESERVAR | 76 arquivos/~1,2 MB; v1.17; Supabase, documentos, EAV, anexos, notificações e integrações; patrimônio funcional alto. |
| `telas_avancadas` | 🟠 REFATORAR | Viewer sandbox reutilizável e contrato claro, mas persistência local e HTML arbitrário exigem revisão de segurança/persistência. |
| `videos-ia` | ⚪ INVESTIGAR | Módulo registrado e pequeno (~12 KB), porém documentação é genérica e não comprova maturidade suficiente. |

---

# 5. Duplicidades e legado comprovados

## Duplicidade NIDE x Metodologias

Entre:

- `src/modules/metodologias/`
- `src/modules/nide/domains/metodologias/`

foram encontrados:

- **37 caminhos equivalentes**;
- **34 arquivos com o mesmo blob SHA**, portanto conteúdo exatamente igual;
- apenas `index.ts`, `routes.tsx` e `services/metodologiasPersistencia.ts` divergem minimamente.

**Classificação:** 🟡 SUBSTITUIR GRADUALMENTE.  
**Ação futura:** escolher fonte canônica, criar testes de caracterização, redirecionar consumidores e só depois arquivar cópia.

## Quadro de Elite x Núcleo de Agentes

- `quadro_de_elite` não está no registry;
- module-doc de `nucleo_de_agentes` registra fusão oficial;
- `AgentFactory.tsx` de `nucleo_de_agentes` e `quadro_de_elite` têm blob SHA igual;
- múltiplos arquivos de `agent-factory/` são iguais ou quase iguais.

**Classificação:** 🔴 REMOVER / ARQUIVAR, mas somente após paridade de rota/CRUD.

## Componentes raiz x módulos

Exemplos:

- `components/DevRoomView.tsx` x `src/modules/sala-dev/components/DevRoomView.tsx`;
- `components/NAGIView.tsx` x implementação modular do NAGI;
- `components/AgentFactory.tsx` x versões dentro de módulos.

**Classificação:** 🟡 SUBSTITUIR GRADUALMENTE.  
O problema é coexistência de gerações de arquitetura, não ausência de arquitetura.

---

# 6. Dados e funcionalidades que não podem ser perdidos

A reescrita total exigiria reproduzir e migrar, no mínimo:

1. identidade e DNA de agentes: `agents`, `agent_configs`, `agent_dna_*`;
2. chat: sessões, mensagens, memórias, anexos e eventos de qualidade;
3. governança: cultura, regras, vault, knowledge, auditoria;
4. CID: assets, arquivos, jobs, chunks, outputs, tags e links;
5. TaskZei: tarefas, documentos, links, anexos, notificações, campos EAV, auditoria;
6. Central de Padrões: padrões, documentos, decisões, checklists, aprovações, evidências, embeddings/índices;
7. Gestão Financeira: plano de contas, transações, conciliações e integrações;
8. RAI: configs e capturas;
9. Hub: inbox e eventos de integração;
10. API SAG B: API keys, audit log, integration events e WhatsApp;
11. Studio: sessões, chunks, arquivos de câmera e áudio;
12. histórico de migrations/RLS e compatibilidade com dados já persistidos.

**Conclusão:** o custo de uma reescrita não é “refazer telas”; é reconstruir contratos, migrar dados, reproduzir comportamento implícito e provar paridade de dezenas de fluxos.

---

# 7. Riscos críticos

## 🔴 P0 — Credenciais no browser

`src/modules/hub-integracao/services/credentialManager.ts`:

- armazena credenciais em `localStorage`;
- comentário reconhece que é “Mock local”;
- `encrypt()` atualmente apenas retorna `enc_${text}`;
- `decrypt()` remove o prefixo;
- logo não existe criptografia real.

Também há leitura cliente de:

- `VITE_HUB_CLICKUP_API_TOKEN`;
- `VITE_HUB_WABA_ACCESS_TOKEN`;
- `VITE_HUB_WHATSAPP_QR_API_KEY`;
- `VITE_GOOGLE_CLIENT_SECRET`.

**Risco:** exfiltração de credenciais via bundle/browser/XSS/extensões.

## 🔴 P0 — Netlify Functions com service-role sem autenticação explícita

Handlers como:

- `cid-search.mjs`;
- `cid-processor.mjs`;
- `rai-rss-fetch.mjs`;
- `governance-sync-doc.mjs`;
- `email-sync-background.ts`;

criam cliente Supabase com service-role e não apresentam validação explícita de usuário/chamada no início do handler.

**Risco:** bypass de RLS e acesso/escrita privilegiada se o endpoint estiver publicamente alcançável.

## 🔴 P0 — AI proxy exposto sem gate do consumidor

`/api/ai` redireciona para `netlify/functions/ai.mjs`.

O handler:

- aceita POST;
- escolhe `action`;
- usa chaves server-side de Gemini/OpenAI/Claude/DeepSeek etc.;
- não apresenta autenticação/autorização do chamador antes de executar.

**Risco:** uso indevido, consumo financeiro e abuso de providers.

## 🔴 P0 — WhatsApp webhook legado sem assinatura do POST

`whatsapp-webhook.mjs`:

- possui token de verificação default `sagb_hub_verify_2026`;
- aceita inbound POST com payload `whatsapp_business_account`;
- não valida `X-Hub-Signature-256` no handler legado.

Em contraste, `api-sagb-router.mjs` já possui validação HMAC/assinatura.

**Risco:** dois caminhos com níveis de segurança diferentes para o mesmo domínio.

## 🔴 P0 — Titan recebe usuário/senha no payload

`email-titan-driver.ts` exige `credentials.email` e `credentials.password` no corpo da requisição.

**Risco:** credencial atravessa o frontend/rede/aplicação; deve migrar para segredo server-side referenciado por integrationId.

## 🟠 P1 — RAI e SSRF

`rai-rss-fetch.mjs` executa `fetch(sourceUrl)` para URLs vindas da configuração persistida.

**Risco:** sem allowlist/proteção de rede, fonte maliciosa pode induzir requisições server-side indevidas.

## 🟠 P1 — RLS heterogênea

Há áreas com RLS granular, como Central de Padrões, e outras com políticas amplas `authenticated all` ou service-role.

**Risco:** autorização inconsistente entre domínios.

---

# 8. Dívida arquitetural

## Alta

1. `App.tsx` monolítico;
2. `services/supabase.ts` monolítico;
3. componentes globais antigos coexistindo com módulos;
4. segurança de credenciais do Hub;
5. serverless com service-role sem auth uniforme;
6. duplicidade NIDE x módulos originais;
7. ausência de suíte global de caracterização;
8. roteamento/tab system híbrido;
9. business units hardcoded no App;
10. fontes de verdade múltiplas: Supabase, localStorage, mocks e fallbacks.

## Média

- moduleRegistry não cobre 3 diretórios com manifest;
- manifests não possuem contrato suficientemente rico de dependências/permissões;
- ausência de typecheck/lint como gate;
- Vite aparece em dependencies e devDependencies com majors diferentes;
- docs e README representam fases diferentes;
- responsividade sistêmica não é automatizada;
- branches históricas coexistem sem ruleset GitHub visível.

## Baixa / controlável

- módulos pequenos e isolados;
- wrappers/aliases de compatibilidade;
- dados seed/fallback quando explicitamente limitados a dev.

---

# 9. Testes, build e QA

## O que existe

- testes Node em `tests/*.test.mjs`;
- testes TypeScript em `api_sagb`, `central_padroes` e `gestao_financeira`;
- smoke Chromium específico do NAGI;
- Artillery/load spec para API SAG B;
- build Vite no CI;
- Deploy Preview Netlify.

## Lacuna

O script:

```json
"test": "node --test tests/*.test.mjs"
```

**não executa automaticamente** os testes `.ts` existentes em `src/modules/**/__tests__`.

Também não existe script oficial de:

- `typecheck` com `tsc --noEmit`;
- lint;
- teste de integração Supabase local;
- smoke sistêmico do shell e de todos os módulos;
- contract test do registry/rotas;
- segurança automatizada dos Netlify Functions.

**Impacto na decisão:** reconstruir do zero com essa cobertura elevaria radicalmente o risco de regressão silenciosa.

---

# 10. Comparação — REMODELAR x STRANGLER x RECONSTRUIR

| Critério | Remodelar profundamente | Strangler / gradual | Reconstruir do zero |
|---|---|---|---|
| Risco geral | 🟠 Médio/alto se big bang | 🟢 Menor e controlável | 🔴 Muito alto |
| Tempo até melhorar partes críticas | 🟠 Médio | 🟢 Curto por ondas | 🔴 Longo até paridade |
| Reaproveitamento | 🟢 Alto | 🟢 Muito alto | 🔴 Baixo/médio |
| Perda potencial de funcionalidade | 🟠 Média | 🟢 Baixa | 🔴 Alta |
| Risco de dados | 🟠 Médio | 🟢 Baixo com migrations aditivas | 🔴 Alto |
| Regressão | 🟠 Alta em mudanças grandes | 🟢 Isolada por módulo | 🔴 Sistêmica |
| Manutenção futura | 🟢 Boa se concluída | 🟢 Melhor, pois cria fronteiras gradualmente | 🟢 Pode ser boa, mas só após paridade |
| Segurança | 🟠 Pode melhorar, mas precisa coordenação | 🟢 Permite atacar P0 primeiro | 🔴 Período longo com dois sistemas + migração |
| Rollback | 🟠 Possível, mas diffs grandes | 🟢 Melhor via flags/rotas/previews | 🔴 Complexo após corte de dados |
| QA necessário | 🔴 Alto | 🟠 Distribuído por onda | 🔴 Muito alto |
| Valor já existente preservado | 🟢 Sim | 🟢 Sim | 🔴 Reimplementado |
| Adequação ao SAG B atual | 🟠 Parcial | 🟢 **Maior** | 🔴 Não justificada |

## Resultado

### Opção 1 — Remodelar profundamente
Viável, mas **não deve ser feita como uma única refatoração ampla**.

### Opção 2 — Strangler
**Vencedora.** Permite:
- congelar contratos;
- proteger dados;
- substituir shell e serviços por partes;
- mover localStorage para backend;
- consolidar duplicidades;
- manter rollback;
- homologar cada domínio em Deploy Preview.

### Opção 3 — Reconstruir do zero
**NÃO RECOMENDADA.**

Não foram encontradas evidências suficientes para cumprir o gate definido na tarefa P0:
- o núcleo reutilizável **não é pequeno**;
- os dados e contratos **são numerosos**;
- a arquitetura modular **já existe**;
- o sistema **compila e entrega preview**;
- há módulos maduros;
- a cobertura de testes global ainda é insuficiente para provar paridade de uma nova implementação.

---

# 11. Recomendação técnica fundamentada

## 🟡 AGUARDANDO APROVAÇÃO

**Adotar STRANGLER como estratégia arquitetural oficial.**

A remodelação profunda deve ocorrer **por ondas dentro do strangler**, preservando:

- Supabase/migrations/dados;
- registry e manifests;
- contratos públicos dos módulos;
- módulos maduros;
- CI + Deploy Preview;
- funcionalidades legadas ainda utilizadas até prova de substituição.

Não iniciar reescrita total.

---

# 12. Plano em ondas

## Onda 0 — Baseline e segurança
**Objetivo:** tornar seguro evoluir.

- congelar mapa de funcionalidades e contratos;
- criar suíte de caracterização do shell;
- criar typecheck/lint gates;
- autenticar AI proxy e Functions privilegiadas;
- remover segredos do browser;
- migrar CredentialManager para backend/Vault;
- eliminar verify token default;
- assinatura obrigatória no webhook Meta;
- criar allowlist/SSRF guard do RAI.

**Rollback:** sem migration destrutiva; manter contratos atuais enquanto backend seguro é ativado.

## Onda 1 — Shell strangler
**Objetivo:** reduzir `App.tsx` sem mudar produto.

Extrair:
- AuthBoundary;
- AppShell;
- RouteResolver;
- BusinessContext;
- ModuleHost;
- navigation state.

**Regra:** App vira composição; módulos continuam funcionando iguais.

## Onda 2 — Persistência
**Objetivo:** desmontar o shim gigante.

- separar auth client;
- REST/PostgREST client;
- realtime;
- storage;
- adapters por domínio;
- manter facade compatível temporariamente.

## Onda 3 — Consolidação de módulos
**Objetivo:** eliminar duplicidade comprovada.

Prioridade:
1. NIDE x Metodologias;
2. NIDE x Mentorias;
3. NIDE x Missões;
4. Núcleo de Agentes x Quadro de Elite;
5. Sala Dev x components/dev-room;
6. componentes globais equivalentes a módulos.

Cada remoção exige:
- teste de caracterização;
- redirect/alias;
- paridade funcional;
- ausência de consumidor;
- homologação.

## Onda 4 — Fontes de verdade
**Objetivo:** reduzir localStorage/mock.

Migrar:
- NAGI → Supabase;
- NIC → Supabase;
- toggles/ordem de módulo → configuração governada por workspace;
- Hub inbox/credenciais → backend;
- Telas Avançadas → persistência controlada.

LocalStorage permanece apenas para cache/preferências não sensíveis.

## Onda 5 — Serverless/API
**Objetivo:** fronteira única e segura.

- convergir endpoints legados para API SAG B;
- auth/scopes uniformes;
- rate limit;
- assinatura;
- observabilidade;
- idempotência;
- contratos versionados.

## Onda 6 — UI, responsividade e performance
**Objetivo:** baseline de experiência uniforme.

- smoke shell 1366×768 / tablet / mobile;
- lazy loading por módulo;
- medir bundle;
- decompor páginas >40 KB;
- consolidar design tokens.

## Onda 7 — Arquivamento final
Somente arquivar/remover após prova.

Candidatos iniciais:
- `.centro_de_estudos`;
- `quadro_de_elite`;
- duplicatas NIDE;
- componentes raiz já substituídos;
- fallbacks sem uso;
- branches históricas validadas como obsoletas.

---

# 13. Próximo gate

```text
AUDITORIA CONCLUÍDA
        ↓
RECOMENDAÇÃO: STRANGLER
        ↓
AGUARDANDO APROVAÇÃO
        ↓
SE APROVADO:
Onda 0 — Baseline + Segurança
        ↓
Deploy Preview + QA
        ↓
Onda 1 — Shell
```

**Nenhuma remodelação foi executada nesta auditoria.**

**Nenhuma migration foi aplicada.**

**Nenhum código funcional foi alterado.**

**Nenhum merge em `main` foi realizado.**

**Nenhuma publicação de produção foi realizada.**

---

# 14. Veredito

## 🟣 RECOMENDAÇÃO TÉCNICA

**STRANGLER / REMODELAÇÃO GRADUAL.**

### Não escolher
🔴 **Reconstrução do zero**, porque o sistema possui dados, contratos, módulos, migrations e integrações demais para que a reescrita reduza o risco.

### Não fazer
🔴 **Refatoração big bang**, porque a cobertura global ainda não protege todas as funcionalidades.

### Fazer após aprovação
🟢 **Preservar o que funciona, cercar com testes, extrair fronteiras e substituir uma camada por vez.**
