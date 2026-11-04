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


---

# 15. Cruzamento obrigatório — Módulos Reutilizáveis LOZE

Fonte canônica consultada em modo somente leitura:

- `lozebr/loze-adm/develop/docs/standards/3fb006-catalogo-mestre-modulos-reutilizaveis-loze-v1-17-09-2026.md`;
- `lozebr/loze-adm/develop/docs/tasks/3fb006-fila-fabrica-modulos-reutilizaveis-loze-v1-17-09-2026.md`.

O catálogo possui **20 módulos transversais aprovados**. A auditoria do SAG B mostra que várias capacidades já existem localmente, porém fragmentadas. Isso reforça o strangler: **não reescrever capacidades que a LOZE já está transformando em módulos reutilizáveis; migrar/adaptar por contrato quando cada módulo estiver maduro e homologado.**

| Módulo LOZE | Estado observado no SAG B | Evidência / recomendação |
|---|---|---|
| `entity-registry-core` | 🟡 Capacidade local sobreposta | SAG B possui `agents`, workspace members, ventures e Cadastro de Empresas. Antes de consolidar cadastros, avaliar consumo do módulo já implementado em vez de manter identidades paralelas. |
| `identity-access-core` | 🔴 GAP P0 | Supabase Auth existe, mas autorização/memberships/roles/permissões não são uniformes. É aderente ao maior gap de segurança encontrado. |
| `audit-timeline-core` | 🔴 GAP P0 / fragmentado | Existem `api_audit_log`, auditoria de Central de Padrões, governance/audit e eventos de qualidade, porém sem timeline transversal única. |
| `files-attachments-core` | 🔴 GAP P0 / fragmentado | CID, chat, TaskZei, Studio e Central de Padrões possuem storages/anexos próprios. Deve-se preservar dados e convergir metadados/contratos gradualmente. |
| `notification-center-core` | 🟠 Parcial | TaskZei possui notificações/e-mail/push, mas não é centro transversal do SAG B. |
| `settings-preferences-core` | 🟠 Parcial | Preferências/toggles estão dispersos em localStorage e módulos; forte candidato a substituir configuração local do shell. |
| `approval-workflow-core` | 🟠 Parcial | Central de Padrões possui approval requests, mas a capacidade não é transversal. |
| `comments-collaboration-core` | 🟠 Parcial | TaskZei possui comentários; não há contrato compartilhado sistêmico. |
| `tags-classification-core` | 🟠 Parcial | CID/NAGI e outros domínios possuem tags/classificações próprias. |
| `search-filter-views-core` | 🟠 Parcial | Busca/filtros são implementados por módulo, sem camada compartilhada. |
| `import-export-core` | 🟠 Parcial | Existem importações pontuais (ex.: agentes/docs), mas não contrato transversal. |
| `events-webhooks-core` | 🟡 Parcial | API SAG B e Hub possuem events/webhooks próprios; faltam retries/idempotência/contrato uniforme. |
| `connector-core` | 🟡 Parcial e prioritário | Hub de Integrações já exerce parte do papel, mas com credenciais inseguras no browser. Deve convergir ao contrato reutilizável, não ser descartado. |
| `scheduling-core` | 🟡 Parcial | TaskZei/Agenda cobrem tarefas, lembretes e recorrência; capacidade ainda acoplada ao produto. |
| `documents-templates-core` | 🟡 Parcial | TaskZei e Central de Padrões possuem documentos, mas não um motor transversal de templates/versionamento. |
| `rules-engine-core` | 🟡 GAP | Regras ainda aparecem em código/condicionais e domínios específicos. |
| `billing-subscription-core` | ⚪ Sem evidência de núcleo equivalente | Gestão Financeira não equivale a planos/assinaturas/entitlements. |
| `metrics-usage-core` | 🟡 Parcial | Monitoramento possui métricas/custos/saúde, mas não contrato funcional transversal de uso/quota. |
| `feature-flags-core` | 🟡 Parcial e necessário | `moduleActivation.ts` usa localStorage; deve evoluir para flag governada por ambiente/workspace/conta. |
| `ai-runtime-adapter-core` | 🟡 Parcial e prioritário | `providerProxy.ts`, providers e `ai.mjs` já fazem multi-provider; devem convergir a adapter seguro sem secrets no produto. |

