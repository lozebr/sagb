# 3FB006 — SDVU — Registro Vivo SAG B — v0.1 — 18-09-2026

**Repositório:** `lozebr/sagb`
**Branch de trabalho:** `develop`
**Status:** 🟢 ATIVO
**Produção/main:** não alterar sem aprovação explícita.

## Regra
Atualizar após toda execução relevante registrando pedido, fontes, interpretação, execução, commits, validações, decisões/aprovações, erros, pendências e próximo gate.

## 17-11-2026 — Backup PostgreSQL anexado: inventário estrutural e proposta de implantação mínima SagB

**Origem:** arquivo enviado por Douglas no chat do QG em 17/11/2026, identificado como `db_cluster-17-08-2026@09-08-35.backup.gz`. **Classificação:** [EVIDÊNCIA] arquivo PostgreSQL efetivamente examinado; [PI] pedido de aproveitar somente o essencial e crescer módulo a módulo; [PV] homologação de restore, identidade atual da origem e destino.

### Integridade e alcance da inspeção local (read-only)

- Arquivo gzip ~10,8 MB; texto PostgreSQL descomprimido ~32,36 MB. Cabeçalho `PostgreSQL database cluster dump`, SQL legível com `\\connect template1` e `\\connect postgres`; **não** é um backup PGDMP de formato customizado.
- Verificação `gzip -t`: **PASSOU**. SHA-256 do anexo recebido: `36443b98a140e70ee691cc24adf69100a46985e2ba3610424059b25d824a79ca`. Isso demonstra integridade da compressão, **não prova que um restore PostgreSQL funcionaria** ou que todos os arquivos externos estejam nele.
- Aproximadamente **195 tabelas criadas** (das quais **160 em `public`**); inclui schemas Supabase gerenciados `auth`, `storage`, `realtime`, extensões, **16 roles** e centenas de políticas; **não executar este dump inteiro** em incubadora LOZE, pois conflitaria com serviços e papéis existentes.
- No arquivo: **7 registros** em `auth.users`, **7** em `auth.identities`, **1** em `public.users`, **1** em `public.workspace_members`; copiar diretamente `auth.users`, sessões e tokens antigos ao Auth LOZE **não é procedimento seguro/aprovado**. Planejar novas credenciais ou vínculo controlado com identidades autorizadas.
- **NAGI:** 5 tabelas antigas (`nagi_ecosystem_entities`, `nagi_entity_relations`, `nagi_external_signals`, `nagi_insight_distributions`, `nagi_ecosystem_decisions`) e **zero linhas nos cinco blocos COPY**. Há migration histórica `supabase/migrations/20260313000102_nagi_radar_core.sql`; o dataset da Central de Aplicativos é tratado no código/PR #6. Não requer importação de dados dessas cinco tabelas.
- Dados legados potencialmente sensíveis: `public.vault_items` (28 linhas), chats, CID, documentos, possíveis perfis, tokens de Auth. **Não subir o dump ou seus registros/credenciais para GitHub, previews, logs ou ambientes compartilhados; armazenar cópia protegida.**
- `storage.buckets` tem 6 registros e `storage.objects` 14 registros de metadados. **Os bytes dos arquivos de Storage não são fornecidos pelo dump SQL**. Restauração completa exigiria verificar os objetos originais em outra fonte.
- A análise não teve execução SQL nem teste de restore em Postgres local; não garante referencial, RLS, volumes atuais, identidade do sistema que gerou o dump, cobertura histórica do arquivo ou funcionamento do login após importação.

### Proposta incremental [PI] — NÃO É MIGRAÇÃO APROVADA

1. **Fase 1A: somente acesso SagB.** Projetar Auth no destino escolhido (candidato: `loze-products-incubator`, projeto LOZE; carece de gate de ownership), memberships e RLS próprias, login/logout/recuperação em Preview; não importar tokens nem roles de sistema do cluster.
2. **Fase 1B: somente NAGI.** Aproveitar interface e registry canônico atual no GitHub, comparar a migration histórica com o novo padrão por schema; se não houver persistência exigida, manter leitura do catálogo atual e **não criar tabelas só por existirem no legado**. Se for preciso persistir, criar migration nova versionada com tabelas do domínio SagB e RLS.
3. **Demais módulos: sob demanda.** Preservar material histórico e importar seletivamente só se houver caso de uso, owner, contrato de dados, evidência de backup/rollback e testes. Sem importação automática de CID/Chat/Central de Padrões/Vault/Storage ou outros domínios.
4. **Gate técnico:** avaliar restauro de uma cópia apenas em ambiente descartável autorizado para confirmar que o SQL e os dados são legíveis, sem aplicar no Supabase LOZE nem remover dependências no sistema antigo. Conferir disponibilidade de arquivos de Storage separadamente.

**Fonte normativa:** `lozebr/loze-adm/develop/docs/standards/3fb006-padrao-supabase-loze-v1-17-09-2026.md`. O padrão não é alterado automaticamente por esta proposta.

**Status:** backup encontrado, catalogado e compressão íntegra; **restauração não homologada, nenhum banco/produção/assinatura alterado**. A pendência de localizar o arquivo recebido é resolvida; permanece a pendência de validar restaurabilidade, proteção e execução modular.

---

## 17-11-2026 — QG: localização de backup SagB e avaliação para futura incubadora LOZE (somente leitura)

**Origem:** Douglas solicita localizar o backup técnico anteriormente realizado do SagB e avaliar sua futura incorporação à arquitetura LOZE. Esta rodada é **somente leitura e documentação**. Não há autorização de restauração, reativação de banco remoto, schema, troca de Auth, deploy ou pagamento.

### Evidência apurada diretamente (17/11/2026)

