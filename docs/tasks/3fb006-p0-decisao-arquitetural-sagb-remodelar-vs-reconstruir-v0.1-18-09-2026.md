# 3FB006 — SDVU — P0 — Decisão Arquitetural SagB: Remodelar x Strangler x Reconstruir — v0.2 — 19-09-2026

**Produto:** SagB
**Repositório:** `lozebr/sagb`
**Branch:** `develop`
**Status:** 🟡 AGUARDANDO AUDITORIA E DECISÃO
**Regra:** nenhuma reconstrução ou limpeza destrutiva autorizada por este documento.

# 1. Pergunta central
Definir com evidência se o SagB deve:

A) ser remodelado profundamente preservando partes maduras;
B) ser reconstruído do zero;
C) adotar migração incremental/strangler, mantendo partes antigas temporariamente enquanto novas camadas substituem as antigas.

# 2. Evidências iniciais já confirmadas
- registry central com 30 módulos registrados;
- Supabase configurado com auth, realtime, storage e migrations habilitadas;
- funções Netlify e rotas serverless;
- módulos com documentação, services e integrações próprias;
- NAGI, NIDE, Central de Padrões, Núcleo Conversacional, API SagB, Hub de Integrações e outros módulos já materializados;
- histórico com builds/testes registrados em diversas entregas;
- `App.tsx` ainda concentra muitas responsabilidades e mistura arquitetura antiga com módulos novos;
- business units e outras estruturas ainda aparecem hardcoded no app principal;
- coexistência de componentes globais legados e arquitetura modular;
- documentação de deploy/branch apresenta sinais de desatualização;
- múltiplas branches históricas e frentes antigas permanecem no repositório.

# 3. Hipótese inicial
A evidência inicial favorece **remodelação profunda / strangler** em vez de reescrita total.

Isso NÃO é decisão oficial. A hipótese deve ser testada.

# 4. Auditoria obrigatória antes da decisão
Mapear por domínio:
- frontend shell / App.tsx;
- registry e roteamento;
- módulos ativos;
- módulos legados;
- autenticação;
- Supabase / schema / migrations;
- APIs e Netlify Functions;
- integrações externas;
- estado/localStorage/mock;
- agentes e IA;
- design system;
- testes;
- build/deploy;
- documentação;
- segurança;
- dependências;
- performance;
- duplicidades;
- dados reais que não podem ser perdidos.

# 5. Classificação de cada parte
Cada módulo/camada deve receber uma das classes:

- 🟢 PRESERVAR
- 🟣 EXTRAIR / MODULARIZAR
- 🟠 REFATORAR
- 🟡 SUBSTITUIR GRADUALMENTE
- 🔴 REMOVER / ARQUIVAR
- ⚪ INVESTIGAR

# 6. Critérios de decisão
Comparar as três estratégias usando evidência objetiva:

- risco de perda de funcionalidade;
- risco de perda/corrupção de dados;
- custo de regressão;
- tempo até uma baseline demonstrável estável;
- acoplamento entre módulos;
- quantidade de código reaproveitável;
- qualidade dos contratos internos;
- cobertura de testes;
- facilidade de QA;
- segurança;
- manutenção futura;
- migração de usuários/dados;
- capacidade de rollback.

# 7. Regra contra reescrita por impulso
Não escolher reconstrução total apenas porque o código parece bagunçado.

Reconstrução do zero só pode ser recomendada se a auditoria demonstrar que:
- o núcleo reutilizável é pequeno ou inseguro;
- contratos e dados são mais caros de preservar no código atual do que migrar;
- o acoplamento impede evolução incremental;
- o custo/risco de refatoração supera claramente a reconstrução;
- existe plano de migração de dados, paridade funcional, rollback e QA.

# 8. Se a remodelação vencer
Aplicar estratégia por camadas:

1. congelar baseline;
2. inventariar funcionalidades;
3. criar testes de caracterização;
4. separar shell/core;
5. remover hardcodes para registry/config;
6. modularizar serviços;
7. reduzir `App.tsx`;
8. eliminar rotas/componentes duplicados;
9. consolidar estado e persistência;
10. arquivar legado comprovadamente morto;
11. validar módulo por módulo;
12. Deploy Preview contínuo;
13. somente depois promover nova baseline.

