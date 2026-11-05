# 3FB006 — SDVU — Registro Vivo SAG B — v0.1 — 18-09-2026

**Repositório:** `lozebr/sagb`
**Branch de trabalho:** `develop`
**Status:** 🟢 ATIVO
**Produção/main:** não alterar sem aprovação explícita.

## Regra
Atualizar após toda execução relevante registrando pedido, fontes, interpretação, execução, commits, validações, decisões/aprovações, erros, pendências e próximo gate.

## 18-09-2026 — P0 NAGI / Central de Demonstração

### Pedido
Revisar a área do NAGI que reúne apps/links, eliminar duplicidades e transformá-la em central simples para demonstrações em reuniões, priorizando Deploy Preview em vez de domínio de produção. Também foi solicitada definição de posicionamento/versionamento de produtos ainda não homologados em 1.0.

### Fontes verificadas
- `README.md`;
- `package.json`;
- `src/modules/nagi/components/NAGIView.tsx`;
- `src/modules/nagi/components/PublishedLinksSection.tsx`;
- `src/modules/nagi/data/publishedLinks.ts`;
- `src/modules/nagi/module-doc.ts`;
- `src/modules/nagi/changelog.md`;
- TEC-PAD-005 — Padrão de Versionamento, Changelog e Decisions.

### Descobertas
- NAGI é o nome correto;
- a seção `Links publicados` existe;
- o modelo atual é centrado em URL e produz múltiplos cards para o mesmo produto;
- existem duplicidades explícitas no dataset atual;
- há mistura entre produção, Netlify, testes e legado;
- SAG B não possuía branch `develop` nesta data;
- TEC-PAD-005 não define a semântica de maturidade `0.x → 1.0`.

### Execução
- criada branch `develop` a partir de `main`;
- preparada especificação P0 para central de demonstração;
- nenhuma mudança funcional aplicada ainda;
- produção não alterada.

### Pendências
- implementar P0 em `develop`;
- reconciliar identidade canônica dos produtos;
- validar previews vigentes;
- executar QA;
- gerar Deploy Preview;
- obter aprovação para regra `0.x → 1.0`;
- revisar documentação antiga de deploy/branch do SAG B.

### Estado
🟠 P0 ESPECIFICADA — AGUARDANDO IMPLEMENTAÇÃO.
## 18-09-2026 — P0 de decisão arquitetural: remodelar x reconstruir

### Pedido
Definir se o SAG B deve ser reconstruído do zero ou submetido a remodelação/limpeza profunda.

### Evidências iniciais verificadas
- registry central com 30 módulos;
- Supabase, funções Netlify e integrações materializadas;
- histórico de módulos e entregas maduras;
- `App.tsx` monolítico com responsabilidades acumuladas;
- coexistência de arquitetura modular e legado;
- estruturas hardcoded ainda presentes;
- branches e documentação antigas coexistindo com frentes atuais.

### Interpretação
A hipótese inicial favorece remodelação profunda/strangler, mas a decisão permanece pendente de auditoria comparativa.

### Execução
- criada tarefa P0 de decisão arquitetural em `docs/tasks/3fb006-p0-decisao-arquitetural-sagb-remodelar-vs-reconstruir-v0.1-18-09-2026.md`;
- nenhuma limpeza destrutiva iniciada;
- nenhuma mudança funcional executada;
- `main` e produção permanecem intocadas.

### Próximo gate
Executar auditoria read-only e classificar cada camada em PRESERVAR / EXTRAIR / REFATORAR / SUBSTITUIR / REMOVER / INVESTIGAR antes de decidir.

## 18-09-2026 — Fechamento P0 NAGI / Central de Aplicativos

### Pedido executado
Transformar `Links publicados` em Central de Aplicativos para reuniões, aplicando `1 produto = 1 card`, removendo duplicidade visual sem apagar histórico e priorizando Deploy Preview/homologação validado.

### Diagnóstico e auditoria
- 32 registros históricos analisados em `src/modules/nagi/data/publishedLinks.ts`;
- 26 produtos canônicos após consolidação;
- 6 cards duplicados removidos da interface;
- grupos consolidados: EDA 360, QG 3forB, Site 3forB, TaskZei e CRM LOZE/CRM Ziplia;
- NEXO tratado como referência legada do produto oficial LIVZE;
- histórico bruto preservado como metadado;
- alvos sem preview/homologação comprovados permanecem `⚪ NÃO VERIFICADO` e sem abertura silenciosa em produção.

### Implementação
Arquivos principais:
- `src/modules/nagi/data/demoProducts.ts`;
- `src/modules/nagi/components/PublishedLinksSection.tsx`;
- `src/modules/nagi/components/NagiShell.tsx`;
- `src/modules/nagi/components/NagiSidebar.tsx`;
- `src/modules/nagi/components/NAGIView.tsx`;
- `src/modules/nagi/styles/nagi-tokens.css`;
- `tests/nagi-demo-registry.test.mjs`;
- `tests/nagi-ui-smoke.spec.cjs`;
- `.github/workflows/nagi-ui-smoke.yml`;
- `.github/workflows/netlify-deploy.yml`;
- `.github/workflows/history-check.yml`.

### Correções encontradas durante QA
- workflow de History Compliance usava Node 18 incompatível com dependências atuais; corrigido para Node 20;
- badge lateral ainda contava links brutos; corrigido para produtos canônicos;
- sidebar ainda exibia `Links publicados`; corrigida para `Aplicativos`;
- layout mobile/tablet tinha sidebar fixa de 220px; compactada para 64px em viewport estreito;
- grade protegida contra overflow horizontal;
- smoke inicial esbarrou na autenticação do SagB; foi criado harness isolado de QA sem enfraquecer ou contornar o auth de produção.

### Validação
Commit funcional validado: `b9a57be7ce194b58202ce7a3b353085603c3bf53`.

- `npm test`: aprovado no CI;
- suíte registrada: 15 testes, 15 aprovados, 0 falhas na rodada de validação da P0;
- build Vite: aprovado;
- History Compliance: aprovado;
- Chromium real: aprovado em 1366×768, 768×1024 e 390×844;
- busca por TaskZei: validada;
- status/filtro `não verificado`: validado;
- alvo do TaskZei: Deploy Preview oficial documentado;
- ausência de overflow horizontal: validada no smoke;
- workflow de produção: `skipped`.

