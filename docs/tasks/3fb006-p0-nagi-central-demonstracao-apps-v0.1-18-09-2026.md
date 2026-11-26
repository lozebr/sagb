# 3FB006 — SDVU — P0 — NAGI Central de Demonstração de Apps — v0.1 — 18-09-2026

**Produto:** SAG B
**Módulo:** NAGI — Núcleo Avançado de Gestão de Ideias
**Branch:** `develop`
**Prioridade:** 🔴 P0 URGENTE
**Status:** 🟢 IMPLEMENTADA — PRONTA PARA HOMOLOGAÇÃO
**Produção:** não autorizada

# 1. Objetivo
Transformar a seção atual `Links publicados` do NAGI em uma Central de Demonstração de Apps simples, sem duplicações e adequada para reuniões.

Experiência desejada: abrir NAGI → ver todos os produtos relevantes → clicar no produto → abrir a versão demonstrável mais atual.

# 2. Estado atual verificado
Arquivos atuais:
- `src/modules/nagi/components/PublishedLinksSection.tsx`
- `src/modules/nagi/data/publishedLinks.ts`

O modelo atual é centrado em links. `PUBLISHED_APP_LINKS` cria uma entrada por URL e o componente renderiza um card por item. Logo, mais de uma URL do mesmo produto gera mais de um card.

Duplicidades já marcadas no próprio dataset:
- EDA 360;
- QG 3forB;
- TaskZei;
- outras entradas com notas de possível duplicidade.

Também há mistura de domínio customizado/produção, URL Netlify, legado, teste e matches por nome.

# 3. Mudança de modelo mental
Hoje: `1 URL = 1 CARD`.
P0 desejado: `1 PRODUTO CANÔNICO = 1 CARD`.

Um produto pode possuir vários links associados, mas apenas um alvo de demonstração ativo.

# 4. Registro canônico proposto
Cada produto demonstrável deve possuir, no mínimo:
- `productId` canônico;
- nome;
- empresa/venture;
- descrição curta;
- repositório GitHub;
- branch de trabalho;
- versão;
- estado de maturidade;
- `previewUrl` ativo;
- commit do preview;
- data/hora do preview;
- estado de QA;
- modo de acesso;
- URLs de legado/produção como metadados secundários;
- última validação.

# 5. Regra de deduplicação
A identidade é o `productId`, não URL, domínio, site Netlify ou nome parecido.

Exemplo: TaskZei pode ter produção antiga, preview atual e Netlify legado, mas deve renderizar apenas um card `TASKZEI`.

# 6. Alvo principal do botão
Prioridade:
1. Deploy Preview validado mais recente;
2. ambiente de homologação autorizado;
3. somente se não houver preview e houver decisão explícita, outro ambiente seguro.

Não usar produção como padrão para demonstração.

# 7. UI P0 — modo reunião
Regra visual:
- 1 produto = 1 card;
- 1 ação principal = `ABRIR DEMONSTRAÇÃO`;
- não mostrar URL extensa no card;
- não mostrar GitHub/Netlify bruto na visualização principal;
- mostrar nome, descrição curta, versão, maturidade, status do preview e última validação;
- detalhes técnicos ficam em área secundária.

# 8. Organização visual
P0:
- busca por produto;
- filtro por empresa/venture;
- filtro por status;
- um card por produto;
- botão principal grande;
- status visual;
- versão;
- última validação;
- sem duplicidade.

Depois:
- favoritos/fixados;
- modo apresentação;
- recentes;
- ordem manual;
- grupos por empresa/venture.

# 9. Status visual
- 🟢 ATUALIZADO / VALIDADO
- 🟡 COM RESSALVA
- 🔴 DESATUALIZADO / BLOQUEADO
- ⚪ NÃO VERIFICADO

A versão do produto não substitui o estado de QA/deploy.

# 10. Segurança
A central não deve virar catálogo público de sistemas internos. P0 pode manter o acesso atual do SAG B; etapa posterior deve tratar autenticação, perfil e acesso controlado.

# 11. Fonte dos dados
P0 pode começar com registro local versionado, desde que único e deduplicado.

Desenho futuro: GitHub + Netlify + Registro de Produtos + QA → Demo Registry → NAGI.

Não usar correspondência frágil por nome como identidade definitiva.

# 12. Critérios P0 de aceite
- [x] existe somente um card por produto;
- [x] duplicidades atuais foram reconciliadas sem apagar histórico útil;
- [x] cada card possui `productId` canônico;
- [x] produção não é demo padrão sem decisão;
- [x] botão principal abre preview/homologação vigente quando validado;
- [x] URL bruta não polui o card;
- [x] busca e filtros funcionam;
- [x] status visual existe;
- [x] versão/maturidade aparecem quando conhecidas;
- [x] links não verificados ficam bloqueados;
- [x] build passa;
- [x] smoke test executado;
- [x] responsividade validada em 1366×768, 768×1024 e 390×844;
- [x] Registro Vivo atualizado;
- [x] CHANGELOG atualizado;
- [x] decisão estrutural registrada em DECISIONS;
- [x] Deploy Preview da própria mudança gerado;
- [x] nenhuma publicação em produção sem aprovação.

# 13. Não fazer
- não apagar histórico para esconder duplicidades;
- não criar cards por domínio;
- não apontar tudo para produção;
- não misturar apps diferentes por compartilharem repo;
- não renomear produtos sem fonte;
- não publicar `main`;
- não alterar DNS;
- não criar autenticação nova nesta P0.

# 14. Próximo gate
`BUILD → SMOKE TEST → DEPLOY PREVIEW → VALIDAÇÃO VISUAL → APROVAÇÃO`.
Produção somente com autorização explícita.

# 15. Fechamento da execução — 18-09-2026
- dataset histórico: 32 registros;
- registro canônico: 26 produtos;
- duplicidades removidas da interface: 6;
- commit funcional validado: `b9a57be7ce194b58202ce7a3b353085603c3bf53`;
- PR de homologação: `#6` em draft;
- Deploy Preview: `https://deploy-preview-6--sagbapp.netlify.app`;
- testes, build, compliance e smoke Chromium: aprovados;
- produção: não publicada.

Status: 🟢 PRONTO PARA HOMOLOGAÇÃO.