# 9. Resultado esperado da auditoria
Entregar:
- mapa real da arquitetura atual;
- inventário de módulos;
- matriz preservar/refatorar/substituir/remover;
- dívida crítica;
- dependências perigosas;
- dados que exigem preservação;
- estimativa comparativa remodelar x reconstruir;
- recomendação técnica;
- plano em ondas;
- riscos e rollback.

# 10. Gate
Após o relatório:

`AUDITORIA → PROPOSTA → APROVAÇÃO → EXECUÇÃO`

Não iniciar limpeza profunda ou reconstrução antes do gate.
# 11. Camada obrigatória — Auditoria de Módulos Reutilizáveis LOZE

Fonte canônica:
`lozebr/loze-adm/develop/docs/standards/3fb006-catalogo-mestre-modulos-reutilizaveis-loze-v1-17-09-2026.md`

A auditoria do SagB deve cruzar o produto contra os 20 módulos reutilizáveis canônicos e registrar, para cada um:
- necessidade no SagB;
- implementação local equivalente existente;
- aderência ou divergência da implementação local;
- maturidade do módulo canônico;
- possibilidade de consumo/acoplamento;
- dependências e bloqueios;
- prioridade de integração;
- ação recomendada.

Estados permitidos por módulo no produto:

- `NÃO APLICÁVEL`
- `NECESSÁRIO / AUSENTE`
- `EXISTE LOCALMENTE`
- `PRONTO PARA ACOPLAR`
- `ACOPLADO`
- `PARCIAL`
- `BLOQUEADO`
- `SUBSTITUIR LEGADO`

Regra: identificar um gap não autoriza integração automática. Adoção de módulo deve respeitar a maturidade do módulo, gate arquitetural, compatibilidade do produto e segurança.

Exemplo crítico: autenticação, usuários, memberships, roles e permissions devem ser confrontados com `identity-access-core`; a auditoria deve evitar recomendar uma nova solução isolada se o módulo transversal for o caminho aprovado.

# 12. Saída adicional obrigatória

O relatório final deve incluir uma matriz:

| Módulo LOZE | Precisa? | Existe localmente? | Estado canônico | Estado no SagB | Gap | Ação | Prioridade |
|---|---|---|---|---|---|---|---|

Essa matriz passa a compor a decisão de remodelar x strangler x reconstruir.
# 13. Escopo aprovado da auditoria — 12 dimensões

**Estado desta definição:** `APROVADO — ESCOPO DE AUDITORIA`

A auditoria do SagB deve obrigatoriamente cobrir as 12 dimensões abaixo. A aprovação deste escopo não aprova remodelação, strangler nem reconstrução; aprova apenas o método de diagnóstico.

## 13.1 Produto e escopo
- proposta de valor e finalidade real do SagB;
- funcionalidades que pertencem ao produto e funcionalidades que pertencem a outros produtos/serviços;
- escopo atual versus escopo desejado;
- telas, módulos e fluxos sem owner claro;
- funcionalidades prometidas, implementadas, parciais ou abandonadas.

## 13.2 Jornadas e funcionalidades
- mapear jornadas reais ponta a ponta;
- validar entrada, uso, salvar, editar, excluir, voltar, recarregar e retomar sessão;
- testar estados vazios, loading, erro, indisponibilidade e permissões;
- identificar telas sem função real, caminhos quebrados e funcionalidades zumbi;
- registrar paridade funcional obrigatória caso reconstrução seja considerada.

## 13.3 Arquitetura e código
- shell e `App.tsx`;
- registry, rotas e boundaries;
- acoplamento entre módulos;
- componentes globais e legados;
- duplicações;
- hardcodes;
- serviços, stores, hooks e utilitários;
- código morto e dependências sem consumidor;
- classificação PRESERVAR / EXTRAIR / REFATORAR / SUBSTITUIR / REMOVER / INVESTIGAR.

## 13.4 Módulos reutilizáveis LOZE
- cruzar o SagB contra os 20 módulos do catálogo canônico;
- identificar capacidade necessária, existente, ausente, parcial ou duplicada;
- evitar recriar localmente capacidade transversal sem justificativa;
- gerar matriz de módulos/gaps;
- transformar gaps aprovados em pendências P0–P3;
- respeitar maturidade e gate do módulo antes de acoplamento.

## 13.5 Dados e persistência
- schemas, tabelas, migrations, RLS e ownership;
- integridade e consistência;
- registros duplicados ou órfãos;
- localStorage, mocks e persistência temporária;
- backup, restore e rollback;
- risco de perda/corrupção;
- plano de migração de dados se houver substituição de arquitetura.