### Deploy Preview
PR draft de homologação: `#6`.
Deploy Preview: `https://deploy-preview-6--sagbapp.netlify.app`.
Último deploy validado associado ao commit funcional: `b9a57be7ce194b58202ce7a3b353085603c3bf53`.

### Estado
🟢 PRONTO PARA HOMOLOGAÇÃO.

### Pendências
- homologação humana da experiência no Deploy Preview;
- validar e cadastrar previews/homologações confiáveis dos demais produtos ainda marcados `⚪ NÃO VERIFICADO`;
- nenhuma promoção para `main` foi autorizada nem executada.

### Próximo gate
`HOMOLOGAÇÃO DO USUÁRIO → APROVAÇÃO → eventual merge em main somente com autorização explícita`.
## 19-09-2026 — Auditoria de módulos incorporada à P0 arquitetural

### Pedido
Incluir na auditoria profunda do SagB a verificação dos módulos reutilizáveis LOZE, para identificar capacidades presentes, ausentes, duplicadas ou que deverão ser acopladas posteriormente.

### Fonte canônica consultada
- `lozebr/loze-adm/develop/docs/standards/3fb006-catalogo-mestre-modulos-reutilizaveis-loze-v1-17-09-2026.md`;
- `lozebr/loze-adm/develop/docs/tasks/3fb006-fila-fabrica-modulos-reutilizaveis-loze-v1-17-09-2026.md`;
- ClickUp `🧩 Catálogo Mestre — Módulos Reutilizáveis LOZE`.

### Descoberta
O catálogo canônico contém 20 módulos. `entity-registry-core` está implementado com primeiro consumo homologado; `identity-access-core`, `audit-timeline-core` e `files-attachments-core` formam o próximo lote de fundação, com prioridade P0.

### Execução
- P0 de decisão arquitetural do SagB atualizada para exigir matriz de módulos/gaps;
- tarefa ClickUp `868m72u4e` atualizada com a mesma exigência;
- nenhum módulo foi acoplado automaticamente;
- nenhuma mudança funcional foi realizada.

### Regra
Gap detectado na auditoria vira pendência explícita. Adoção/acoplamento de módulo exige maturidade do módulo, compatibilidade do produto e gate aplicável.
## 19-09-2026 — APROVADO: auditoria profunda do SagB em 12 dimensões

### Aprovação
O usuário aprovou explicitamente a incorporação das 12 dimensões à P0 arquitetural do SagB.

### Dimensões aprovadas
1. Produto e escopo;
2. Jornadas e funcionalidades;
3. Arquitetura e código;
4. Módulos reutilizáveis LOZE;
5. Dados e persistência;
6. Auth, segurança e privacidade/LGPD;
7. Integrações e contratos;
8. UX, UI, acessibilidade e responsividade;
9. QA, testes e regressão;
10. Infra, ambientes, deploy e observabilidade;
11. Performance, escalabilidade, dependências e custo;
12. Governança, versionamento e operação.

### Regras adicionais aprovadas
- achado acionável deve virar evidência + risco + ação + prioridade P0–P3 + ClickUp;
- paridade funcional é obrigatória se reconstrução ou strangler forem considerados;
- gaps de módulos devem ser cruzados contra o catálogo canônico dos 20 módulos LOZE;
- não iniciar limpeza/refatoração durante a auditoria;
- decisão final remodelar x strangler x reconstruir continua pendente.

### Execução
- P0 arquitetural atualizada para v0.2 com escopo aprovado em 12 dimensões;
- grafia corrente corrigida para `SagB` no documento ativo;
- tarefa ClickUp `868m72u4e` atualizada com escopo, matriz de módulos e paridade funcional;
- nenhuma mudança funcional executada;
- `main` e produção permanecem intocadas.

### Evidência
- commit do documento P0: `94f9fdd9f9a5aabb09ed6e6869b7d6e340e13a39`.

### Estado
🟢 APROVADO — ESCOPO DE AUDITORIA EM 12 DIMENSÕES.
🟡 AGUARDANDO EXECUÇÃO DA AUDITORIA E DECISÃO ARQUITETURAL.

## 03-11-2026 — Auditoria arquitetural profunda do SagB concluída

### Pedido
Executar auditoria geral e profunda do `lozebr/sagb` na branch `develop`, sem refatorar, apagar, reorganizar ou reconstruir durante a auditoria, para decidir com evidência entre remodelação profunda, strangler e reconstrução do zero.

### Fontes obrigatórias lidas
- `docs/story/3fb006-registro-vivo-sagb-v0.1-18-09-2026.md`;
- `docs/tasks/3fb006-p0-decisao-arquitetural-sagb-remodelar-vs-reconstruir-v0.1-18-09-2026.md`.

### Fontes complementares verificadas
- árvore completa de `develop`;
- `App.tsx`, `package.json`, `tsconfig.json`, `vite.config.ts`, `netlify.toml`;
- `src/core/modules/*` e navegação;
- manifests/module-docs/routes dos módulos relevantes;
- `services/supabase.ts` e serviços globais;
- migrations Supabase;
- Netlify Functions;
- workflows GitHub Actions;
- branches e PR #6;
- testes/harnesses existentes;
- documentação de NIDE, NAGI, CID, TaskZei, Central de Padrões, Núcleo Conversacional, Núcleo de Agentes, Hub, Gestão Financeira, Studio, CRM e demais módulos;
- catálogo canônico LOZE:
  - `lozebr/loze-adm/develop/docs/standards/3fb006-catalogo-mestre-modulos-reutilizaveis-loze-v1-17-09-2026.md`;
  - `lozebr/loze-adm/develop/docs/tasks/3fb006-fila-fabrica-modulos-reutilizaveis-loze-v1-17-09-2026.md`.

### Inventário objetivo
Baseline auditada inicialmente: `ecc876aefe9187dc0e918f8d64ed38d9ecddb8d0`.

- 1.759 arquivos;
- 1.424 arquivos em `src/`;
- 33 diretórios em `src/modules/`;
- 30 módulos no registry;
- 3 diretórios com manifest fora do registry: `.centro_de_estudos`, `_orquestracao-principal`, `quadro_de_elite`;
- 72 migrations Supabase;
- 13 Netlify Functions;
- 162 arquivos de serviços identificados;
- 9 branches visíveis;
- `develop` estava 35 commits à frente de `main` e 0 atrás no momento da auditoria.