1. **Projeto legado localizado:** na conexão Supabase da organização `Dathex` (id `ocukpnmthiknkexxuccs`), projeto `SagB` (ref `hfcpisvogbdlbsxnkjdv`, região `us-west-2`, criado em 25/02/2026), status **`INACTIVE`**, organização atualmente no Free. Isto comprova a referência e estado do projeto, mas **não prova existência de um backup íntegro ou data de último dump**. Não houve restore nem consultas às tabelas do banco inativo.
2. **Estrutura versionada:** o repositório `lozebr/sagb`, branch `develop`, possui `supabase/migrations/` com SQLs de vários módulos, incluindo NAGI, CID, TaskZei, Chat, autenticação de domínio, Central de Padrões etc. Há também `supabase/run_all_migrations.sql` e `supabase/manifest-sagb-operacional.md`. **Migration não é backup de dados/usuários/arquivos.**
3. **Snapshot de inventário (histórico, não atual):** `plans/auditoria_supabase_tabelas_2026-05-31.txt` contém listagem de tabelas e estimativas de registros/tamanhos de maio de 2026. É evidência de estrutura antiga, **não é um dump restaurável**.
4. **Manifesto atual do SagB:** `supabase/manifest-sagb-operacional.md`, com checagem 04/11/2026, classifica o projeto remoto operacional real como **NÃO VERIFICADO**. Não assumir que o projeto inativo Dathex corresponde à conexão atualmente utilizada em produção/preview; verificar URLs e consumidores de modo seguro.
5. **Google Drive:** buscas por nomes de backup do SagB e arquivos `.sql`, `.dump`, `.gz`, `.zip`, além de buscas em texto, localizaram arquivos de **conversas históricas sobre Backup e Segurança** e inventários, mas **nenhum artefato de dump completo identificado/validado** nas fontes consultadas. Isto não é prova de inexistência: backups podem estar em disco local, outra pasta, outro serviço ou no painel Supabase.
6. **Capacidade atual separada:** nos dois projetos LOZE Free foram aferidos por SQL, em 17/11, ~67 MB no banco `loze-products-incubator` e ~19 MB no `loze-client-apps-incubator`; **não há medição atual do volume do banco SagB**, inativo. Os projetos LOZE não foram alterados.

### Caminho de verificação segura (sem executar)

- [PV] Localizar o artefato real do SagB: painel do projeto legado (Backups/possibilidade de download quando pausado), disco local/HD, Drive ou storage externo; registrar nome, localizador, data, formato, tamanho, checksum, versão Postgres e escopo (schema/dados/Auth/Storage/secrets).
- [PV] Comprovar integridade por restauração **em ambiente isolado e autorizado**, sem importar sobre LOZE ou alterar projeto Dathex; comparar objetos, contagens, constraints, RLS, funções, Auth e buckets, reconhecendo que arquivos binários Storage requerem fluxo de cópia/backup independente.
- [PV] Reconciliar qual project ref é consumido hoje pelo código/deploy SagB, preservando a conexão existente e sem ler/expor credenciais.
- [PV] Somente após evidências, propor estratégia incremental por domínio para eventual `schema sagb` em `loze-products-incubator` (ou projeto dedicado, se isolamento exigir), com plano de migração de identidades, storage, RLS, rollback e gate QG. **Não autorizar incorporação automática do banco inteiro.**
- [PV] Priorizar login e NAGI conforme instrução QG; não iniciar auditoria geral de 12 dimensões agora. Noivalía continua na incubadora atual, sem transferência antecipada.

**Classificação:** [FDR] Douglas recorda backup anterior; [EVIDÊNCIA] migrations, inventário e projeto antigo encontrados; [PV] artefato de backup íntegro restaurável ainda não verificado. **Execução:** nenhuma mudança remota, pagamento ou restauração.

---

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


## 26-11-2026 — QG LOZE | Mega Operação SagB Supabase e Modularização — G0
- [DC] Direção autoriza incorporação progressiva a `loze-products-incubator` (`txyuwaffzgsjndqsralg`), schema pretendido `sagb`, e adoção modular. Não autoriza DDL sem liberação do owner Hub e coordenação Noivalía. IAM piloto sujeito a QG/Fábrica; produção não autorizada.
- [EVIDÊNCIA] Baseline develop `2416ee197b7e304aa1cf8697ecf9242ff9c96d61`, PR #6 Draft. Consultados README, este registro, P0 arquitetura/NAGI, manifesto operacional, registry, migrations, App.tsx, services/supabase.ts, workflows, NAGI, cadastro empresas, bridges/decisão de fusão agentes e auditoria prévia; fontes QG/Hub/Fábrica de develop, inclusive handoff IAM de 26/11.
- Supabase leitura 26/11: destino ACTIVE_HEALTHY, sagb ausente; crm 38/38 RLS, crm_homolog 34/34, public 8/8, private 6/6, loze_platform vazio. Flag RLS não prova políticas. Origem Dathex ref histórica hfcpisvogbdlbsxnkjdv; get_project atual negou permissão. Netlify sagbapp production tem valores públicos de build, Preview não; URL efetiva mascarada. Não reapontar.
- Backup histórico 17/08 localizado por metadado (10.820.142 bytes); materialização retornou HTTP 403; inventário anterior de 16/11 é histórico, não revalidação; restore, checksums e arquivos Storage pendentes. Preservar dump privado, não importar inteiro.
- 72 SQL migrations e 30 módulos registrados; 3 manifests fora registry. NAGI localStorage + 5 tabelas históricas vazias no snapshot anterior. Adaptador aceita schema.tabela, porém App possui nomes não qualificados, risco de acessar public de outros produtos. Registry Entity homologado; IAM 17/17 locais da Fábrica, ainda não homologado. Proposta de integração por mapa IDs e extensão DNA, sem cadastro concorrente.
- Entrega: `docs/reports/3fb006-sdvu-g0-mega-operacao-sagb-supabase-modularizacao-v0.1-26-11-2026.md` (matriz de capacidades, plano gates, backup/rollback, handoff e riscos); complemento do manifesto existente `supabase/manifest-sagb-operacional.md`. Somente documentação; não há migration nova, mudança de runtime, banco, auth, ambiente, produção, main ou outro repo. Sem teste funcional novo; API de CI do baseline não retornou runs/status. Não disparar workflow_dispatch (condição de produção).
- Status: AJUSTAR — G0 PARCIAL. Próximo gate: disponibilizar backup privado, restaurar isoladamente e inventariar; obter liberação explícita owner Hub sem conflito Noivalía e aprovação QG/Fábrica para piloto IAM; só então modelar/validar migrations alvo. Handoff preparado no relatório, sem alegar aceite.