## Impacto na decisão arquitetural

O catálogo LOZE **reduz ainda mais a justificativa de reconstrução total**.

A estratégia recomendada passa a ser:

```text
preservar domínio SAG B
        +
preservar dados/contratos
        +
usar strangler no shell e serviços
        +
adotar módulos LOZE maduros por contrato
        +
desativar implementações locais somente após paridade
```

### Prioridade de adoção após aprovação

1. `identity-access-core` — diretamente relacionado aos gaps P0 de autorização;
2. `audit-timeline-core` — unificar auditorias fragmentadas;
3. `files-attachments-core` — reduzir storage/anexos duplicados;
4. `feature-flags-core` — substituir toggles locais do shell;
5. `ai-runtime-adapter-core` — endurecer providers/segredos;
6. `connector-core` — convergir Hub de Integrações sem reescrever o domínio.

**Regra:** nenhum acoplamento foi executado nesta auditoria. Adoção depende da maturidade/homologação de cada módulo LOZE e de gate próprio.


---

# 16. Matriz canônica dos 20 módulos reutilizáveis LOZE

| Módulo LOZE | Precisa? | Existe localmente? | Estado canônico | Estado no SagB | Gap | Ação | Prioridade |
|---|---|---|---|---|---|---|---|
| `entity-registry-core` | Sim | Sim, fragmentado | 🟢 Implementado / piloto homologado | PARCIAL | agents, ventures, empresas e membros vivem em estruturas próprias | Avaliar consumo por contrato sem migrar dados destrutivamente | P1 |
| `identity-access-core` | Sim | Parcial | 🔴 P0 — próximo candidato | NECESSÁRIO / AUSENTE | Auth existe, mas memberships/roles/permissions/autorização uniforme não | Adotar quando arquitetura/gate do módulo estiver pronta | **P0** |
| `audit-timeline-core` | Sim | Parcial | 🔴 P0 | PARCIAL | múltiplas auditorias isoladas | Unificar eventos gradualmente mantendo logs existentes | **P0** |
| `files-attachments-core` | Sim | Parcial | 🔴 P0 | PARCIAL | CID, chat, TaskZei, Studio e CP usam modelos/buckets distintos | Criar adapter e migrar metadados por domínio | **P0** |
| `notification-center-core` | Sim | Parcial | 🟠 P1 | PARCIAL | TaskZei tem notificações, mas não centro transversal | Preservar TaskZei e extrair contrato comum depois | P1 |
| `settings-preferences-core` | Sim | Parcial | 🟠 P1 | SUBSTITUIR LEGADO | toggles/ordem/preferências em localStorage | Migrar configuração por workspace/usuário | P1 |
| `approval-workflow-core` | Sim | Parcial | 🟠 P1 | PARCIAL | approvals concentrados na Central de Padrões | Reusar regras existentes como piloto de contrato | P1 |
| `comments-collaboration-core` | Sim | Parcial | 🟠 P1 | PARCIAL | comentários existem em TaskZei, não transversalmente | Adotar quando houver segundo consumidor | P2 |
| `tags-classification-core` | Sim | Parcial | 🟠 P1 | PARCIAL | taxonomias separadas em CID/NAGI/outros | Mapear taxonomias antes de unificar | P2 |
| `search-filter-views-core` | Sim | Parcial | 🟠 P1 | PARCIAL | busca/filtros repetidos por módulo | Extrair após shell/contratos estabilizados | P2 |
| `import-export-core` | Sim | Parcial | 🟠 P1 | PARCIAL | importação/exportação pontual e sem contrato único | Consolidar adapters sem remover fluxos atuais | P2 |
| `events-webhooks-core` | Sim | Sim, fragmentado | 🟡 P2 | PARCIAL | webhooks/events espalhados, idempotência/retries não uniformes | Convergir via API SAG B | P1 |
| `connector-core` | Sim | Sim, Hub local | 🟡 P2 | PARCIAL | Hub tem conectores, mas segurança de credenciais é inadequada | Preservar domínio; substituir credential plane e aderir ao contrato | **P0/P1** |
| `scheduling-core` | Sim | Sim, TaskZei | 🟡 P2 | PARCIAL | scheduling está acoplado à Agenda Inteligente | Extrair somente quando houver segundo consumidor | P2 |
| `documents-templates-core` | Sim | Parcial | 🟡 P2 | PARCIAL | docs existem em TaskZei/CP, templates/versionamento não são transversais | Manter domínios e avaliar adapter comum | P2 |
| `rules-engine-core` | Sim | Não de forma transversal | 🟡 P2 | NECESSÁRIO / AUSENTE | regras aparecem em código e módulos específicos | Não construir localmente; aguardar desenho canônico | P2 |
| `billing-subscription-core` | Não comprovado | Não | 🟡 P2 | NÃO APLICÁVEL | Gestão Financeira não implica assinaturas/entitlements | Não acoplar sem caso de uso real | P3 |
| `metrics-usage-core` | Sim | Parcial | 🟡 P2 | PARCIAL | Monitoramento cobre saúde/custo, não quotas/usage contract | Evoluir Monitoramento como consumidor, não duplicar engine | P2 |
| `feature-flags-core` | Sim | Sim, localStorage | 🟡 P2 | SUBSTITUIR LEGADO | flags/toggles não são governados por ambiente/conta | Migrar `moduleActivation` por adapter | P1 |
| `ai-runtime-adapter-core` | Sim | Sim, parcial | 🟡 P2 | PARCIAL | providerProxy/ai.mjs existem, porém secrets e auth precisam hardening | Convergir sem reescrever providers já funcionais | **P0/P1** |