### Evidências estruturais principais
- `App.tsx`: 2.131 linhas, 38 `useState`, 17 `useEffect`, 122 condicionais `if`, 203 ternários e operações diretas de persistência;
- `services/supabase.ts`: 2.986 linhas e papel de shim de compatibilidade multi-domínio;
- `components/SystemicVision.tsx`: ~180 KB;
- `StudioPage.tsx`: ~94 KB;
- coexistência comprovada entre componentes globais e implementações modulares;
- NIDE x Metodologias: 37 arquivos equivalentes, 34 blobs exatamente iguais;
- Quadro de Elite x Núcleo de Agentes: duplicação exata/quase exata de AgentFactory, com fusão já documentada;
- NAGI e NIC ainda possuem persistência/mock local em partes do domínio;
- Supabase, migrations, contratos e módulos maduros representam patrimônio técnico real e não descartável.

### Achados críticos de segurança
1. **Hub CredentialManager**
   - credenciais persistidas em `localStorage`;
   - utilitário de “criptografia” atual apenas adiciona/remove prefixo `enc_`;
   - leitura cliente de tokens/chaves `VITE_*`.

2. **Functions privilegiadas**
   - handlers como `cid-search`, `cid-processor`, `rai-rss-fetch`, `governance-sync-doc` e `email-sync-background` usam service-role sem autenticação explícita uniforme no início do handler.

3. **AI proxy**
   - `/api/ai` expõe actions que consomem chaves server-side sem gate explícito do consumidor no handler.

4. **WhatsApp webhook legado**
   - verify token default;
   - POST inbound sem validação `X-Hub-Signature-256` no caminho legado, enquanto `api-sagb-router` já possui HMAC.

5. **Titan**
   - usuário/senha trafegam no payload da Function.

6. **RAI**
   - fetch de URLs configuráveis demanda allowlist/SSRF guard.

### QA / build / deploy auditados
No baseline auditado:
- Build (Supabase stack): 🟢 success;
- History Compliance: 🟢 success;
- NAGI UI Smoke / Chromium: 🟢 success;
- Netlify Preview: 🟢 success;
- PR #6: draft, aberto e não mergeado;
- produção não promovida.

Lacuna identificada:
- `npm test` executa apenas `tests/*.test.mjs`;
- testes TypeScript existentes dentro de módulos não entram na suíte padrão;
- não existe gate oficial de typecheck/lint;
- não existe smoke sistêmico equivalente ao do NAGI para todo o shell.

### Cruzamento com módulos reutilizáveis LOZE
O catálogo canônico de 20 módulos foi cruzado com o SAG B.

Gaps/candidatos prioritários:
- `identity-access-core`: P0, devido a autorização inconsistente;
- `audit-timeline-core`: P0, devido a auditorias fragmentadas;
- `files-attachments-core`: P0, devido a storages/anexos espalhados;
- `feature-flags-core`: substituir toggles locais;
- `ai-runtime-adapter-core`: convergir multi-provider sem secrets no produto;
- `connector-core`: convergir o Hub mantendo domínio e integrações existentes.

Nenhum módulo LOZE foi acoplado nesta auditoria.

### Classificação consolidada
- 🟢 PRESERVAR: dados/migrations Supabase, registry, build/preview, API SAG B, Central de Padrões, TaskZei, NIDE, Núcleo de Agentes, módulos maduros e contratos funcionais;
- 🟣 EXTRAIR / MODULARIZAR: App shell, `services/supabase.ts`, Núcleo Conversacional/SystemicVision, Sala Dev e camada multi-provider;
- 🟠 REFATORAR: navegação, auth/autorização, CID, RAI, Studio, Monitoramento, Telas Avançadas, testes e documentação conflitante;
- 🟡 SUBSTITUIR GRADUALMENTE: componentes raiz legados, localStorage canônico, Hub credentials, NAGI/NIC persistence, Metodologias/Mentorias/Missões duplicados em relação ao NIDE, serverless inseguro;
- 🔴 REMOVER / ARQUIVAR após prova: `.centro_de_estudos`, `quadro_de_elite` e cópias/legados sem consumidor;
- ⚪ INVESTIGAR: `_orquestracao-principal`, FluxoB, SagB Bridge, Simulador de Mentorias, Vídeos IA e demais candidatos sem maturidade/paridade comprovada.

### Comparação arquitetural
**Reconstrução do zero:** NÃO recomendada.
Motivos:
- patrimônio funcional e de dados amplo;
- módulos reais e reutilizáveis;
- migrations e contratos numerosos;
- baseline executável;
- risco alto de perda de paridade;
- cobertura global insuficiente para reescrita segura.

**Remodelação profunda:** necessária, mas perigosa se feita como big bang.

**Strangler:** recomendação técnica vencedora.
Permite preservar valor, atacar segurança primeiro, substituir shell/persistência por ondas, homologar módulo a módulo e manter rollback.

### Relatório criado
`docs/reports/3fb006-relatorio-auditoria-arquitetural-profunda-sagb-v0.1-03-11-2026.md`

Commits documentais:
- `48fa107caec3ad19b5f3d158711775e59e455a8f` — relatório inicial;
- `bc41a4d1a54394376c1ab5ab1281ee04732cec2a` — cruzamento com os 20 módulos reutilizáveis LOZE.

### Recomendação técnica
🟡 **AGUARDANDO APROVAÇÃO**

Adotar **STRANGLER / REMODELAÇÃO GRADUAL** como estratégia arquitetural do SagB.

A recomendação não é decisão oficial até aprovação explícita.

### Plano proposto em ondas
0. baseline + segurança;
1. shell strangler;
2. decomposição da persistência/shim Supabase;
3. consolidação de módulos duplicados;
4. fontes de verdade / redução de localStorage e mocks;
5. unificação serverless/API;
6. UI/responsividade/performance;
7. arquivamento comprovado de legado.

### Execução nesta missão
- nenhuma refatoração funcional;
- nenhuma remoção;
- nenhuma migration aplicada;
- nenhuma alteração em dados;
- nenhum merge em `main`;
- nenhuma publicação em produção;
- somente documentação de auditoria e Registro Vivo.

### Próximo gate
`AUDITORIA CONCLUÍDA → RECOMENDAÇÃO STRANGLER → APROVAÇÃO DO USUÁRIO → Onda 0`.