## 26-11-2026 — Direção: triagem dos módulos para SagB como central de comandos
- Pedido: apresentar todos os módulos existentes em seleção interativa para o usuário indicar o que deve sair, especialmente produtos já separados; evoluir o SagB por necessidade, como central cotidiana de comandos e telas, sem migrar tudo de uma vez.
- Fontes: HEAD develop `5fa9e8b55d51732a8a9ee459156f9e6e06cf119e`, README, Registro Vivo, tarefas P0 arquitetura/NAGI, `src/core/modules/moduleRegistry.ts`, `src/modules/monitoramento/services/supabaseEcosystemRegistry.ts`, árvore Git (33 manifests), leitura dos 33 manifests e module-doc de NIC, CID, NIDE, FluxoB, RAI, Telas Avançadas, Agentes Comerciais, Foco Total, SagB Bridge, MCP SagB, Sala Dev.
- Evidência: 30 entradas no registry; 29 manifests com initialStatus active e FluxoB inactive; 3 manifests fora do registry (.centro_de_estudos, _orquestracao-principal, quadro_de_elite/Núcleo de Identidades). InitialStatus não prova menu efetivo ou ativação por usuário. NIDE documenta incorporação de Missões, Metodologias e Mentorias e ocultação/redirect de entradas originais; conservar fallback até provar paridade. TaskZei aparece como Agenda Inteligente (id agenda); Foco Total aparece como Zen Folk | Foco AI. Shell/Auth, DashboardHome, HubView, SystemicVision, GovernanceView e ManagementView são componentes fora desse inventário de manifests; não confundir com módulos descartáveis.
- [PV] Seleção nesta conversa é triagem de candidatos à retirada do SagB. Itens não marcados ficam sem decisão. Antes de retirar: confirmar produto substituto, consumidores/imports/rotas/dados e rollback, distinguir retirar do menu, integrar por referência e arquivar código; sem DROP, remoção de dados, alteração de outro produto ou mudança remota. Proposta de manter núcleo e adotar persistência dentro de sagb em ondas conforme uso, condicionada aos gates Hub/backup/IAM anteriores.
- Execução: consulta e Registro Vivo apenas. Nenhum módulo removido, nenhuma migration, código funcional, testes de runtime, deploy manual, main ou produção. Próximo gate: receber seleção explícita, reconciliar dependências e elaborar lote de limpeza reversível para develop. G0 anterior permanece parcial.


## 26-11-2026 — Direção: preservar ativação modular, revisar primeira experiência e consumir LOZE Modules
- Direção relatou ter marcado aproximadamente cinco módulos para retirada. Os IDs selecionados não chegaram como mensagem confirmada nesta rodada; nenhuma exclusão presumida. Preservar os demais, inclusive capacidade de ligar/desligar módulos e reordenar menu.
- Diagnóstico estático no HEAD develop `af95150ec3bf0c0a048fdb178aa57705ebb4d1a2`: `moduleActivation.ts` grava toggles, ordem e trava no localStorage (sagb:module-toggles:v3, sagb:module-order:v1, sagb:module-order-lock:v1); ConfigAmbientePage oferece contadores, drag/drop, trava e toggles. Sidebar e App escutam eventos e filtram/guardam rota, com retorno à home; ConfigAmbientePage lê/escreve escopo global enquanto App lê activeWorkspaceId e Sidebar usa workspaceId do perfil. Ordem/trava são locais e globais por navegador; toggles não são ACLs nem garantem parar subscriptions/background. IDs desconhecidos default true; módulos ocultos/aliases NIDE podem aparecer nas configurações sem entrada no menu. Início é configurável, mas deve permanecer fallback seguro e acesso às configurações recuperável. Proposta: fonte única de contexto e registry, separar visibilidade/preferência, disponibilidade e autorização IAM/RLS, preservar drag/drop e trava, adicionar presets/reset e sincronização por usuário/workspace quando houver gates Supabase. Não desligar Auth/recuperação, não apagar dados ao desligar.
- Design por inspeção de `components/Auth.tsx`, `DashboardHome.tsx`, `Sidebar.tsx`, `App.tsx`, ThemeContext/themeTokens e ConfigAmbientePage: login centralizado; inicialização 'Iniciando Protocolos...'; home padrão Centro de Comando com Pulso do Dia, Fluxo Vivo, Saúde, Inteligência acumulada, Alertas, navegação lateral e header; modo claro padrão, dark disponível; Robust Clean tokens teal #2FA99C, grafite #303842, fundo #F2F4F6. Shell/auth/dashboard usam classes e cores hardcoded além dos tokens; vários módulos ocultam shell/header, quebrando continuidade. Dashboard apresenta latência fixa 1.2s, saúde 78%/69%, alertas fixos; custo/tokens estimados por mensagens; inteligência acumulada derivada de tasks + businessUnits*10; tabs mudam seleção, não conteúdo, e default 'pulso' diverge do label 'pulso do dia'. Conversas/interações/fluxos consultam dados, sem prova de runtime remoto. Recomendar comando/busca como ação principal, módulos ativos/favoritos, atividade real, estados indisponível/não medido, navegação consistente e design tokens, não redesenho global. Sem captura ou login E2E nesta rodada; Preview Auth segue bloqueado conforme G0 anterior.
- Fábrica consultada em lozebr/loze-adm/develop `cce6fa8cb294b528593cf1786d639a85650df0a4`: catálogo 20 oficiais, 10 documentados, 2 implementados; Registro Vivo Fábrica de 26/11 substitui estados anteriores: Registry e IAM v0.1.1 candidatos Cloud First, SQL live transacional verde em ambos, CI Factory quality 45852468069 verde, 0 revisões 0.1.1 homologadas; Registry v0.1.0 homologado historicamente no preset Fornecedor/Noivalía, não CRUD integral Agente IA. SagB já indicado como primeiro ambiente de teste em produto real para módulos aplicáveis, não fonte de código nem laboratório obrigatório; portal LOZE Modules proposto modulos.loze.com.br, sem prova de publicação. Consultados README dos dois cores, catálogo, fila, Registro Vivo, handoff IAM e guia Cloud First 26/11. Fixar versão/SHA, adapter próprio, migrations por consumidor, testes signed Auth/RLS A×B/cross-schema e regressão, rollback, QG. Próximos módulos congelados pela Fábrica; settings-preferences-core e feature-flags-core são catálogo, não implementações disponíveis; onboarding-guided-setup-core candidato extra, não módulo oficial. Distinguir identidade/autorização de preferência e flag; usar jornada de início do acesso como referência para proposta de configuração inicial SagB, não atribuir wizard pronto ao IAM.
- Estado: diagnóstico e proposta, Registro Vivo atualizado; sem exclusões, código funcional, migrations, mudanças de banco/Auth/produção, testes de runtime ou main. Próximo gate: confirmar cinco nomes, revisar dependências e prototipar experiência inicial/central de módulos na develop; piloto IAM/Registry 0.1.1 depende Hub, backup e gates da Fábrica/QG. G0 permanece parcial.


