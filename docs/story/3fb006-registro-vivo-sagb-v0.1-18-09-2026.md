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