### Complemento de fechamento — escopo aprovado em 12 dimensões

Após releitura da P0 v0.2 vigente, foram incorporados os gates adicionais aprovados:

- matriz dos 20 módulos reutilizáveis LOZE no formato canônico;
- matriz explícita de paridade funcional;
- auditoria resumida das 12 dimensões;
- matriz de segurança/LGPD;
- auditoria de UX/acessibilidade/responsividade com limitações registradas;
- performance/dependências/custo;
- branches/versionamento/governança;
- plano de rollback;
- backlog derivado P0–P3.

### Evidências adicionais
Build CI do mesmo baseline:
- 3.392 módulos transformados;
- `index` JS: 5.285,02 kB minificado / 1.275,57 kB gzip;
- `vendor`: 3.408,86 kB / 941,33 kB gzip;
- alerta de circular chunk `vendor → react-vendor → vendor`;
- `services/supabase.ts` é importado estática e dinamicamente, impedindo chunking efetivo;
- `npm ci`: 602 packages;
- 37 vulnerabilidades: 2 low, 8 moderate, 22 high e **5 critical**.

Governança:
- `package.json` versão 1.1.0;
- README versão 1.6.4;
- Monitoramento cita plataforma 1.8.1;
- 9 branches observadas;
- listagem de branches retornou `protected:false`;
- rulesets retornaram vazios;
- PWA/service worker não encontrado na árvore.

Persistência:
- `supabase/run_all_migrations.sql` não representa claramente todo o conjunto posterior de 72 migrations; bootstrap/restore reproduzível virou P1.

### Backlog formal da auditoria
P0:
- segredos no browser/credential manager;
- autenticação de Functions service-role;
- AI proxy auth/rate limit;
- webhook Meta HMAC;
- Titan credentials;
- 5 vulnerabilidades npm críticas;
- baseline QA/typecheck/lint;
- gate identity-access-core.

P1:
- AppShell/RouteResolver/AuthBoundary;
- decomposição do shim Supabase;
- RLS completo;
- SSRF RAI;
- code splitting;
- bootstrap/restore;
- audit/files/feature flags;
- proteção de branch e fonte única de versão.

P2:
- consolidação NIDE;
- NAGI/NIC persistência;
- connector-core;
- ai-runtime-adapter-core;
- accessibility suite.

P3:
- arquivamento de legados comprovados;
- limpeza de branches/docs;
- decisão sobre POCs/pre-alpha.

### Registro ClickUp
Tarefa mestre existente: `868m72u4e`.
Comentário de fechamento da auditoria criado: `90110285657139`.

### Documentos/commits finais
- relatório completo, complemento 12 dimensões: `5fdb7d8438649f95cbc69e89d4a1df1728ab3268`;
- tarefa P0 atualizada para “AUDITORIA CONCLUÍDA — RECOMENDAÇÃO AGUARDANDO APROVAÇÃO”: `1a5b774a80512ca693adae7311c060c1cf0b20fb`.

### Estado final da missão
🟢 **AUDITORIA CONCLUÍDA**  
🟡 **RECOMENDAÇÃO STRANGLER — AGUARDANDO APROVAÇÃO**

Nenhum código funcional foi alterado.
Nenhuma refatoração foi iniciada.
Nenhuma migration foi aplicada.
Nenhum merge em `main`.
Nenhuma publicação em produção.

### Próximo gate
`APROVAÇÃO DA ESTRATÉGIA → somente então ONDA 0`.

## 03-11-2026 — P0 Auth/Deploy Preview do NAGI — protocolo Supabase LOZE

### Solicitação e evidência
- Usuário forneceu captura do acesso a `/nagi/links` no Deploy Preview #6: login SagB apresentou `Erro ao autenticar (desconhecido)`.
- Escopo: diagnosticar e corrigir o caminho de autenticação e respeitar o padrão LOZE, sem desativar Auth, sem tocar dados de produção e sem fazer merge na `main`.

### Fontes verificadas
- `README.md`, `components/Auth.tsx`, `services/supabase.ts`, `netlify.toml`, `.env.example`, workflow de build/deploy e P0 NAGI;
- LOZE ADM: `docs/standards/3fb006-padrao-supabase-loze-v1-17-09-2026.md` (APROVADO);
- LOZE ADM: `docs/standards/3fb006-padrao-auth-email-redirect-smtp-loze-v1-17-09-2026.md` (APROVADO);
- leitura de configurações da Netlify `sagbapp` e lista read-only dos projetos Supabase conectados;
- documentação oficial Netlify: `netlify.toml` tem precedência sobre variáveis do painel para chaves coincidentes.

### Diagnóstico
1. `Auth.tsx` mostrava `desconhecido` para rejeição sem `err.code` (p.ex. `TypeError` de rede), e registrava resultado de login/sessão no console.
2. `netlify.toml` fixava um project ref legado e uma chave publishable dentro de `[build.environment]`, sobrescrevendo a separação de contextos Netlify.
3. As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existem no site Netlify, porém os contextos `deploy-preview` não apresentavam valor configurado na leitura. O valor de produção estava oculto/mascarado e NÃO foi copiado ou alterado.
4. O ref legado do arquivo TOML não aparece entre os dois projetos incubadores visíveis nas conexões Supabase atuais. Isso NÃO comprova que o projeto legado foi eliminado; pode pertencer a outra conta/organização.
5. Portanto, sem confirmação do projeto de identidade correto e das variáveis do preview, o login end-to-end ainda é BLOQUEADO para homologação; não direcionar usuários a um projeto incubador por suposição.

### Execução na develop
- `services/supabase.ts`: validação explícita da configuração Auth, erro tipado para falha de rede, tratamento diferenciado de chave API inválida.
- `components/Auth.tsx`: mensagens acionáveis e genéricas para usuários, retirada de logs de sessão/dados pessoais, preservação do login obrigatório.
- `netlify.toml`: removida a dupla URL/chave fixas para permitir configuração por ambiente no Netlify.
- `tests/sagb-auth-preview.test.mjs`: regressão para mensagens de falha, ausência de logs sensíveis, gate de autenticação e proibição de chave/URL Supabase no TOML.
- Commits: `73b8051`, `c07e64e`, `474dea0`, `e72f161`, `a5cfdbc`, `3e1e415`, `37e2fe3`.
- Nenhuma migration, usuário, dado, configuração de Supabase, variável/segredo Netlify ou regra de acesso foi alterada. `main`/produção intocadas.