## 26-11-2026 — P0 Direção: recuperar acesso antes do design
- Usuário suspendeu design/conteúdo e pediu entrar no SagB com a nova incubadora, sem uso operacional do banco antigo.
- Revalidação: destino ACTIVE_HEALTHY, schema sagb ausente; Netlify Preview sem URL/chave pública, produção configurada mas ref mascarada; Hub issue #74 aberto e sem comentários, liberação não comprovada. Fábrica IAM v0.1.1 candidato, signed Auth/piloto/QG pendentes; handoff Registry/IAM recomenda ordem Registry primeiro, a reconciliar com prioridade de acesso. Auth atual aceita sessão e consulta public sem admissão SagB, fallback OPERACIONAL, chave local de sessão não vinculada ao projeto; admin legado exige revisão. Não reapontar URL isoladamente.
- Plano de lote mínimo: `docs/tasks/3fb006-p0-sagb-acesso-primeiro-incubadora-loze-v0.1-26-11-2026.md`. Acesso real exige gate membership antes de shell/subscriptions, isolamento de dados, configuração Preview, conta autorizada/convite ou recuperação e testes. Backup preservado; não restaurar integralmente nem exigir migração de todos os módulos para o piloto. Sem DDL, alteração de Auth, usuário, chave, código funcional, deploy, main ou produção. G0 permanece parcial; aguardando owner/QG para execução estrutural. 


## 26-11-2026 — START A: preparação Identity & Access Core
- Direção autorizou incorporação versionada, adapter e preparação na develop; sem acesso remoto antes do gate. Baseline 8c4e5c9a244a6da5f3ed76415d7c8c35e54f2be4. Fonte oficial LOZE ADM 0fd27045b49d5a29fadd8a02a8e653519c794904, v0.1.1; os 17 Git blobs do vendor foram conferidos contra a árvore canônica antes do commit. Consultei README, Registro Vivo, P0 arquitetura/NAGI/acesso, registry, guia Cloud First e Registro Vivo Fábrica. PR #8 Biblioteca LOZE paralelo tem snapshot próprio; reconciliar na integração futura, não alterar trabalho alheio.
- Novo `src/modules/identity-access/`: vendor integral, module-source.json, manifest/doc/index (metadados; não registrado nem ativado), adapter de admissão por RPC oficial, escopo product/sagb e permission sagb.access.enter propostas, testes de contrato e CI sem deploy. Sem substituição do login, sem montagem no shell, sem migrations aplicáveis, sem DDL ou credenciais. Testes incluídos; execução CI a confirmar. O adapter usa getUser antes/depois e deny por falha, não é autoridade final de RLS, depende de cliente corretamente vinculado ao projeto e usuário. Nenhum login real disponível ainda.
- Próximo gate: validar CI, implementar bootstrap seguro/isolamento, reconciliar Biblioteca, solicitar Hub/QG #74 para migrations e sessão real. G0 parcial; sem main/produção/Netlify/usuário/dados alterados.


## 26-11-2026 — START A: integração do fluxo de acesso candidato
- Baseline bbea925f8c29f476a68aa43f872421e760dd729c; CI anterior 45880601284 concluiu sucesso (vendor TS/testes, adapter TS/testes e npm run check); NAGI smoke 45880615245 falhou na instalação Chromium, sem executar navegador. Hub #74 sem comentários na consulta; não há liberação estrutural.
- Implementação: bootstrap em index.tsx usa import dinâmico; novo project ref ou flag VITE_SAGB_IAM_PILOT=true seleciona AccessPilotPage, não monta App legado/ThemeProvider. SDK Supabase existente, sessão por ref, cliente público, PKCE recuperação na mesma aba, getUser + RPC IAM no schema sagb, revalidação por evento/visibilidade/intervalo, deny por falha, sem signup ou admin legado. Fetch do cliente candidato allowlist Auth e RPC; não habilita módulos de negócio nem protege endpoints serverless antigos por si só; backend/RLS continua gate obrigatório. Tela pós-admissão é confirmação de acesso, não o dashboard operacional. O modo legado permanece como antes quando não selecionado.
- Testes de contrato adicionados (config, chave pública, allowlist, revisão contra respostas antigas, recuperação); não representam sessão real/integração navegador. Build e CI deste commit a confirmar. Sem dependência nova, sem alteração vendor ou migrations aplicáveis; sem reconfigurar Netlify/Auth/banco, provisionar conta, main ou produção. Próximo: gate Hub/QG, QA candidato, instalação autorizada e provisionamento mínimo. G0 permanece parcial.


## 26-11-2026 — START A: pacote mínimo de migrations IAM / handoff Hub
- Revalidação somente leitura: incubadora ACTIVE_HEALTHY, sagb e noivalia ausentes na consulta de schemas; crm/crm_homolog/private/public presentes. Hub #74 aberto, sem comentários na leitura inicial. CI 45881229987 success para código candidato; NAGI UI Smoke 45881237733 failure, regressão visual não homologada.
- Pacote de revisão em `supabase/review/identity-access/`: install.sql.review (templates oficiais renderizados para sagb, 7 tabelas IAM, 3 helpers, uma role/permissão de entrada proposta, guard de colisão, asserts e rollback obrigatório), qa-admission.sql.review (A/B/C sintéticos e revogação), README (gates e rollback). Fora da trilha autoaplicável. Não há conta, membership, dado histórico ou migration aplicada. CLI/psql/PostgreSQL local ausentes; SQL não executado, QA/geração CLI pendentes. Revisão P0 helpers SECURITY DEFINER e interface Data API pelo Hub/Fábrica; não expor schema nesta rodada. G0 permanece parcial; sem alterações remotas, Netlify, main ou produção.

- Handoff enviado e conferido no Hub #74: https://github.com/lozebr/loze-hub/issues/74#issuecomment-7201277285 ; pacote fd0240a86e84b528ffc285af6641e7da436c03d0. Solicitação de liberação limitada IAM primeiro, owner/janela, RPC/ACL, backup, sessões A/B/C e Preview. Envio não equivale a aprovação; não aplicar até resposta formal.