**Conclusão:** a fábrica LOZE oferece um caminho de substituição incremental de capacidades transversais. O SAG B deve consumir módulos maduros por adapters; não duplicá-los nem aguardar todos para evoluir riscos P0.

---

# 17. Auditoria nas 12 dimensões aprovadas

| Dimensão | Estado | Evidência | Conclusão |
|---|---|---|---|
| 1. Produto e escopo | 🟠 | README define SAG B como ecossistema central; 33 diretórios de módulo; módulos com maturidades muito distintas | Escopo amplo demais está coexistindo com POCs; preservar núcleo e governar entrada/saída de módulos |
| 2. Jornadas e funcionalidades | 🟠 | fluxos materiais documentados/implementados em Auth, Conversacional, CID, TaskZei, NAGI, CP, Hub, Studio | Paridade deve ser garantida por jornada antes de substituir legado |
| 3. Arquitetura e código | 🔴 dívida alta | App 2.131 linhas; Supabase shim 2.986; componentes >90–180 KB; duplicidades | Strangler no shell/serviços é necessário |
| 4. Módulos LOZE | 🟠 | 20 módulos canônicos cruzados | IAM/audit/files são gaps fundacionais; connectors/AI/flags já têm equivalentes locais parciais |
| 5. Dados e persistência | 🟠 | 72 migrations; múltiplos schemas/tabelas; localStorage em domínios | Dados devem ser preservados; fontes temporárias precisam migração controlada |
| 6. Auth, segurança e LGPD | 🔴 crítico | segredos no browser, service-role sem auth uniforme, AI proxy aberto, credenciais Titan no payload | Onda 0 obrigatória antes de remodelação ampla |
| 7. Integrações e contratos | 🔴/🟠 | API SAG B madura; Hub/Functions heterogêneos | Convergir endpoints e auth via API/connector contracts |
| 8. UX/UI/acessibilidade/responsividade | 🟠 | NAGI tem smoke 3 viewports; shell não; amostra de componentes mostra pouco uso de ARIA/keyboard semantics | Criar baseline E2E/a11y sistêmica antes de alterações visuais amplas |
| 9. QA/testes/regressão | 🔴 | `npm test` ignora testes TS de módulos; sem lint/typecheck gate | Caracterização é pré-requisito do strangler |
| 10. Infra/deploy/observabilidade | 🟠 | preview/build verdes; main/develop sem proteção visível; observabilidade fragmentada | Preservar preview, fortalecer branch gates/logs/health |
| 11. Performance/escalabilidade/dependências/custo | 🔴 | bundle principal 5,28 MB; vendor 3,41 MB; 37 vulnerabilidades npm (5 críticas); circular chunk | P0/P1 de dependências + code splitting |
| 12. Governança/versionamento/operação | 🟠 | package 1.1.0, README 1.6.4, módulo Monitoramento cita platform 1.8.1; branches históricas | Definir fonte única de versão e runbook antes de 1.0/novo baseline |