### Status e próximo gate
- 🟠 Correção de diagnóstico e governança Supabase aplicada na `develop`.
- 🟡 Validar testes/build/Deploy Preview do commit final; o resultado deve ser registrado em complemento.
- 🔴 Confirmar o projeto Supabase Auth legítimo para o SagB e preencher `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` somente no contexto `deploy-preview` (escopo Builds) a partir de fonte autorizada. Não compartilhar chave administrativa nem migrar identidades implicitamente.
- 🟡 Após configurar: homologar autenticação real com usuário autorizado e acesso a `/nagi/links`; checar redirects/allow-list quando aplicável.
- 🟡 Pendências anteriores preservadas: validação humana NAGI, previews dos demais apps e aprovação formal da estratégia arquitetural.
- Estado da presente demanda: `AJUSTAR` / acesso bloqueado por configuração externa ainda não validada.

### Verificação de CI (commit `cb997630`)
- 🟢 `npm test`: sucesso no workflow de deploy do PR (inclui `tests/sagb-auth-preview.test.mjs`).
- 🟢 Build Supabase stack: sucesso.
- 🟢 Enforce History Compliance: sucesso após atualizar `docs/modular-map/HISTORICO_MODULOS.md`.
- 🟢 Deploy Preview via GitHub Actions: sucesso; etapa de deploy produção foi ignorada (`skipped`).
- 🟢 NAGI UI Smoke (desktop 1366×768, tablet 768×1024 e mobile 390×844): sucesso no commit `cb997630`.
- 🔴 A validação de login real continua bloqueada até identificar o projeto Auth do SagB e configurar o contexto `deploy-preview`; build e deploy verdes não comprovam autenticação.

## 04-11-2026 — Missão P0 QG — Adequar SagB ao padrão oficial Supabase LOZE

### Solicitação e interpretação
- Missão explícita do QG: auditar e implementar na `develop` reconhecimento das duas incubadoras e respectiva observabilidade, preservando banco operacional SagB e autonomia dos módulos.
- A aprovação do **Padrão Supabase LOZE de 17/09/2026** e da **Governança Sequencial QG → Platform → Produto** já existe. Não se criou uma decisão nova para alterar essa fundação.
- Independência de módulo de software NÃO significa banco ou projeto Supabase dedicado por módulo; separação lógica de tabelas/schema exige ownership, consumers, RLS, migrations e gate específico. Módulos de produtos externos não podem apropriar-se do banco do produto.
- Mudanças do SagB autorizadas; alterações do Supabase compartilhado, migrations, Auth global, secrets e produção não autorizadas.

### Fontes lidas
- `lozebr/loze-adm/develop/docs/standards/3fb006-padrao-supabase-loze-v1-17-09-2026.md` — APROVADO;
- `lozebr/loze-adm/develop/docs/standards/3fb006-padrao-governanca-sequencial-supabase-qg-platform-produtos-v1-17-09-2026.md` — APROVADO;
- `lozebr/loze-adm/develop/docs/standards/3fb006-padrao-auth-email-redirect-smtp-loze-v1-17-09-2026.md` — APROVADO;
- `lozebr/loze-adm/develop/docs/story/3fb006-registro-vivo-acompanhamento-tarefas-agentes-v0.1-18-09-2026.md`;
- `lozebr/loze-adm/develop/docs/story/3fb006-matriz-mestre-padroes-decisoes-loze-v0.1-19-09-2026.md`;
- Registro Vivo existente do SagB, auditoria arquitetural, `services/supabase.ts`, `netlify.toml`, `supabase/config.toml`, migrations, Central de Padrões, Monitoramento e módulos com domínio de dados;
- consultas Supabase SQL **somente leitura** nos dois projetos incubadores acessíveis via connector.

### ANTES — desvios encontrados
1. `MonitoramentoSupabasePage` mostrava apenas lista de tabelas inferidas por módulo SagB e contagens HEAD restritas ao projeto configurado no browser; não mostrava as duas incubadoras nem a distinção operacional/monitorado.
2. `supabaseTablesService` dizia carregar todos os `module-docs`, mas importava somente o de Monitoramento.
3. `supabaseObservabilityCatalog` tentava contagem mesmo sem sessão, usando a anon key como fallback; HTTP 404 era interpretado como ausência física.
4. Manifesto operacional local do SagB e ownership separado do inventário externo não estavam explicitados no Observatory.
5. A identidade real do projeto remoto operacional SagB segue não verificada pelas conexões disponíveis; `services/supabase.ts` usa UMA conexão operacional e não deve ser reapontada por hipótese.

### Evidência factual dos projetos (04/11/2026)
- `loze-products-incubator` (`txyuwaffzgsjndqsralg`): `crm` com 33 tabelas / 33 relrowsecurity=true; `public` com 8/8 RLS; `private` com 6/6 RLS; schema `loze_platform` com 0 tabelas; 30 migrations no histórico; bucket `authorial-audio` privado.
- `loze-client-apps-incubator` (`rzouauxrsfyzvpmqqwso`): `noivalia` com 51 tabelas / 51 relrowsecurity=true; `public` com 0 tabelas; 22 migrations; buckets `noivalia-media` privado e `email-assets` público.
- Schemas `nexi`, `radscan`, `studio` NÃO foram encontrados na incubadora de produtos nesta leitura. São exemplos do padrão, não objetos a criar por conta própria.
- A verificação de relrowsecurity indica apenas o flag RLS, **não** prova grants, políticas corretas, isolamento entre usuários, Storage seguro ou Auth membership.
- Não foram lidos dados pessoais nem registros de tabelas; apenas metadados.
- Migrations dos incubadores são contagens do projeto inteiro, não reconciliadas com manifests/migrations individuais. O último acesso read-only não gera sincronização automática futura.