- Rechecagem solicitada pela Direção em 26/11: issue Hub #74 segue aberto com somente o comentário de solicitação SagB, sem aceite; Registro Vivo Hub develop f07cf47d2deb9440caab9279590e9910fa2d080c e Fábrica develop 299d0eb4cf6d5dca69d3395ddc68334855ae8a9c não registram liberação IAM. Consulta read-only confirma ausência de sagb/sagb_private/sagb_api/noivalia e presença crm (38), crm_homolog (34). Biblioteca tem Preview #9 READY segundo registro Fábrica, mas não é acesso IAM operacional. G1 bloqueado; sem DDL, Auth, deploy, main ou produção. Próxima ação útil independente: ensaio SQL em PostgreSQL descartável via CI sem credenciais ou conexão à incubadora.


## 26-11-2026 — Direção A: execução direta do acesso (homologação)
- Direção autorizou condução integral restrita ao SagB, incluindo schema, IAM, segurança, Preview e conta; sem outros produtos, novos custos, exclusão de dados ou produção. Esta autorização permite execução coordenada do domínio SagB; não implica homologação final QG/Fábrica nem permissão global Auth. Hub #74 sem resposta formal na leitura; registrar execução como decisão da Direção.
- Pré-check incubadora ACTIVE_HEALTHY, schemas sagb/sagb_private ausentes, Data API baseline public, graphql_public, crm, crm_homolog. QA transacional com templates IAM 0.1.1 adaptados (helpers SECURITY DEFINER em sagb_private não exposto, wrapper SECURITY INVOKER estreito sagb.iam_has_permission, revogação de SELECT browser nas tabelas IAM). Primeira tentativa falhou sintaxe do delimitador, corrigida; segunda retornou SAGB_IAM_QA_OK, verificou A autorizado, B outro escopo, C sem vínculo, AAL2 negado, escrita negada e revogação; rollback confirmado 0 namespaces. São claims SQL sintéticos, não JWT real. Aplicadas migrations 20261126191902 sagb_iam_011_initial_isolated_access e 20261126191930 sagb_iam_additive_data_api_exposure. Data API adicionou somente sagb, mantendo quatro schemas anteriores. 7/7 tabelas RLS, 3 helpers privados, 1 RPC invoker, anon sem execute, authenticated sem leitura direta das tabelas IAM; zero principals. CRM 38/38 e crm_homolog 34/34 RLS preservados em contagem. Security Advisor 5 INFO de RLS sem policies (negação por padrão intencional), 1 WARN Auth leaked password protection anterior não alterado. Não houve restauração histórica, criação de conta, sessão real ou alteração de outros objetos de produtos.
- SQL aplicado recuperado do histórico remoto em supabase/source-migrations/sagb/, separado de migrations legadas para impedir replay. Netlify tentativa criar VITE_SAGB_IAM_URL (builds, deploy-preview) retornou HTTP 403; nenhuma variável criada confirmada, não tentar sobrescrever produção. Preview PR #6 aberto draft develop→main; sem merge, sem deploy manual. Próximos gates reais: habilitar permissão escrita Netlify e confirmar e-mail autorizado, configurar Preview somente; signed Auth A/B/C e recuperação, validação do dashboard em ondas. Não afirmar acesso operacional. Backup legado ainda não restaurado. 


## 26-11-2026 — Direção: acesso e varredura de navegação
- Nova tentativa Netlify upsert VITE_SAGB_IAM_URL exclusiva builds/deploy-preview retornou HTTP 403. Nenhuma configuração alterada; não sobrescrever produção nem contornar ACL. E-mail da conta não informado. IAM instalado permanece sem login real validado; candidato não carrega shell legado.
- Direção definiu Home como lançador, módulos em tela inteira sem sidebar/header global, navegação interna esquerda e saída inferior esquerda; design suspenso. Revisão das 30 rotas do registry e componentes de entrada: relatório `docs/reports/3fb006-sdvu-varredura-navegacao-sagb-v0.1-26-11-2026.md`. Política central, fallback de saída e logout Home no rodapé; ajustes NIDE, NAGI, CID, Conversas, TaskZei, Central Padrões, CRM, Monitoramento, Gestão Financeira e MCP. Sem alteração de dados, IAM, vendor, Golden Seal, main/produção. QA de navegador por módulo, responsividade/subrotas e CI pendentes; não declarar mega varredura visual finalizada.


## 26-11-2026 — Acesso: identidade informada e revalidação da conexão
- Direção informou e-mail de acesso (omitido deste repositório) e confirmou liberação Netlify. Consulta restrita ao endereço informado retornou zero correspondências Auth na incubadora. Nenhuma conta, principal ou membership criado: conector não oferece Auth Admin invite/create, não inserir usuários diretamente em auth.users nem fabricar confirmação de e-mail/senha. Provisionar por fluxo oficial de Auth, verificar identidade confirmada e só então atribuir sagb-entry/product/sagb.
- Netlify nova tentativa após autorização: upsert VITE_SAGB_IAM_URL somente deploy-preview/builds retornou HTTP 403. Conexão ainda sem escrita efetiva; nenhuma alteração de ambiente, produção ou segredo. Não contornar ACL. Requer reconexão com escopo adequado ou configuração por owner. Variáveis dedicadas IAM exigem wiring de código antes de uso; não alterar valores globais.
- Build navegação 45883888401 aprovado; smoke 45883888468 falhou na instalação Playwright Chromium, sem navegador. Sem novo deploy, alterações Auth globais, dados ou main. Login real segue pendente.


## 26-11-2026 — Direção A: primeiro acesso no próprio SagB
- Implementado cadastro por link/OTP via SDK, retorno PKCE /auth/first-access, definição de senha após admissão, variáveis dedicadas VITE_SAGB_IAM_URL/PUBLIC_KEY, isolamento do legado preservado. Extensão consumer em supabase/review/identity-access/first-access.sql.review (não vendor): autorização única por e-mail/validade, RPC invoker + helper privado, sessão Auth recente real, sem senha preexistente, somente sagb-entry, sem reativação. Ensaio negativo sintético e rollback confirmados; primeira tentativa de apply_migration falhou internamente, leitura confirmou ausência de objeto. Sem e-mail/senha no repo. Instalação, autorização individual, CI e entrega e-mail/redirect e Preview a confirmar. Não alterar configurações globais Auth ou produção.