---

# 18. Mapa das jornadas críticas e paridade necessária

## J1 — Autenticação e entrada no shell
`Auth → Supabase Auth → user/profile → AppShell → Sidebar/ModuleHost`

**Não pode perder:** login, sessão, perfil, isolamento de workspace e acesso às rotas permitidas.

## J2 — Conversa com agente
`selecionar agente → criar/retomar sessão → persistir mensagem → montar contexto/DNA → provider IA → resposta → memória/qualidade/handoff`

**Não pode perder:** histórico, contexto, provider selecionado, anexos, áudio, memória, eventos e bloqueios operacionais.

## J3 — CID
`upload → storage → asset/file → job → processor → extração/transcrição → chunks/outputs → busca`

**Não pode perder:** arquivo original, job, status, chunks, outputs e vínculo por workspace.

## J4 — TaskZei / Agenda
`criar tarefa → editar/status → checklist/comentários → docs/anexos → notificações → reuniões/inbox`

**Não pode perder:** IDs, links, soft delete, custom fields EAV, anexos e auditoria.

## J5 — NAGI
`entrada/ingestão → classificação → revisão → triagem/catálogo → score/governança → handoff`

**Não pode perder:** evidências, histórico de decisão, promoção e handoff.

## J6 — Central de Padrões
`documento/padrão → persistência → relacionamento → validação → aprovação → evidência/auditoria`

**Não pode perder:** fonte canônica Supabase, versões, decisões, aprovações e evidências.

## J7 — Hub de Integrações
`configurar canal → credencial → health → enviar/receber → inbox → logs/observabilidade`

**Não pode perder:** integrações e IDs externos; **deve perder apenas o mecanismo inseguro de segredo no browser**.

## J8 — Studio
`captura/upload → sessão → mídia/chunks → storage → transcrição → CID/consumidores`

**Não pode perder:** sessões e arquivos brutos.

---

# 19. Matriz de paridade funcional — estratégia Strangler

| Função atual | Estado atual | Destino futuro | Estratégia | Paridade exigida | Evidência |
|---|---|---|---|---|---|
| Auth Supabase | Funcional | AuthBoundary + identity-access-core quando maduro | Adapter/strangler | login/sessão/workspace | `components/Auth.tsx`, Supabase auth |
| Shell/tabs | Funcional, acoplado | AppShell + RouteResolver | Extração sem mudar rotas | 100% das entradas atuais | `App.tsx`, registry |
| Registry | Funcional | Registry enriquecido | Preservar | IDs/rotas/status | 30 módulos registrados |
| Dados legados App | Funcional | repositories por domínio | Facade compatível | CRUD + realtime | `services/supabase.ts` + App snapshots |
| Núcleo Conversacional | Funcional | módulo standalone | Extrair UI/providers gradualmente | sessões/mensagens/memória/providers | module-doc + Supabase |
| CID | Funcional | CID endurecido | Preservar domínio + proteger Functions | upload/process/search | docs + Functions |
| TaskZei | Maduro | mesmo módulo | Preservar | tarefas/docs/EAV/notificações | v1.17 + migrations |
| Central de Padrões | Maduro | mesmo módulo | Preservar | docs/approvals/audit | 26 services + RLS/tests |
| NAGI | Parcial real | Supabase repositories | Swap de repository | triagem/catálogo/handoff | repo pattern localStorage |
| NIC | Parcial/mock | backend real | substituir provider | UX e decisões | module-doc confirma mocks |
| Metodologias global | Duplicado | NIDE domain | Redirect + retirada gradual | catálogo/CRUD/rotas | 34 blobs idênticos |
| Mentorias global | Duplicado/fallback | NIDE domain | Redirect + retirada gradual | jornadas existentes | NIDE doc |
| Missões global | Duplicado/fallback | NIDE core | Redirect + retirada gradual | jornadas existentes | NIDE doc |
| Quadro de Elite | Fundido | Núcleo de Agentes | arquivar após paridade | CRUD/identidade | docs + blobs duplicados |
| Hub credentials | Inseguro | backend/Vault/connector-core | troca por adapter | integrações continuam | CredentialManager local |
| AI providers | Funcional/inseguro no gate | secure AI runtime adapter | manter providers, trocar boundary | mesmas actions/modelos | `ai.mjs` / providerProxy |
| Module toggles | localStorage | feature-flags/settings | dual-read/dual-write temporário | estado por workspace | moduleActivation |
| Files/anexos | fragmentado | files-attachments-core | adapter por domínio | IDs/storage/download | buckets/migrations |
| Audit logs | fragmentado | audit-timeline-core | fan-out → central timeline | eventos existentes | múltiplas tabelas audit |