### DEPOIS — execução no próprio SagB, branch develop
- `src/modules/monitoramento/services/supabaseEcosystemRegistry.ts` (novo): registro tipado dos três contextos (SagB operacional não verificado, produtos LOZE monitorados, apps clientes monitorados), schemas reais e referências, ownership pendente, RLS, Storage, Auth, migrations, data/fonte e comparação esperada×real (sem falso positivo quando manifesto não existe).
- `src/modules/monitoramento/pages/MonitoramentoSupabasePage.tsx`: apresenta classes de projetos, status e dados observados; deixa claro snapshot × live; mostra limites de módulo interno/coexistente/legado e preserva listagem antiga do SagB.
- `src/modules/monitoramento/services/supabaseTablesService.ts`: substituída simulação de import dos módulos por mapa declarado do próprio catálogo local, identificado como inferência.
- `src/modules/monitoramento/services/supabaseObservabilityCatalog.ts`: contagem HEAD só com sessão autenticada do SagB e 404 classificado como pendente, não exclusão comprovada.
- `src/modules/monitoramento/services/index.ts` exporta contrato novo.
- `supabase/manifest-sagb-operacional.md`: manifesto local do produto, evidenciando projeto/schema operacional remoto ainda não verificados; formato local sem criar novo padrão transversal.
- `tests/sagb-supabase-observatory.test.mjs`: regressões de classes de projeto, números reais, exemplos não presumidos, ausência de chaves privilegiadas, detecção do estado sem manifesto e preservação de fronteiras.
- `src/modules/monitoramento/changelog.md` e `docs/modular-map/HISTORICO_MODULOS.md` atualizados.
- Nenhum schema, projeto, bucket, RLS, migration, Auth, SMTP, segredo, usuário ou dado foi modificado. Nenhum repo externo modificado. Nenhum merge/publicação em `main`.

### Decisões versus pendências
- 🟢 APROVADO no QG: 2 incubadoras, isolamento por produto, RLS/migrations/Storage, Auth compartilhado por projeto, sagB observador sem ownership de produtos, governança sequencial.
- 🟡 AGUARDANDO APROVAÇÃO: eventual extração física de módulo interno do SagB para outro schema/projeto e consolidação/arquivamento de módulos legados; avaliação de paridade obrigatória.
- 🔴 BLOQUEIO: identificar o projeto operacional do SagB e validar login no Preview. Não substituir por incubadora.
- 🟡 BLOQUEIO EXTERNO: owners de CRM/NEXI/RadScan/Noivalía e Platform fornecerem manifests reais, migrations por produto e fonte segura read-only para atualização contínua do Observatory.
- 🟡 TESTES/QA: validar CI (testes, build, smoke), Deploy Preview atualizado, typecheck quando disponível e homologação autenticada.
- Estado da missão: `AJUSTAR — IMPLEMENTAÇÃO SEGURA APLICADA, HOMOLOGAÇÃO/INTEGRAÇÃO CONTÍNUA PENDENTES`.

### Evidência Git
Commits de código/documentação gerados nesta missão: `a6954bed`, `217ee2a6`, `1ffa8a55`, `5fe48dfe`, `85278df3`, `e5b40f32`, `1f60f955`, `3ae87827`, `b7d944ac`.
PR existente de homologação: `https://github.com/lozebr/sagb/pull/6` (draft; não mergear sem autorização).
Próximo gate: CI/Deploy Preview → homologação humana do Observatory → confirmação do Supabase operacional SagB → handoff aos owners/Platform.