- Continuação: segunda aplicação confirmada, migration 20261126200133 sagb_iam_controlled_first_access; cópia de histórico remoto em supabase/source-migrations/sagb/20261126200133_sagb_iam_controlled_first_access.sql. Uma autorização privada individual, expira 03/12/2026 20:01 UTC, ainda não consumida. Nenhuma conta Auth criada ou senha definida, nenhum membership concedido. Security Advisor 6 INFO RLS sem policy intencionais, 1 WARN Auth global anterior mantido. Teste positivo de sessão assinada/entrega de email, redirects e Preview pendentes. Não houve alteração de configuração global Auth, outros schemas ou produção. CI do commit cf913e7bab46de6ad8480c5e960de34e948eded5 consultado; [{"name":"NAGI UI Smoke","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45887958052"},{"name":"Build (Supabase stack)","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45887958074"},{"name":"Deploy to Netlify (backup via Actions)","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45887958091"},{"name":"Enforce History Compliance","status":"completed","conclusion":"success","url":"https://github.com/lozebr/sagb/actions/runs/45887958048"},{"name":"SagB identity access preparation","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45887949153"}].


## 26-11-2026 — Incidente primeiro acesso após publicação
- Preview Netlify #6 6b08925f263fcc34706b8a39 READY commit 2eac98d77831090e821e1fc926de685e8bafd5ca. Variáveis existentes VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY gravadas exclusivamente em deploy-preview; produção não alterada. Usuário relatou e-mail com link e erro ao abrir. Consulta Auth restrita ao endereço confirmado: identidade criada 20:13:26 UTC, confirmação 20:13:41, zero sessões, sem vínculo IAM, autorização pendente. Logs Auth 20:13:28/41 mostram referer localhost:3000, status 200/303, sem sessão. Destino incorreto identificado; allow-list global não disponível no conector Supabase, não substituir Site URL/SMTP/template dos outros produtos. Necessário adicionar os dois callbacks exatos do Preview às Redirect URLs existentes. Não expor token, link ou e-mail nos registros.
- OTP signup gera senha aleatória internamente (upstream supabase/auth internal/api/otp.go); condição anterior de hash vazio incompatível com essa identidade. Correção SagB-only: RPC prepare exige sessão de e-mail recente, autorização nova e identidade criada após pré-autorização, grava fingerprint privado e vincula sessão; claim exige senha alterada, sessão original, ausência de outras sessões válidas, role única e consumo atômico. UI orienta link, define senha antes do claim, revoga outras sessões por SDK. Sem cadastro público com privilégégio, sem alteração Auth global. QA transacional negativo verde e rollback comprovado; migration candidata ainda não aplicada, build e E2E pendentes. Não afirmar acesso concluído.

- Continuação: migration 20261126201743 sagb_iam_first_access_password_setup aplicada, conferida por leitura, fonte supabase/source-migrations/sagb/20261126201743_sagb_iam_first_access_password_setup.sql. Autorização individual permanece pendente, nenhum vínculo antecipado; zero definers em sagb exposto. Advisors consultados (sem alterações globais). Código de43c9854b98cc6de539b50631b8301a1c799b74, CI [{"name":"NAGI UI Smoke","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45889978791"},{"name":"Enforce History Compliance","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45889978836"},{"name":"Deploy to Netlify (backup via Actions)","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45889978857"},{"name":"Build (Supabase stack)","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45889978764"},{"name":"SagB identity access preparation","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/45889972289"}]. Bloqueio restante: conector não oferece edição de Auth Redirect URLs; adicionar somente https://deploy-preview-6--sagbapp.netlify.app/auth/first-access e https://deploy-preview-6--sagbapp.netlify.app/auth/reset-password às URLs já existentes, não alterar Site URL, templates ou SMTP compartilhados. Usuário não deve enviar token nem reutilizar link consumido. E2E e painel completo pendentes.


## 26-11-2026 — Direção: cérebro SagB e referência visual
- Pedido de comparar todos os módulos e concentrar padrões/decisões neste chat, com futuros chats especialistas. Revisão estática de 30/30 rotas registradas e componentes de entrada, 3 legados fora registry, Home e Biblioteca LOZE PR #8 não mergeado. Proposta: Simulador Mentorias estética (branco, sombras discretas, tipografia média, ícones semânticos); NAGI shell/menu/saída; TaskZei tokens; Central Padrões organização; Biblioteca catálogo. Simulador possui nav e ações sem handler, gráfico circular fixo, falta saída própria/dark; não copiar implementação. Relatório docs/reports/3fb006-sagb-comparativo-visual-modulos-v0.1-26-11-2026.md. Não é homologação visual (sem browser autenticado/capturas de todas as telas); nenhuma alteração design/funcional, main, DB ou produção. Próximo gate: aprovar referência, comparar capturas reais e versionar padrão transversal SagB, distribuir brief por módulo.


## 26-11-2026 — Gestão Financeira GrupoB: diagnóstico preparatório
- Direção solicita evoluir Gestão Financeira multiempresa/venture e localizar Lecriza antes de handoff a chat especialista. Fontes SagB develop 0d292134968d9979f04b48939e8c7280bbcc6b36, Lecriza main 19ef6f0b8f9b43229bbc70c29b93a514c1f2dd8f (somente leitura), Fábrica LOZE develop 384c837703d48ff7cad251d48e53716f1bae3c6d. Relatório docs/reports/3fb006-sagb-diagnostico-gestao-financeira-grupob-v0.1-26-11-2026.md. SagB possui quatro tabelas históricas, CRUD/relatórios e estrutura bancária, mas escopo default-workspace, RLS ampla e segredos no serviço cliente impedem reaplicação; Lecriza foca crédito/negociação e Firebase, não ledger/rateio; Simulador tem motor de cenários em centavos. Proposta de fonte financeira nativa, rateio separado de liquidação, consolidação sem duplicar despesas, fases e gates. Handoff formal e START aguardam Direção. Nenhuma alteração funcional, banco, outros repos, main ou produção. Não foram verificados dados históricos nem acesso bancário real.