**Gate de remoção:** nenhuma linha pode mudar para “legado removido” sem teste de caracterização + evidência de paridade + homologação.

---

# 20. Segurança, autorização e LGPD

| Achado | Evidência | Risco | Classificação |
|---|---|---|---|
| Segredos em localStorage | CredentialManager | roubo de token/credencial | 🔴 P0 |
| “Criptografia” reversível | `enc_` prefix | falsa sensação de proteção | 🔴 P0 |
| Secrets `VITE_*` | WABA/ClickUp/Google secret | inclusão no bundle/browser | 🔴 P0 |
| Functions service-role sem auth uniforme | CID/RAI/Governance/Email | bypass de RLS | 🔴 P0 |
| AI proxy sem auth do consumidor | `/api/ai` | abuso/custo/exfiltração indireta | 🔴 P0 |
| Webhook legado sem HMAC | WhatsApp inbound | evento forjado | 🔴 P0 |
| Titan recebe senha no body | email driver | exposição de credencial | 🔴 P0 |
| RAI fetch de URL configurável | server-side fetch | SSRF | 🟠 P1 |
| RLS inconsistente | políticas granulares vs amplas | escalada/isolamento fraco | 🟠 P1 |
| Sem CSP na config de repo | `netlify.toml` | superfície XSS/third-party script maior | 🟠 P1 |
| Tailwind CDN em produção | `index.html` | dependência runtime externa/CSP | 🟠 P1 |
| Retenção/LGPD não centralizada | múltiplos domínios | exclusão/retention inconsistente | 🟠 P1 |

**Observação:** a auditoria não inspecionou dados pessoais reais nem conteúdo de produção. O achado LGPD é arquitetural: faltam políticas transversais explícitas de retenção, exclusão e trilha de acesso.

---

# 21. UX, UI, acessibilidade e responsividade

## Evidência positiva

- `index.html` possui viewport responsivo;
- NAGI possui smoke real em:
  - 1366×768;
  - 768×1024;
  - 390×844;
- NAGI validou ausência de overflow horizontal na área auditada.

## Lacunas

Amostra estática:

- `SystemicVision.tsx`: 33 botões, 6 inputs, **0 atributos ARIA** na contagem estática;
- `CIDView.tsx`: 9 botões, 8 inputs, **0 ARIA**;
- `StudioPage.tsx`: 15 botões, 8 inputs, **0 ARIA**;
- `NAGIView.tsx`: 6 botões, 1 input, **0 ARIA**;
- Sidebar possui alguns ARIA, mas cobertura não é sistêmica.

Isso **não prova inacessibilidade**, mas prova que não existe evidência suficiente de conformidade por semântica/teclado.

## Classificação

🟠 **REFATORAR / INVESTIGAR**.

Antes de remodelar UI:
- smoke do shell inteiro;
- testes teclado/foco;
- axe/Lighthouse ou equivalente;
- 1366×768 como gate;
- tablet/mobile;
- touch targets;
- estados loading/error/empty;
- navegação voltar/recarregar.

## PWA

Nenhum manifest/service worker/workbox foi encontrado na árvore auditada.

**Estado:** ⚪ NÃO IMPLEMENTADO / não assumir requisito sem decisão de produto.

---

# 22. Performance, escalabilidade, dependências e custo

## Build real do baseline

O job verde registrou:

- **3.392 módulos transformados**;
- circular chunk: `vendor → react-vendor → vendor`;
- `services/supabase.ts` importado de forma dinâmica e estática, impedindo separação efetiva;
- `index JS`: **5.285,02 kB minificado / 1.275,57 kB gzip**;
- `vendor JS`: **3.408,86 kB / 941,33 kB gzip**;
- React vendor: 251,83 kB / 81,53 kB gzip;
- alerta Vite para chunks >500 kB.

## Dependências

O mesmo `npm ci` registrou:

- **602 packages** instalados;
- **37 vulnerabilidades**:
  - 2 low;
  - 8 moderate;
  - 22 high;
  - **5 critical**.

Além disso:

- `vite` aparece em `dependencies` como `^7.3.0` e em `devDependencies` como `^6.2.0`;
- o build auditado efetivamente executou Vite **6.4.2**;
- Tailwind é carregado por CDN no `index.html`, não por pipeline local;
- GitHub Actions já emite aviso de depreciação de Node 20 no runtime de actions.

## Classificação

🔴 P0: vulnerabilidades críticas.  
🟠 P1: bundle/code splitting/dependency hygiene.

A reescrita total não resolve automaticamente nenhum desses pontos; o strangler permite reduzir bundle e dependências módulo a módulo.

---

# 23. Dados, migrations, restore e rollback

## Preservar

- histórico completo das 72 migrations;
- IDs e contratos existentes;
- RLS/policies;
- buckets e paths;
- tabelas de auditoria;
- soft-delete onde já definido;
- vínculos interdomínio.

## Risco identificado

`supabase/run_all_migrations.sql` termina com observações de migrations antigas e não representa claramente o conjunto completo das 72 migrations posteriores.

**Risco:** alguém tratar esse arquivo agregado como fonte integral de rebuild e subir schema incompleto.

**Ação P1:** declarar uma única estratégia reproduzível de bootstrap/restore e validar do zero em ambiente descartável.

## Regra futura

- migrations novas devem ser aditivas nas primeiras ondas;
- nenhuma drop/rename destrutiva sem backfill, dual-read ou compatibilidade;
- snapshot/backup antes de qualquer migração estrutural;
- rollback por feature flag/adapters quando schema não puder ser revertido.

---

# 24. Infra, ambientes, branches e governança

## Branches

Foram observadas 9 branches:

- `main`;
- `develop`;
- `Teste-cor`;
- `ajuste-novo`;
- `ci-fix-github-actions-build`;
- `review/finalizacao-api-sagb`;
- `supabase_migracao`;
- `supabase-migracao`;
- `work/sagb-reativacao-launcher-20260914`.

No retorno da API, branches aparecem `protected: false`; rulesets do repositório retornaram vazios.

**Risco:** governança depende de disciplina/processo, não de enforcement técnico.

## Versionamento divergente

- `package.json`: **1.1.0**;
- `README.md`: **1.6.4**;
- Monitoramento documenta platform **1.8.1**.

**Conclusão:** não existe fonte única clara de versão do produto.

## Deploy

Pontos positivos:
- Deploy Preview por PR;
- produção separada em push/main;
- Netlify status no PR;
- history compliance.

Ponto de atenção:
- workflow de produção pode publicar automaticamente em push na main;
- como main não aparece protegida, um push indevido é risco operacional.

**Ação P1:** branch protection/ruleset + aprovação obrigatória para produção.

---

# 25. Backlog derivado P0–P3

## 🔴 P0 — antes de remodelação ampla

**P0-SEC-01 — Remover segredos do browser**
- CredentialManager → backend/Vault;
- eliminar `VITE_*TOKEN/SECRET` sensíveis;
- rotação das credenciais afetadas quando aplicável.

**P0-SEC-02 — Autenticar Functions privilegiadas**
- token/JWT/scopes;
- workspace authorization;
- negar chamadas anônimas;
- service-role apenas server-side.

**P0-SEC-03 — Proteger AI proxy**
- auth;
- rate limit;
- quotas;
- audit/correlation id;
- allowlist de actions/providers.

**P0-SEC-04 — Consolidar WhatsApp webhook**
- retirar caminho legado inseguro;
- HMAC obrigatório;
- remover default verify token;
- idempotência/event audit.

**P0-SEC-05 — Reestruturar Titan credentials**
- não aceitar senha bruta do browser;
- integrationId → secret server-side.