### Complemento de homologação técnica P0 — 04/11/2026
- Novo teste TypeScript: `tests/sagb-supabase-typecheck.test.mjs` (typecheck isolado do registry novo e parser TSX do Observatory). Commit `59aa627473f05fda129f7e61e0872e6c90668751`.
- No commit `59aa6274`, GitHub Actions: `Enforce History Compliance` 🟢; `Build (Supabase stack)` 🟢; `Deploy to Netlify (backup via Actions)` 🟢 (etapa Test + build + Deploy Preview verde, etapa produção skipped); `NAGI UI Smoke` 🟢.
- Netlify `sagbapp`: Deploy Preview do branch `develop` em estado `ready` na checagem (PR #6).
- Limitações de QA: smoke Chromium existente cobre NAGI isolado, **não a navegação real autenticada no Observatory**; build Vite/TSX e teste de tipo isolado NÃO equivalem ao typecheck global do repositório (gate global ainda não existe). Login do SagB continua bloqueado enquanto seu projeto Supabase operacional não for confirmado/configurado no Preview.
- Nenhuma alteração realizada no banco operacional ou nas duas incubadoras; os snapshots exibidos representam **04/11/2026**, não telemetria live.
- Status técnico: `IMPLEMENTADO NA DEVELOP — PRONTO PARA HOMOLOGAÇÃO TÉCNICA PARCIAL`; status de negócio: `AJUSTAR — AGUARDANDO PERMISSÕES, MANIFESTOS E LOGIN REAL`.

### Complemento — matriz individual de módulos em 04/11/2026
- Releitura de `src/core/modules/moduleRegistry.ts`: exatamente **30 módulos registrados**, mais **3 diretórios de manifest fora do registry** já identificados na auditoria anterior (`.centro_de_estudos`, `_orquestracao-principal`, `quadro_de_elite`).
- Ampliação de `supabaseEcosystemRegistry.ts` para **33 entradas individuais**, indicando se pertencem ao runtime registrado e distinguindo internos, coexistentes com produtos externos, legados e itens a classificar. Nenhuma classificação autoriza exclusão física ou divisão de banco.
- Página do Observatory exibe coluna `Registry`; teste confere quantitativos, unicidade e compatibilidade com registry fonte.
- Commits complementares: `09233d4a`, `1782a920`, `9bcefcb9`.
- Gate de futura reorganização: ownership e consumidores → teste de paridade → migration aditiva/rollback → homologação → aprovação QG.

### Gate CI do inventário completo (commit `9bcefcb9`)
- 🟢 `npm test` no job Deploy Preview (testes de catálogo, 30 módulos + 3 legados e checagem TypeScript isolada).
- 🟢 Build Vite/Supabase stack.
- 🟢 History Compliance.
- 🟢 Chromium NAGI UI Smoke.
- 🟢 Deploy Preview na Netlify pelo workflow PR; etapa de produção `skipped`.
- 🟡 Homologação E2E autenticada específica do Observatory ainda não disponível. Não confundir green CI com prova de acesso ao banco operacional.

## 04-11-2026 — QG Zalu P0 | Etapa 1A Acesso e Etapa 1B NAGI

**Origem e decisão:** QG LOZE determinou modernização incremental, preservando Supabase Free, e SUSPENDEU a missão anterior de adequação ampla de todos os módulos. Escopo autorizado exclusivamente para login/autenticação/senha/sessão/recuperação e NAGI, no `lozebr/sagb/develop`. É a orientação operacional atual; não é aprovação de reconstrução, migração física ou alteração da fundação compartilhada.

### Fontes obrigatórias lidas
- `lozebr/loze-adm/develop/docs/story/3fb006-registro-vivo-acompanhamento-tarefas-agentes-v0.1-18-09-2026.md`, com decisão QG de 04/11/2026 e suspensão de migração automática;
- `lozebr/loze-adm/develop/docs/standards/3fb006-padrao-supabase-loze-v1-17-09-2026.md` (APROVADO);
- `lozebr/loze-adm/develop/docs/standards/3fb006-padrao-auth-email-redirect-smtp-loze-v1-17-09-2026.md` (APROVADO);
- `README.md`, Registro Vivo SagB anterior, `services/supabase.ts`, `components/Auth.tsx`, `App.tsx`, `netlify.toml`, `src/modules/nagi/data/demoProducts.ts`, `data/publishedLinks.ts`, `repository/nagi.repository.ts`, `repository/nagiIngestion.repository.ts`, `module-doc.ts`, componentes NAGI, testes e PR #6;
- Consultas somente leitura a variáveis Netlify `sagbapp` e lista de projetos dos dois conectores Supabase;
- Documentação Supabase atual sobre recuperação com redirect, validação e `updateUser`.

### RECIBO 1 — ACESSO (Etapa 1A)

**ANTES**
- Login do SagB usava adaptador Supabase Auth REST compatível com Firebase; sessão `sagb_supabase_session_v1` persistida em localStorage sem expiração/refresh previamente implementados.
- Tela não oferecia solicitação de recuperação de senha e não tinha callback de redefinição.
- `App.tsx` imprimia e-mail e perfil carregado no console, e fallback de perfil ausente assumia tier `TÁTICO`; mudanças de sessão poderiam criar assinaturas repetidas.
- Netlify `sagbapp`: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` têm valor em `production`, mas **não** em `deploy-preview`/dev/branch-deploy na leitura de 04/11; produção possui `SUPABASE_SERVICE_ROLE_KEY` e essa chave NÃO deve ir para o browser.
- Os dois vínculos Supabase consultáveis mostram exclusivamente `loze-products-incubator` e `loze-client-apps-incubator`; não provam que o banco histórico SagB/Dathex não exista em outra conta. Projeto Auth operacional ainda não confirmado na conta acessível.

**DEPOIS**
- `services/supabase.ts`: resposta de sessão com expiração, refresh token com concorrência controlada, revalidação via `/auth/v1/user`, preservação da sessão em falhas temporárias de rede, logout com limpeza local e evento de sessão deduplicado; `resetPasswordForEmail` com redirect dinâmico exato `window.location.origin + /auth/reset-password`; callback `type=recovery` em hash ou `token_hash`, atualização via `PUT /auth/v1/user`, remoção de token do URL. Não muda projeto Supabase.
- `components/Auth.tsx`: opção `Esqueci minha senha`, estado de envio de e-mail neutro (sem revelar existência de conta), campo nova senha com mínimo 8 caracteres na interface, mostrar/ocultar senha, erro de link expirado e retorno ao login.
- `App.tsx`: rota de recuperação isolada e pública (`/auth/reset-password`) sem exibir aplicação protegida; remoção de logs sensíveis de login; fallback sem privilégios elevados (tier `OPERACIONAL`); limpeza de assinaturas de banco na troca de usuário. Este fallback NÃO equivale a autorização granular de backend: validação de memberships/RLS do banco histórico permanece pendente.
- Nenhuma alteração de domínio Site URL/allow-list/SMTP/secrets/Auth global foi executada; dependerá de QG/owner remoto.

**TESTES E EVIDÊNCIAS**
- `tests/sagb-access-nagi-etapa1.test.mjs`: cenários de integração do adaptador Auth com respostas HTTP de Supabase simuladas para login, logout, senha incorreta, refresh expirado, recuperação por redirect e alteração por PUT, link expirado, ambiente sem configuração; parsing TSX de App/Auth e assertivas de segurança.
- `tests/sagb-auth-preview.test.mjs` preservado; build e testes GitHub Actions do commit `b9b75091` aprovados (rodada com testes `npm test`, build e Deploy Preview).
- 🔴 **Não homologado end-to-end com pessoa real**: não existe acesso confirmado ao projeto Auth original nem variáveis de build no contexto deploy-preview; nenhum usuário de teste e-mail foi criado. E-mail real, link entregue, políticas Auth, redirecionamento allow-list, usuário A × B e login/logout real dependem de credenciais/permissões e homologação.
- **Mudança remota que precisa de aprovação:** identificar ref do Auth operacional original; configurar `VITE_SUPABASE_URL` e chave **publishable/anon** correspondente no escopo `builds` do contexto `deploy-preview` (e desenvolvimento autorizado), manter production inalterado; confirmar callback `https://deploy-preview-6--sagbapp.netlify.app/auth/reset-password` e origem local na allow-list daquele projeto. Para e-mail real em produção, QG/infra devem revisar SMTP/branding. Nunca publicar service_role no client nem apontar para incubadora por dedução.

**ESTADO:** `AJUSTAR` — correções de código implementadas e testadas em simulação; acesso real continua bloqueado pela configuração externa.

### RECIBO 2 — NAGI (Etapa 1B)

**ANTES**
- PR #6 Draft aberto: `32` links históricos → `26` produtos canônicos, `6` duplicidades visuais eliminadas, Preview do TaskZei documentado, demais não verificados; este trabalho já estava implementado/testado e foi preservado.
- Ideias/triagem usam `LocalStorageNagiRepository` (`sagb_nagi_items_v2`); ingestão usa `LocalStorageNagiIngestionRepository` (`sagb_nagi_ingestion_documents_v1`); há seeds/blueprints, sem Supabase NAGI ativo.
- Central de Aplicativos usa `publishedLinks.ts` histórico e `demoProducts.ts` estático; não consulta tabelas, migrations ou APIs dos bancos de CRM/NEXI/RadScan/Noivalía, nem sua própria tabela Supabase.
- Central de Padrões SagB permanece canônica para documentação normativa; NAGI não deve copiar a fonte dona.

**DEPOIS**
- `src/modules/nagi/data/demoProducts.ts`: acrescenta contrato de referência de fonte `historical_links | owner_manifest | readonly_observation` e classes `loze_products_incubator | client_apps_incubator | dedicated | legacy | not_verified`; todo produto permanece `not_verified` quanto a schema/ref Supabase até o owner publicar manifesto, sem inventar vínculo.
- `src/modules/nagi/components/PublishedLinksSection.tsx`: origem histórica e estado de conexão Supabase explícitos, Preview documentado separado de dados reais; regra de um card por produto/URLs históricas e filtro preservados.
- `src/modules/nagi/components/NAGIView.tsx`: aviso de que ideias/triagem/ingestão são dados locais do navegador, NÃO dados oficiais sincronizados.
- `src/modules/nagi/module-doc.ts` e `src/modules/nagi/changelog.md`: documentação de fronteira de dados, read model e compatibilidade com duas incubadoras sem acesso direto nesta etapa.
- Não foi criado schema `nagi`, RPC, migration, integração com banco externo ou manifesto concorrente. Não houve movimentação de registros locais.

**TESTES E EVIDÊNCIAS**
- `tests/nagi-demo-registry.test.mjs` (deduplicação, links e bloqueio de Preview não verificado), `tests/sagb-access-nagi-etapa1.test.mjs` (proveniência), `NAGI UI Smoke` existente na CI.
- Navegação real no NAGI após login ainda depende da correção do acesso do Preview; não declarar homologado por apenas fazer build ou smoke isolado.
- Pendências futuras: fonte dona fornecer manifestos/versões/owner/status/links confiáveis; via leitura mínima autorizada, alimentar NAGI como mapa/read model. Migração de LocalStorage só após domínio real, consentimento, backup e gate QG. Evitar cópia de dados de outros produtos.

**ESTADO:** `IMPLEMENTADO NA DEVELOP — HOMOLOGAÇÃO FUNCIONAL AUTENTICADA PENDENTE`.

### Governança e Git
- Branch exclusivamente `develop`, PR [#6](https://github.com/lozebr/sagb/pull/6) Draft aberto; nenhuma alteração `main`, nenhum merge, nenhuma publicação produção, nenhuma migration nem alteração de dados Supabase.
- Commits principais desta etapa: `c49509ac`, `497db12c`, `4ce088c8`, `59b0aaa0`, `f333fe03`, `cf15ca0b`, `c431b979`, `92c46f35`, `9fe8dc20`, `b9b75091`, `92d15d7c`, `d8a93601`, `32099e00`.
- Preview canônico: https://deploy-preview-6--sagbapp.netlify.app/nagi/links
- Proposta antiga de remodelação global permanece sem aprovação; adequação ampla de módulos suspensa nesta etapa.

### 04-11-2026 — Complemento da Missão P0 Etapa 1A/1B (escopo reduzido do QG)
**Solicitação:** focar acesso e NAGI; adequação Supabase geral suspensa. As melhorias anteriores da Etapa 1 já estavam no `develop` e foram preservadas, sem reconstrução.

**Execução adicional:**
- `components/Auth.tsx`: removida inferência de nível de acesso a partir de texto livre de cargo (`inferTier`); novos perfis originados da tela registram `role: 'member'`, `tier: 'OPERACIONAL'` e `requestedRole` apenas informativo. Este controle de UI não substitui políticas backend/RLS.
- `services/supabase.ts`: guarda de geração no callback `onAuthStateChanged`; resposta assíncrona inicial de `/auth/v1/user` não sobrescreve login/logout ocorrido durante a requisição.
- `src/modules/nagi/components/PublishedLinksSection.tsx`: link só é clicável com `status: validated`, evidência `official_product_readme` e URL existente; catálogo histórico preservado.
- `tests/sagb-access-nagi-etapa1.test.mjs`: acrescentados regressões para privilégio mínimo de cadastro, ordem dos eventos de sessão e gate da demonstração.
- `src/modules/nagi/changelog.md` e `docs/modular-map/HISTORICO_MODULOS.md`: rastreabilidade registrada.

**Commits adicionais:** `13f7a3ef` (Auth), `421ec770` (sessão), `437c581b` (testes), `2686d239` (NAGI), `a2a677f7` (teste), `b68b0cbe` e `a9cee846` (documentação).

**Auditoria remota somente leitura:** site Netlify SagB `sagbapp`: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com valor apenas no contexto `production`, sem valor em `deploy-preview`, `dev` ou `branch-deploy`. `SUPABASE_SERVICE_ROLE_KEY` não deve ser exposta no browser. Projeto Supabase Auth operacional não está confirmado por conexões atuais; NÃO substituir pelo products/client apps incubator. Nenhuma mudança nas variáveis, Auth remoto ou bancos nesta rodada.

**Critérios de aceite:** suíte Node com mocks cobre login/logout/senha/refresh/recuperação; CI será registrado quando terminar. Sem Auth remoto corretamente configurado no Preview e usuário autorizado, NÃO é possível demonstrar autenticação real, envio de e-mail, callback permitido ou sessão autenticada no NAGI. Status `AJUSTAR`; é necessária autorização de QG/owner para configurar somente variáveis públicas de build do Preview e allow-list do projeto operacional confirmado.

**Escopo preservado:** apenas Auth e NAGI; zero migrations, zero alterações em outros módulos, sem PR merge, sem `main` e sem produção.

### Gate CI / PR de 04-11-2026 (commit `ffb528e1`)
- 🟢 `npm test`: sucesso no job `Deploy to Netlify` (inclui testes Auth/NAGI com mock, privilégio mínimo e gate de links).
- 🟢 Build de aplicação: sucesso tanto no deploy PR quanto no workflow `Build (Supabase stack)`.
- 🟢 History Compliance: sucesso.
- 🟢 Netlify Deploy Preview PR #6: sucesso; etapa produção `skipped`.
- 🟡 NAGI UI Smoke final: ainda executando instalação do Chromium na última consulta; resultado não antecipado.
- 🟡 Auth E2E remoto e recuperação de e-mail: bloqueados pelas variáveis `deploy-preview` e ausência de confirmação do projeto Auth operacional; nenhuma credencial foi modificada.
- Comentário de recibos publicado na PR #6: GitHub issue comment `6646497598`.