## 26-11-2026 — Handoff Gestão Financeira GrupoB (autorização A)
- Direção autorizou criar handoff para chat especialista Yasmin Rangel; fonte central permanece SagB. Baseline 47b08065259caaed9706b69f32bf135ac62feb5d, relatório financeiro previamente versionado, persona/ADR/manifest/Registro Vivo e padrões LOZE consultados. Handoff: docs/tasks/3fb006-handoff-sagb-gestao-financeira-grupob-v0.1-26-11-2026.md. Define escopo, propostas de domínio multiempresa e rateio, reutilização de Lecriza/Simulador/cores LOZE, segurança, UX e gates. Primeiro START do especialista limitado a G0 focal e contrato de domínio, sem código funcional/DDL. Arquitetura proposta aguarda aprovação, e implantação posterior exige gates próprios; IAM de entrada não equivale a autorização financeira. Dados históricos, acesso real, integração bancária e cadastro canônico pendentes. Nenhum teste/build/deploy necessário por alteração exclusivamente documental; nenhum Supabase, outro repo, main ou produção alterado. Próximo: Direção abrir chat e transmitir handoff; especialista retornar G0 ao Cérebro Central.


## 27-11-2026 — retomada login e administração
- Direção relata nova falha e autoriza conclusão do acesso e administradores. Auth confirmado, zero sessões, vínculo e consumo pendentes. Conector não contém ação para Auth Redirect URLs; tentativa de navegador retornou ausência do contexto conectado (não controlável neste chat). Documentação oficial exige allowlist; não alterar via SQL nem contornar. Último Preview #6 READY para baseline 03e845330b35a813af4cd1b590124611bfcab1d0. Preparada administração de acesso separada, escopo product/sagb, role sagb-access-admin / permission sagb.access.manage, bootstrap privado de uma só conta após claim válido, AAL2 sessão real para listar/autorizar/cancelar/revogar membros comuns, audit privado, sem promoção pela UI ou alteração Auth global. SQL candidato supabase/review/identity-access/access-admin.sql.review testado negativamente com rollback confirmado; UI MFA TOTP voluntário e endpoints limitados. Instalação, CI, signed Auth, redirect e acesso Home pendentes. Não afirmar 100%.

- Continuação 27/11: migration 20261127124406 sagb_iam_access_administration aplicada e conferida, catálogo uma role/permission admin e zero atribuições; autorização bootstrap privada para conta de primeiro acesso indicada pela Direção (sem e-mail no repo), expira 03/12/2026 20:01 UTC, pendente de claim real após link e senha. AAL2 exigido no backend para administração, sem promoção de administradores pela UI; novas autorizações para identidades novas; não revogar conta global. Advisors INFO RLS sem policy intencional e WARN Auth preexistente, sem alteração global. Fonte supabase/source-migrations/sagb/20261127124406_sagb_iam_access_administration.sql. Commit código cf6bbcc2b05617a4559fddd11d04f9161dc20073; CI consultado: [{"name":"NAGI UI Smoke","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/46001096644"},{"name":"Deploy to Netlify (backup via Actions)","status":"in_progress","conclusion":null,"url":"https://github.com/lozebr/sagb/actions/runs/46001096609"},{"name":"Enforce History Compliance","status":"completed","conclusion":"success","url":"https://github.com/lozebr/sagb/actions/runs/46001096828"},{"name":"Build (Supabase stack)","status":"completed","conclusion":"success","url":"https://github.com/lozebr/sagb/actions/runs/46001096797"},{"name":"SagB identity access preparation","status":"completed","conclusion":"success","url":"https://github.com/lozebr/sagb/actions/runs/46001086828"}]. Redirect URLs não alteradas por falta de ação de configuração ou navegador; sem contorno de segurança, teste positivo de sessão/MFA/operadores, UI e Home ainda não concluídos. Necessário operar painel Supabase com acesso autorizado (Work/browser ou owner). Nenhuma alteração em outros schemas, main, cobrança ou produção.


## 27-11-2026 — P0 acesso: reincidência confirmada às 10h06 BRT
- Direção relata que nova tentativa falhou após entrega da administração IAM. Releitura de AccessPilotPage, pilotConfig, migration 20261127124406 e Registro Vivo; develop 1edaf5254573dba2a9570d81adfab60c8c3e9f64. Auth da identidade indicada continua confirmada desde 26/11, zero sessões, last_sign_in_at nulo, sem principal IAM; autorização individual válida até 03/12 20:01 UTC, não preparada nem consumida. Logs Auth de 27/11 12:40:15/36 e 13:06:42/58 UTC mostram user_recovery_requested 200 e login 303 com referer http://localhost:3000. Incidente de redirect persiste; tentativas foram recuperação, não fluxo de primeiro acesso que atribui vínculo. Preview develop 6b097b42f6e8e9a936258ce2 READY. Nenhuma ação disponível no conector para editar Auth URL configuration; busca de plugins não revelou alternativa específica; Browser list_tabs falhou por falta de contexto conectado e é somente leitura nesta sessão. Não modificar Auth via SQL, não contornar confirmação nem criar administrador antes de sessão legítima. Próximo gate: owner/Work com painel autenticado adicionar somente callbacks exatos do Preview à allowlist sem apagar entradas, preservar Site URL/SMTP/templates; depois novo primeiro acesso, senha e MFA, teste logout/login, administração e Home. Se painel negar salvar, capturar erro específico sem tokens e tratar restrição com owner/suporte. Sem mudanças funcionais, banco, deploy ou produção nesta conferência.


## 27-11-2026 — Handoff P0 de acesso para VS Code
- Direção solicitou tarefa para executar no VS Code, não no ChatGPT Work. Criado docs/tasks/3fb006-p0-sagb-finalizar-login-administracao-v0.1-27-11-2026.md; Google Docs https://docs.google.com/document/d/1jEHz11NNFD9JJeIx9xcVzsvqCgpJT_3xht6XZ1fb5Og/edit. Inclui evidência de reincidência localhost, callbacks exatos, Management API oficial ou painel autenticado, gates de primeiro acesso/senha/MFA/admin/Home, QA, limites e recibo. Não houve mudança funcional, banco, produção ou deploy. Próximo gate: execução pelo agente VS Code e retorno com evidências.


