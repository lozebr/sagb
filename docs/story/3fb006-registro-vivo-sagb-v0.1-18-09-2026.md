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