**P0-DEP-01 — Tratar 5 vulnerabilidades críticas npm**
- identificar pacotes;
- atualizar/substituir;
- validar regressão.

**P0-QA-01 — Baseline de caracterização**
- typecheck;
- lint;
- suíte TS;
- shell smoke;
- auth/route/data characterization.

**P0-IAM-01 — Gate `identity-access-core`**
- modelo de memberships/roles/permissions;
- mapear RLS A×B;
- não recriar IAM isolado.

## 🟠 P1 — primeira onda arquitetural

- P1-ARCH-01: extrair AppShell/RouteResolver/AuthBoundary;
- P1-DATA-01: decompor `services/supabase.ts` por adapters;
- P1-SEC-06: auditoria RLS completa;
- P1-SEC-07: SSRF guard do RAI;
- P1-PERF-01: code splitting e bundle budget;
- P1-DATA-02: bootstrap/restore reproduzível de migrations;
- P1-AUDIT-01: integrar `audit-timeline-core`;
- P1-FILES-01: integrar `files-attachments-core`;
- P1-FLAGS-01: migrar toggles para feature flags governadas;
- P1-GOV-01: branch protection + release gate;
- P1-GOV-02: fonte única de versão.

## 🟡 P2 — consolidação

- consolidar NIDE × Metodologias;
- consolidar NIDE × Mentorias;
- consolidar NIDE × Missões;
- NAGI → Supabase repository;
- NIC → provider real;
- Hub → connector-core;
- IA → ai-runtime-adapter-core;
- settings/preferências transversais;
- accessibility suite;
- Monitoramento → metrics-usage contract.

## ⚪ P3 — limpeza após prova

- arquivar `.centro_de_estudos`;
- arquivar `quadro_de_elite` após paridade;
- remover componentes raiz substituídos;
- limpar branches históricas após owner/necessidade;
- reconciliar docs antigas;
- decidir destino de FluxoB, SagB Bridge, Simulador e Vídeos IA;
- avaliar PWA somente se virar requisito.

---

# 26. Rollback do plano Strangler

Cada onda deve manter uma saída reversível:

1. **feature flag / route alias** para nova implementação;
2. **facade compatível** no lugar de troca direta de contrato;
3. **dual-read/dual-write temporário** quando persistência mudar;
4. migrations aditivas antes de destrutivas;
5. Deploy Preview por onda;
6. smoke + caracterização;
7. rollback por commit/flag;
8. remoção física somente em onda posterior, após telemetria e homologação.

Para dados:
- backup/snapshot antes da migração;
- migração idempotente;
- reconciliação pós-migração;
- relatório de divergências;
- não apagar fonte antiga no mesmo deploy da primeira leitura nova.

---

# 27. Limitações da auditoria

A auditoria foi profunda em código, configuração, migrations, CI e documentação, mas há limites explícitos:

- não houve acesso a dados pessoais/reais de produção;
- não foi executada migration;
- não foi usada credencial para navegar todas as jornadas autenticadas no browser;
- UX/a11y global foi avaliada por evidência estática + smoke NAGI existente, não por teste manual autenticado de todas as telas;
- não foi executado `npm audit` novo localmente; o número de vulnerabilidades vem do job CI do mesmo baseline de código e lockfile;
- branch protection não pôde ser lida pelo endpoint administrativo, mas a listagem de branch retornou `protected:false` e rulesets retornaram vazios;
- módulos marcados ⚪ exigem investigação funcional antes de remoção.

Essas limitações **não invalidam a decisão estratégica**: elas aumentam o argumento contra reescrita total e reforçam a necessidade de caracterização/segurança como Onda 0.

---

# 28. Gate final da auditoria

## Estado técnico

🟢 **AUDITORIA CONCLUÍDA**

## Recomendação

🟡 **AGUARDANDO APROVAÇÃO: STRANGLER / REMODELAÇÃO GRADUAL**

## Próxima decisão humana

```text
APROVAR STRANGLER
ou
AJUSTAR RECOMENDAÇÃO
ou
NÃO APROVAR
```

Somente **APROVADO** autoriza transformar esta recomendação em decisão arquitetural oficial e iniciar a Onda 0.