## 13.6 Auth, segurança e privacidade/LGPD
- login, usuários, memberships, roles e permissions;
- sessões, MFA e break-glass quando aplicável;
- secrets, service roles e exposição no browser;
- RLS deny-by-default quando aplicável;
- dados pessoais, retenção e exclusão;
- trilha de acesso e auditoria;
- superfícies administrativas e permissões excessivas;
- vulnerabilidades e riscos operacionais.

## 13.7 Integrações e contratos
- APIs internas e externas;
- Netlify Functions;
- Supabase;
- Loze Hub e demais produtos LOZE;
- webhooks, retries, idempotência e erros;
- contratos entre produtos;
- dependências circulares ou ownership incorreto;
- identificar responsabilidades que o SagB assumiu indevidamente.

## 13.8 UX, UI, acessibilidade e responsividade
- consistência visual e navegação;
- clareza das ações;
- teclado, foco, contraste e acessibilidade;
- desktop com prioridade em 1366×768;
- tablet e mobile;
- touch targets;
- overflow e layouts quebrados;
- PWA/offline/cache/service worker quando aplicável.

## 13.9 QA, testes e regressão
- testes unitários, integração e E2E existentes;
- cobertura de jornadas críticas;
- testes de caracterização antes de refatorar legado;
- smoke tests;
- regressão por módulo;
- erros de runtime/console;
- matriz de paridade caso reconstrução ou strangler avancem.

## 13.10 Infra, ambientes, deploy e observabilidade
- local/dev/preview/produção;
- variáveis de ambiente e secrets;
- divergências entre ambientes;
- branch policy e CI/CD;
- Deploy Preview;
- logs, health checks e tracing quando aplicável;
- alertas e capacidade de diagnosticar falhas;
- rollback e recuperação de incidente;
- serviços externos críticos.

## 13.11 Performance, escalabilidade, dependências e custo
- bundle e performance de frontend;
- queries, chamadas e gargalos;
- limites de banco/storage;
- consumo de IA e APIs;
- custos de infraestrutura e serviços externos;
- bibliotecas desatualizadas/abandonadas;
- vulnerabilidades e licenças;
- dependências duplicadas;
- capacidade de crescer sem reescrita emergencial.

## 13.12 Governança, versionamento e operação
- versão atual e fontes divergentes;
- maturidade do produto;
- CHANGELOG/Registro Vivo/documentação;
- owners por módulo/camada;
- pendências e decisões;
- runbook operacional;
- backups/restore;
- critérios de homologação;
- gate para `1.0.0`;
- integração das descobertas com ClickUp e fila P0–P3.

# 14. Regra de transformação de achado em execução

Todo achado relevante deve seguir:

`DESCOBERTA → EVIDÊNCIA → RISCO → AÇÃO PROPOSTA → P0/P1/P2/P3 → CLICKUP → RESPONSÁVEL → EXECUÇÃO → EVIDÊNCIA DE CONCLUSÃO → HOMOLOGAÇÃO`

Nenhuma descoberta deve permanecer apenas em texto solto quando exigir ação.

# 15. Paridade funcional obrigatória

Se reconstrução total ou strangler forem considerados, o relatório deve produzir matriz explícita de paridade:

| Função atual | Estado atual | Destino futuro | Estratégia | Paridade | Evidência |
|---|---|---|---|---|---|

Reconstrução não pode ser aprovada sem plano para preservar ou deliberadamente descontinuar cada função relevante.

# 16. Saída consolidada obrigatória

O relatório final deverá incluir:
- mapa do produto e arquitetura;
- inventário funcional;
- mapa das jornadas;
- matriz dos 20 módulos LOZE;
- inventário de dados e riscos de migração;
- matriz de auth/segurança/LGPD;
- matriz de integrações e contratos;
- auditoria UX/UI/responsiva/acessibilidade;
- matriz de testes/regressão;
- auditoria de ambientes/deploy/observabilidade;
- análise de performance/escalabilidade/custo/dependências;
- situação de governança e versionamento;
- matriz de paridade funcional;
- backlog P0–P3 derivado dos achados;
- comparação remodelar x strangler x reconstruir;
- recomendação técnica fundamentada;
- plano em ondas;
- rollback;
- próximo gate.

`APROVADO — ESCOPO DE AUDITORIA EM 12 DIMENSÕES`