## 27-11-2026 — Handoff de continuidade do Cérebro Central SagB
- Direção solicitou iniciar novo chat central do SagB. Consolidado handoff docs/tasks/3fb006-handoff-sagb-cerebro-central-v0.1-27-11-2026.md a partir do HEAD b54842502684eafedd6cff9d3a58624810ed9b58, README, Registro Vivo, decisão arquitetural, P0 NAGI, manifesto, relatórios visual/navegação, handoff Financeiro, tarefa VS Code e consulta de PRs abertos (#6/#8/#9). Preserva autoridade da Direção, modernização incremental, P0 login/admin/Home, fontes LOZE, governança de especialistas, limites e padrão visual ainda proposto. Tarefa VS Code deve ser reconciliada, sem duplicação de execução; status Auth/deploy reproduz último registro, não nova validação live. Alteração exclusivamente documental, sem banco, código funcional, main, produção ou deploy deliberado. Próximo gate: novo chat ler fontes, consultar recibo VS Code e retomar P0. Não criar Registro Vivo concorrente.

## 27-11-2026 — Execução VS Code: G1 resolvido, primeiro acesso real concluído
- Clone lozebr/sagb develop b548425 (baseline f787c1f + handoff). Logs Auth: tentativas de 27/11 eram signInWithOtp (user_recovery_requested + mail magic_link) com redirect resolvido http://localhost:3000 = Site URL, ou seja, emailRedirectTo do Preview recusado pela allowlist; code PKCE nunca chegou ao callback. Location não é registrado; evidência via campo referer resolvido. Sem credencial Management API local; Direção adicionou no painel exatamente os dois callbacks do deploy-preview-6, sem alterar Site URL/SMTP/templates.
- Verificação sem efeito colateral (GET /auth/v1/verify com token inválido): first-access e reset-password → 303 para o próprio callback; controle mesmo host /auth/nao-liberada e domínio externo → localhost (sem wildcard amplo).
- Preview: callbacks retornam SPA 200; bundle aponta ref txyuwaffzgsjndqsralg, chave anon JWT; zero sb_secret/service_role.
- Primeiro acesso real 14:15–14:16 UTC: sessão magiclink AAL1, autorização consumida atomicamente pelo próprio subject, bootstrap zerado, prepare limpo, 1 principal, membership product/sagb ativa, roles sagb-entry e sagb-access-admin (1 admin total), audit 0, MFA 0.
- Negativos anon: RPCs IAM/admin e tabelas sagb → 42501; sagb_private não exposto (PGRST106); senha inválida → 400.
- Defeito encontrado: "Verificar minhas permissões" respondia 200, mas revalidação por foco/refresh trocava a tela para checking e desmontava o painel. Corrigido com revalidação silenciosa quando admitido (negação/logout continuam imediatos). Testes 10/10 módulo, 20/20 vendor, 41/41 projeto, build verde. CI NAGI UI Smoke falha por infraestrutura (Playwright sem suporte a ubuntu26.04), não relacionado.
- Pendentes: MFA TOTP/AAL2 real, autorizar/cancelar/revogar usuário comum de teste, negativos sem MFA/revogado/outro admin, login/logout/refresh/recuperação manual, Home autenticada (G3). Não afirmar 100%.

## 27-11-2026 — Ativação e reconciliação do novo Cérebro Central — 27/11
- START da Direção: continuidade incremental, governança central, sem nova auditoria geral e sem duplicar P0 VS Code. Handoff oficial, Registro Vivo, README, decisão arquitetural, NAGI, manifesto, relatórios 03/11 e 26/11, tarefa P0, handoff Financeiro e padrões/catálogo/guia LOZE consultados; leitura integral de todos os documentos ainda não concluída (limite de exibição dos documentos longos). Baseline consultada develop `01f31839ab846b3f5d8e031201f4281c0ad24aa0`, main `14bea63a83ffad3b1dcce5ef7db08928007aa8ae`. PR #6 draft develop→main, #8 Biblioteca→develop aberto, #9 Biblioteca→main draft; PRs históricos #1/#2/#3/#5 preservados, issue #7 proposta multiagentes aberta.
- VS Code: `1ac89a10` revalidação silenciosa, `14bfe3b5` recuperação de tentativa TOTP interrompida, `01f31839` recusa administrativa sem limpar lista. Histórico modular e Registro Vivo registram primeiro acesso e MFA AAL2 real; última correção não equivale à homologação completa. Supabase consulta somente leitura: projeto loze-products-incubator ACTIVE_HEALTHY; 7 tabelas sagb, 2 sagb_private, 5 migrations IAM registradas; 1 principal, 1 membership ativa product/sagb, 1 admin, 1 autorização consumida, 1 fator MFA verificado, 1 linha de auditoria administrativa (resultado específico não investigado). Nenhum dado pessoal ou segredo extraído. Netlify site sagbapp confirmado; status GitHub netlify/sagbapp/deploy-preview success no baseline, build/compliance/deploy backup success, NAGI UI Smoke failure (falha de infraestrutura Playwright descrita pelo executor; logs desta rodada não inspecionados). Preview estável https://deploy-preview-6--sagbapp.netlify.app/; não houve teste autenticado próprio neste chat.
- Próximo gate: receber recibo final VS Code para G2 (usuário comum, autorizar/cancelar/revogar, negativos, login/logout/refresh/recuperação), G3 Home autenticada segura sem montar legado contra incubadora. Não repetir migrations, IAM, redirect já corrigido ou execução concorrente. Financeiro G0 focal independente após START; Biblioteca PR #8 revisar compatibilidade antes de eventual merge develop; padrão visual e Entity Registry aguardam gates. Nenhuma alteração funcional, banco, configuração, produção, merge, deploy manual ou testes locais; apenas leituras e este registro documental. Manter proteção Golden Seal e preservar Dathex; não declarar acesso integral ou 100%.


## 27-11-2026 — Direção: demonstração temporária sem login
- Autorização explícita de abrir PR #6 sem senha temporariamente, mantendo IAM intacto. Consulta Dathex ref hfcpisvogbdlbsxnkjdv recusada por falta de permissão; escolhido caminho 2, sem reativar banco nem alterar variáveis compartilhadas. Baseline bbdb4c8ce1e01a271e0c33b81718d243b518398d.
- Modo somente no build PR #6 e hostname exato deploy-preview-6--sagbapp.netlify.app; identidade fictícia sem credencial, perfil member, módulos habilitados por padrão, storage volátil separado, CSP connect-src none/form-action none, fetch bloqueado antes de importar App, shim GET vazio, escrita rejeitada, sem polling shim. Vite demo não injeta VITE_*; backup workflow define flag apenas PR #6. IAM, main, Supabase e SMTP/redirects intactos. Não constitui homologação das operações de módulos, que permanecem sem dados reais. Reverter este commit em develop ou retirar condição do build demo e reconstruir Preview; não remover IAM. Testes de contrato adicionados; CI/build/validação visual ainda pendentes no momento deste registro. Nenhum deploy manual.
